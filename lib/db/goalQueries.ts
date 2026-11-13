import { Document, Types } from "mongoose";
import Goal, { IGoal } from "./models/goal";
import Account from "./models/account";
import Activity from "./models/activity";
import { todayString } from "../utils/filters";
import {
  FIRE_DEBT_ERROR,
  GoalAccount,
  GoalDTO,
  GoalDirection,
  GoalFields,
  buildMetricSeries,
  goalDirection,
  isFireMode,
  metricValue,
  sortGoals,
  templateColor,
  valueOn,
} from "../utils/goals";

type GoalDoc = Omit<IGoal, keyof Document> & { _id: { toString(): string } };

export function toGoalDTO(goal: GoalDoc): GoalDTO {
  return {
    _id: goal._id.toString(),
    title: goal.title,
    notes: goal.notes ?? "",
    metric: goal.metric,
    accountIds: (goal.accountIds ?? []).map((id) => id.toString()),
    direction: goal.direction,
    startValue: goal.startValue,
    startDate: goal.startDate,
    targetMode: goal.targetMode,
    targetAmount: goal.targetAmount,
    targetGrowthRate: goal.targetGrowthRate ?? 0,
    targetDate: goal.targetDate ?? null,
    fireInputs: goal.fireInputs ? { ...goal.fireInputs } : null,
    status: goal.status,
    achievedAt: goal.achievedAt ?? null,
    showOnDashboard: goal.showOnDashboard ?? true,
    priority: goal.priority ?? 0,
    color: goal.color ?? templateColor(goal.template ?? null),
    template: goal.template ?? null,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}

export async function findGoals(filter: { dashboardOnly?: boolean } = {}): Promise<GoalDTO[]> {
  const query = filter.dashboardOnly ? { status: "active", showOnDashboard: true } : {};
  const goals = await Goal.find(query).lean<GoalDoc[]>();
  return sortGoals(goals.map(toGoalDTO));
}

export async function loadGoalAccounts(): Promise<GoalAccount[]> {
  const accounts = await Account.find({}, { name: 1, type: 1, currentValue: 1 }).lean();
  return accounts.map((a) => ({ _id: a._id.toString(), name: a.name, type: a.type, currentValue: a.currentValue ?? 0 }));
}

type Failure = { error: string; status: number };

export async function prepareGoalFields(
  fields: GoalFields
): Promise<{ accounts: GoalAccount[]; direction: GoalDirection } | Failure> {
  const accounts = await loadGoalAccounts();
  if (!fields.accountIds.every((id) => accounts.some((a) => a._id === id))) return { error: "Account not found", status: 404 };

  const direction = goalDirection(fields, accounts);
  if (isFireMode(fields.targetMode) && direction === "decrease") return { error: FIRE_DEBT_ERROR, status: 400 };

  return { accounts, direction };
}

export function goalDocFields(fields: GoalFields, direction: GoalDirection) {
  return { ...fields, accountIds: fields.accountIds.map((id) => new Types.ObjectId(id)), direction };
}

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

function startChanged(fields: GoalFields, previous: GoalDTO): boolean {
  const trackingChanged = fields.metric !== previous.metric || !sameIds(fields.accountIds, previous.accountIds);
  const startMoved = fields.startDate !== null && fields.startDate !== previous.startDate;
  return trackingChanged || startMoved;
}

async function valueOnDate(fields: GoalFields, accounts: GoalAccount[], date: string, today: string): Promise<number> {
  if (date >= today) return metricValue(fields, accounts);
  const activities = await Activity.find({}, { accountId: 1, date: 1, value: 1 }).sort({ recordedAt: 1 }).lean();
  const types = new Map(accounts.map((a) => [a._id, a.type]));
  return valueOn(buildMetricSeries(fields, activities, types), date) ?? 0;
}

export async function goalStart(
  fields: GoalFields,
  accounts: GoalAccount[],
  previous?: GoalDTO
): Promise<{ startDate: string; startValue: number } | Failure> {
  if (previous && !startChanged(fields, previous)) return { startDate: previous.startDate, startValue: previous.startValue };

  const today = todayString();
  const startDate = fields.startDate ?? today;
  if (startDate > today) return { error: "Start date cannot be in the future", status: 400 };

  return { startDate, startValue: await valueOnDate(fields, accounts, startDate, today) };
}

export async function nextGoalPriority(): Promise<number> {
  const last = await Goal.findOne({}, { priority: 1 }).sort({ priority: -1 }).lean();
  return last ? (last.priority ?? 0) + 1 : 0;
}
