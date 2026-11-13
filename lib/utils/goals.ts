import { DatedValue, dateToTimestamp } from "./monthWindow";
import { ActivityRecord, mapDailyLatest } from "./netWorth";
import { averageMonthlyChange } from "./projection";
import { coastFireNumber, fireNumber } from "./fire";
import { clamp } from "./math";
import { isDateString } from "./filters";
import { formatWholeUSD } from "./money";

export const GOAL_METRICS = ["netWorth", "assets", "investments", "cash", "liabilities", "debtRatio", "accounts"] as const;
export type GoalMetric = (typeof GOAL_METRICS)[number];

export const TARGET_MODES = ["fixed", "growing", "contribution", "fire", "coastFire"] as const;
export type TargetMode = (typeof TARGET_MODES)[number];

export const GOAL_STATUSES = ["active", "achieved", "archived"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export type GoalDirection = "increase" | "decrease";

export const METRIC_LABELS: Record<GoalMetric, string> = {
  netWorth: "Net worth",
  assets: "Total assets",
  investments: "Investments",
  cash: "Cash",
  liabilities: "Total debt",
  debtRatio: "Debt to assets",
  accounts: "Selected accounts",
};

export const TARGET_MODE_LABELS: Record<TargetMode, string> = {
  fixed: "Fixed",
  growing: "Growing",
  contribution: "Add amount",
  fire: "FIRE",
  coastFire: "Coast FIRE",
};

export function targetModeDescription(mode: TargetMode, direction: GoalDirection): string {
  switch (mode) {
    case "fixed":
      return "Reach one set amount.";
    case "growing":
      return "The target goes up by a set percent each year.";
    case "contribution":
      return direction === "decrease"
        ? "Pay down a set amount from the value on the start date."
        : "Add a set amount to the value on the start date. Market growth counts.";
    case "fire":
      return "Invest enough to live on your investments. The target is your yearly spending divided by the withdrawal rate.";
    case "coastFire":
      return "Invest enough now that growth alone gets you to FIRE by your retirement age.";
  }
}

export const GOAL_TITLE_MAX_LENGTH = 100;
export const GOAL_NOTES_MAX_LENGTH = 2000;
export const DEFAULT_MONTHLY_SPENDING = 4000;
export const EMERGENCY_FUND_MONTHS = 6;

export interface FireInputs {
  annualSpending: number;
  withdrawalRate: number;
  expectedReturn: number;
  currentAge: number;
  retirementAge: number;
}

export interface GoalFields {
  title: string;
  notes: string;
  metric: GoalMetric;
  accountIds: string[];
  targetMode: TargetMode;
  targetAmount: number;
  targetGrowthRate: number;
  targetDate: string | null;
  fireInputs: FireInputs | null;
  showOnDashboard: boolean;
  template: string | null;
  startDate: string | null;
}

export interface GoalDTO extends GoalFields {
  _id: string;
  direction: GoalDirection;
  startValue: number;
  startDate: string;
  status: GoalStatus;
  achievedAt: string | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalAccount {
  _id: string;
  name?: string;
  type: string;
  currentValue: number;
}

type GoalTarget = Pick<GoalDTO, "targetMode" | "targetAmount" | "targetGrowthRate" | "fireInputs" | "startDate" | "direction" | "startValue">;

export const DEFAULT_FIRE_INPUTS: FireInputs = {
  annualSpending: 48000,
  withdrawalRate: 4,
  expectedReturn: 7,
  currentAge: 30,
  retirementAge: 60,
};

export function emptyGoalFields(): GoalFields {
  return {
    title: "",
    notes: "",
    metric: "netWorth",
    accountIds: [],
    targetMode: "fixed",
    targetAmount: 0,
    targetGrowthRate: 3,
    targetDate: null,
    fireInputs: null,
    showOnDashboard: true,
    template: null,
    startDate: null,
  };
}

export function goalFieldsOf(goal: GoalDTO): GoalFields {
  return {
    title: goal.title,
    notes: goal.notes,
    metric: goal.metric,
    accountIds: goal.accountIds,
    targetMode: goal.targetMode,
    targetAmount: goal.targetAmount,
    targetGrowthRate: goal.targetGrowthRate,
    targetDate: goal.targetDate,
    fireInputs: goal.fireInputs,
    showOnDashboard: goal.showOnDashboard,
    template: goal.template,
    startDate: goal.startDate,
  };
}

const MAX_DEBT_RATIO = 1000;

export function isPercentMetric(metric: GoalMetric): boolean {
  return metric === "debtRatio";
}

export function formatGoalValue(metric: GoalMetric, value: number): string {
  return isPercentMetric(metric) ? `${Math.round(value)}%` : formatWholeUSD(value);
}

export function isFireMode(mode: TargetMode): boolean {
  return mode === "fire" || mode === "coastFire";
}

function sumValues(accounts: GoalAccount[]): number {
  return accounts.reduce((sum, a) => sum + a.currentValue, 0);
}

function selectedAccounts(goal: Pick<GoalFields, "accountIds">, accounts: GoalAccount[]): GoalAccount[] {
  return accounts.filter((a) => goal.accountIds.includes(a._id));
}

function allLiabilities(accounts: GoalAccount[]): boolean {
  return accounts.length > 0 && accounts.every((a) => a.type === "liability");
}

export function metricValue(goal: Pick<GoalFields, "metric" | "accountIds">, accounts: GoalAccount[]): number {
  const ofType = (type: string) => sumValues(accounts.filter((a) => a.type === type));
  switch (goal.metric) {
    case "netWorth":
      return ofType("cash") + ofType("investment") - ofType("liability");
    case "assets":
      return ofType("cash") + ofType("investment");
    case "investments":
      return ofType("investment");
    case "cash":
      return ofType("cash");
    case "liabilities":
      return ofType("liability");
    case "debtRatio": {
      const assets = ofType("cash") + ofType("investment");
      const debt = ofType("liability");
      if (assets <= 0) return debt > 0 ? MAX_DEBT_RATIO : 0;
      return Math.min(MAX_DEBT_RATIO, (debt / assets) * 100);
    }
    case "accounts": {
      const selected = selectedAccounts(goal, accounts);
      if (allLiabilities(selected)) return sumValues(selected);
      return selected.reduce((sum, a) => sum + (a.type === "liability" ? -a.currentValue : a.currentValue), 0);
    }
  }
}

export function goalDirection(goal: Pick<GoalFields, "metric" | "accountIds">, accounts: GoalAccount[]): GoalDirection {
  if (goal.metric === "liabilities" || goal.metric === "debtRatio") return "decrease";
  if (goal.metric === "accounts" && allLiabilities(selectedAccounts(goal, accounts))) return "decrease";
  return "increase";
}

const MS_PER_YEAR = 86400000 * 365.25;

export function yearsBetween(from: string, to: string): number {
  return (dateToTimestamp(to) - dateToTimestamp(from)) / MS_PER_YEAR;
}

function grow(amount: number, ratePercent: number, years: number): number {
  return amount * Math.pow(1 + ratePercent / 100, years);
}

export function baseTarget(goal: Pick<GoalFields, "targetMode" | "targetAmount" | "fireInputs">): number {
  if (isFireMode(goal.targetMode) && goal.fireInputs) {
    return fireNumber(goal.fireInputs.annualSpending, goal.fireInputs.withdrawalRate);
  }
  return goal.targetAmount;
}

export function targetAt(goal: GoalTarget, date: string): number {
  const years = Math.max(0, yearsBetween(goal.startDate, date));
  const base = baseTarget(goal);
  switch (goal.targetMode) {
    case "fixed":
      return base;
    case "growing":
    case "fire":
      return grow(base, goal.targetGrowthRate, years);
    case "contribution":
      return goal.direction === "increase" ? goal.startValue + base : goal.startValue - base;
    case "coastFire": {
      if (!goal.fireInputs) return base;
      const { currentAge, retirementAge, expectedReturn } = goal.fireInputs;
      const yearsLeft = retirementAge - currentAge - years;
      return coastFireNumber(grow(base, goal.targetGrowthRate, years), expectedReturn, goal.targetGrowthRate, yearsLeft);
    }
  }
}

export interface GoalProgress {
  current: number;
  target: number;
  percent: number;
  remaining: number;
  reached: boolean;
}

function progressPercent(goal: GoalTarget, current: number, target: number): number {
  const { direction, startValue: start } = goal;
  const fromZero = goal.targetMode !== "contribution" && direction === "increase" && target > 0 && start >= 0;
  if (fromZero) return clamp((current / target) * 100, 0, 100);
  const span = direction === "increase" ? target - start : start - target;
  if (span <= 0) return 0;
  const done = direction === "increase" ? current - start : start - current;
  return clamp((done / span) * 100, 0, 100);
}

export function goalProgress(goal: GoalTarget, current: number, date: string): GoalProgress {
  const target = targetAt(goal, date);
  const increase = goal.direction === "increase";
  const reached = increase ? current >= target : current <= target;
  return {
    current,
    target,
    reached,
    remaining: Math.max(0, increase ? target - current : current - target),
    percent: reached ? 100 : progressPercent(goal, current, target),
  };
}

export function buildMetricSeries(
  goal: Pick<GoalFields, "metric" | "accountIds">,
  activities: ActivityRecord[],
  accountTypes: Map<string, string>
): DatedValue[] {
  return mapDailyLatest(activities, (date, latestValues) => {
    const known: GoalAccount[] = [];
    latestValues.forEach((currentValue, _id) => {
      const type = accountTypes.get(_id);
      if (type) known.push({ _id, type, currentValue });
    });
    if (goal.metric === "accounts" && selectedAccounts(goal, known).length === 0) return null;
    return { date, value: metricValue(goal, known) };
  });
}

const MAX_PROJECTION_MONTHS = 1200;

export function addMonthsToDate(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1 + months, Math.min(d, 28)).toLocaleDateString("en-CA");
}

export function projectCompletion(
  goal: GoalTarget,
  history: DatedValue[],
  current: number,
  today: string
): string | null {
  const pace = averageMonthlyChange(history, dateToTimestamp(today));
  const increase = goal.direction === "increase";
  if ((increase ? pace : -pace) <= 0) return null;

  for (let month = 1; month <= MAX_PROJECTION_MONTHS; month++) {
    const date = addMonthsToDate(today, month);
    const value = current + pace * month;
    const target = targetAt(goal, date);
    if (increase ? value >= target : value <= target) return date;
  }
  return null;
}

export function requiredMonthly(
  goal: GoalTarget & Pick<GoalFields, "targetDate" | "metric">,
  current: number,
  today: string
): number | null {
  if (!goal.targetDate || goal.targetDate <= today || isPercentMetric(goal.metric)) return null;
  const months = Math.max(1, yearsBetween(today, goal.targetDate) * 12);
  const target = targetAt(goal, goal.targetDate);
  const gap = goal.direction === "increase" ? target - current : current - target;
  return Math.max(0, gap / months);
}

export function isOnTrack(targetDate: string | null, projected: string | null): boolean | null {
  if (!targetDate) return null;
  return projected !== null && projected <= targetDate;
}

export function nextMilestone(value: number): number {
  if (value < 10000) return 10000;
  if (value < 100000) return (Math.floor(value / 25000) + 1) * 25000;
  if (value < 1000000) return (Math.floor(value / 100000) + 1) * 100000;
  return (Math.floor(value / 500000) + 1) * 500000;
}

export function valueOn(history: DatedValue[], date: string): number | null {
  let found: number | null = null;
  for (const point of history) {
    if (point.date > date) break;
    found = point.value;
  }
  return found;
}

export const SUGGESTION_GROUPS = ["Debt", "Milestones", "Growth", "Savings and retirement"] as const;
export type SuggestionGroup = (typeof SUGGESTION_GROUPS)[number];

export interface GoalSuggestion {
  key: string;
  group: SuggestionGroup;
  title: string;
  description: string;
  draft: GoalFields;
}

export const MILLIONAIRE = 1_000_000;
export const BILLIONAIRE = 1_000_000_000;
export const DEBT_RATIO_TARGET = 20;
const DOUBLE_YEARS = 7;
const DEFAULT_YEARLY_ADD = 10000;

function formatShortDate(date: string): string {
  return new Date(dateToTimestamp(date)).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function suggestGoals(
  accounts: GoalAccount[],
  goals: Pick<GoalDTO, "template" | "status">[],
  netWorthHistory: DatedValue[],
  today: string
): GoalSuggestion[] {
  const taken = new Set(goals.filter((g) => g.status === "active").map((g) => g.template));
  const total = (metric: GoalMetric) => metricValue({ metric, accountIds: [] }, accounts);
  const netWorth = total("netWorth");
  const debt = total("liabilities");
  const cash = total("cash");
  const debtRatio = total("debtRatio");
  const suggestions: GoalSuggestion[] = [];

  function add(group: SuggestionGroup, key: string, title: string, description: string, fields: Partial<GoalFields>) {
    if (taken.has(key)) return;
    suggestions.push({ key, group, title, description, draft: { ...emptyGoalFields(), title, template: key, ...fields } });
  }

  function changeSince(months: number): number | null {
    const past = valueOn(netWorthHistory, addMonthsToDate(today, -months));
    return past === null ? null : netWorth - past;
  }

  if (netWorth < 0) {
    add("Debt", "positiveNetWorth", "Get to a positive net worth", "Get your net worth above $0.", { metric: "netWorth", targetAmount: 0 });
  }
  if (debt > 0) {
    add("Debt", "debtFree", "Become debt-free", `Pay off all ${formatWholeUSD(debt)} of debt.`, { metric: "liabilities", targetAmount: 0 });
    add("Debt", "debtDown", "Cut your debt in half", `Bring your debt down to ${formatWholeUSD(debt / 2)}.`, {
      metric: "liabilities",
      targetAmount: Math.round(debt / 2),
    });
    add("Debt", "payoffAccount", "Pay off an account", "Pick one debt account and bring it to $0.", { metric: "accounts", targetAmount: 0 });
  }
  if (debtRatio > DEBT_RATIO_TARGET) {
    add("Debt", "debtRatio", `Keep debt below ${DEBT_RATIO_TARGET}% of assets`, `Your debt is ${Math.round(debtRatio)}% of your assets now.`, {
      metric: "debtRatio",
      targetAmount: DEBT_RATIO_TARGET,
    });
  }

  const milestone = nextMilestone(netWorth);
  if (netWorth >= 0 && milestone !== MILLIONAIRE) {
    add("Milestones", "milestone", `Reach ${formatWholeUSD(milestone)} net worth`, `${formatWholeUSD(milestone - netWorth)} to go.`, {
      metric: "netWorth",
      targetAmount: milestone,
    });
  }
  if (netWorth > 0) {
    add("Milestones", "doubleNetWorth", "Double your net worth", `Reach ${formatWholeUSD(netWorth * 2)} in ${DOUBLE_YEARS} years.`, {
      metric: "netWorth",
      targetAmount: Math.round(netWorth * 2),
      targetDate: addMonthsToDate(today, DOUBLE_YEARS * 12),
    });
  }
  if (netWorth < MILLIONAIRE) {
    add("Milestones", "millionaire", "Become a millionaire", "Reach a $1,000,000 net worth.", { metric: "netWorth", targetAmount: MILLIONAIRE });
  }
  if (netWorth < BILLIONAIRE) {
    add("Milestones", "billionaire", "Become a billionaire", "Reach a $1,000,000,000 net worth. Dream big.", {
      metric: "netWorth",
      targetAmount: BILLIONAIRE,
    });
  }

  for (const [key, months, label] of [["beatLastMonth", 1, "month"], ["beatLastYear", 12, "year"]] as const) {
    const change = changeSince(months);
    if (change === null || change <= 0) continue;
    const by = addMonthsToDate(today, months);
    add("Growth", key, `Beat last ${label}'s growth`, `Grow more than ${formatWholeUSD(change)} by ${formatShortDate(by)}.`, {
      metric: "netWorth",
      targetMode: "contribution",
      targetAmount: Math.round(change),
      targetDate: by,
    });
  }
  add("Growth", "addThisYear", `Add ${formatWholeUSD(DEFAULT_YEARLY_ADD)} this year`, "Grow by a set amount from a start date.", {
    metric: "netWorth",
    targetMode: "contribution",
    targetAmount: DEFAULT_YEARLY_ADD,
    targetDate: addMonthsToDate(today, 12),
  });
  const cushion = DEFAULT_MONTHLY_SPENDING * EMERGENCY_FUND_MONTHS;
  if (cash > cushion) {
    const extra = cash - cushion;
    add("Growth", "investExtraCash", "Invest your extra cash", `Move about ${formatWholeUSD(extra)} above your emergency fund into investments.`, {
      metric: "investments",
      targetAmount: Math.round(total("investments") + extra),
    });
  }

  add("Savings and retirement", "emergencyFund", "Build an emergency fund", `${EMERGENCY_FUND_MONTHS} months of spending in cash.`, {
    metric: "cash",
    targetAmount: cushion,
  });
  add("Savings and retirement", "fire", "Reach FIRE", "Live on your investments: 25× your yearly spending.", {
    metric: "investments",
    targetMode: "fire",
    fireInputs: { ...DEFAULT_FIRE_INPUTS },
  });
  add("Savings and retirement", "coastFire", "Reach Coast FIRE", "Invest enough now that growth alone gets you to FIRE.", {
    metric: "investments",
    targetMode: "coastFire",
    fireInputs: { ...DEFAULT_FIRE_INPUTS },
  });

  return suggestions;
}

export function sortGoals<T extends Pick<GoalDTO, "priority" | "createdAt">>(goals: T[]): T[] {
  return [...goals].sort((a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt));
}

function isNumberIn(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

const MAX_AMOUNT = 1e12;
export const FIRE_DEBT_ERROR = "A FIRE goal cannot track debt";

function validateFireInputs(input: unknown, mode: TargetMode): string | null {
  if (typeof input !== "object" || input === null) return "fireInputs is required for FIRE goals";
  const f = input as Record<string, unknown>;
  if (!isNumberIn(f.annualSpending, 1, MAX_AMOUNT)) return "Annual spending must be more than $0";
  if (!isNumberIn(f.withdrawalRate, 0.1, 100)) return "Withdrawal rate must be between 0.1% and 100%";
  if (mode === "coastFire") {
    if (!isNumberIn(f.expectedReturn, 0, 100)) return "Expected return must be between 0% and 100%";
    if (!isNumberIn(f.currentAge, 0, 120)) return "Current age must be between 0 and 120";
    if (!isNumberIn(f.retirementAge, 0, 120)) return "Retirement age must be between 0 and 120";
    if (f.retirementAge <= f.currentAge) return "Retirement age must be more than current age";
  }
  return null;
}

export function validateGoalFields(input: unknown): { fields: GoalFields } | { error: string } {
  if (typeof input !== "object" || input === null) return { error: "Invalid goal" };
  const body = input as Record<string, unknown>;
  const defaults = emptyGoalFields();

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return { error: "Title is required" };
  if (title.length > GOAL_TITLE_MAX_LENGTH) return { error: `Title must be ${GOAL_TITLE_MAX_LENGTH} characters or fewer` };

  const notes = body.notes ?? "";
  if (typeof notes !== "string") return { error: "notes must be a string" };
  if (notes.length > GOAL_NOTES_MAX_LENGTH) return { error: `Notes must be ${GOAL_NOTES_MAX_LENGTH} characters or fewer` };

  if (!GOAL_METRICS.includes(body.metric as GoalMetric)) return { error: "Invalid metric" };
  const metric = body.metric as GoalMetric;

  const accountIds = body.accountIds ?? [];
  if (!Array.isArray(accountIds) || !accountIds.every((id) => typeof id === "string")) {
    return { error: "accountIds must be a list of account IDs" };
  }
  if (metric === "accounts" && accountIds.length === 0) return { error: "Select at least one account" };

  if (!TARGET_MODES.includes(body.targetMode as TargetMode)) return { error: "Invalid target type" };
  const targetMode = body.targetMode as TargetMode;
  if (isPercentMetric(metric) && targetMode !== "fixed") return { error: "A debt to assets goal must use a fixed target" };

  const targetGrowthRate = body.targetGrowthRate ?? defaults.targetGrowthRate;
  if (!isNumberIn(targetGrowthRate, 0, 100)) return { error: "Yearly growth must be between 0% and 100%" };

  let targetAmount = 0;
  let fireInputs: FireInputs | null = null;
  if (isFireMode(targetMode)) {
    if (metric === "liabilities") return { error: FIRE_DEBT_ERROR };
    const fireError = validateFireInputs(body.fireInputs, targetMode);
    if (fireError) return { error: fireError };
    const f = body.fireInputs as Record<string, number>;
    fireInputs = {
      annualSpending: f.annualSpending,
      withdrawalRate: f.withdrawalRate,
      expectedReturn: f.expectedReturn ?? DEFAULT_FIRE_INPUTS.expectedReturn,
      currentAge: f.currentAge ?? DEFAULT_FIRE_INPUTS.currentAge,
      retirementAge: f.retirementAge ?? DEFAULT_FIRE_INPUTS.retirementAge,
    };
    targetAmount = fireNumber(fireInputs.annualSpending, fireInputs.withdrawalRate);
  } else {
    if (!isNumberIn(body.targetAmount, -MAX_AMOUNT, MAX_AMOUNT)) return { error: "Target amount must be a number" };
    if (targetMode === "contribution" && body.targetAmount <= 0) return { error: "Amount to add must be more than $0" };
    targetAmount = body.targetAmount;
  }

  const targetDate = body.targetDate ?? null;
  if (targetDate !== null && !isDateString(targetDate)) return { error: "targetDate must be YYYY-MM-DD" };

  const showOnDashboard = body.showOnDashboard ?? defaults.showOnDashboard;
  if (typeof showOnDashboard !== "boolean") return { error: "showOnDashboard must be true or false" };

  const template = body.template ?? null;
  if (template !== null && typeof template !== "string") return { error: "template must be a string" };

  const startDate = body.startDate ?? null;
  if (startDate !== null && !isDateString(startDate)) return { error: "startDate must be YYYY-MM-DD" };

  return {
    fields: {
      title,
      notes: notes.trim(),
      metric,
      accountIds: metric === "accounts" ? [...new Set(accountIds as string[])] : [],
      targetMode,
      targetAmount,
      targetGrowthRate,
      targetDate,
      fireInputs,
      showOnDashboard,
      template,
      startDate: targetMode === "contribution" ? startDate : null,
    },
  };
}
