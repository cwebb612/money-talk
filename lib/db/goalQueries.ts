import { Types } from "mongoose";
import Goal, { IGoal } from "./models/goal";
import Account from "./models/account";
import Activity from "./models/activity";
import {
  GoalAccount,
  GoalDTO,
  GoalDirection,
  GoalFields,
  buildMetricSeries,
  goalDirection,
  isFireMode,
  metricValue,
  sortGoals,
  valueAtStart,
} from "../utils/goals";

type GoalDoc = Pick<
  IGoal,
  | "title"
  | "notes"
  | "metric"
  | "accountIds"
  | "direction"
  | "startValue"
  | "startDate"
  | "targetMode"
  | "targetAmount"
  | "targetGrowthRate"
  | "targetDate"
  | "fireInputs"
  | "status"
  | "achievedAt"
  | "showOnDashboard"
  | "priority"
  | "template"
  | "createdAt"
  | "updatedAt"
> & { _id: { toString(): string } };

export function toGoalDTO(goal: GoalDoc): GoalDTO {
  const fire = goal.fireInputs;
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
    fireInputs: fire
      ? {
          annualSpending: fire.annualSpending,
          withdrawalRate: fire.withdrawalRate,
          expectedReturn: fire.expectedReturn,
          currentAge: fire.currentAge,
          retirementAge: fire.retirementAge,
        }
      : null,
    status: goal.status,
    achievedAt: goal.achievedAt ?? null,
    showOnDashboard: goal.showOnDashboard ?? true,
    priority: goal.priority ?? 0,
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

type Prepared = { accounts: GoalAccount[]; direction: GoalDirection } | { error: string; status: number };

export async function prepareGoalFields(fields: GoalFields): Promise<Prepared> {
  if (!fields.accountIds.every((id) => Types.ObjectId.isValid(id))) return { error: "Account not found", status: 404 };
  const accounts = await loadGoalAccounts();
  if (!fields.accountIds.every((id) => accounts.some((a) => a._id === id))) return { error: "Account not found", status: 404 };

  const direction = goalDirection(fields, accounts);
  if (isFireMode(fields.targetMode) && direction === "decrease") return { error: "A FIRE goal cannot track debt", status: 400 };

  return { accounts, direction };
}

export async function nextGoalPriority(): Promise<number> {
  const last = await Goal.findOne({}, { priority: 1 }).sort({ priority: -1 }).lean();
  return last ? (last.priority ?? 0) + 1 : 0;
}

export async function startValueFor(fields: GoalFields, accounts: GoalAccount[], startDate: string, today: string): Promise<number> {
  if (startDate >= today) return metricValue(fields, accounts);
  const activities = await Activity.find({}, { accountId: 1, date: 1, value: 1 }).sort({ recordedAt: 1 }).lean();
  const types = new Map(accounts.map((a) => [a._id, a.type]));
  return valueAtStart(fields, accounts, buildMetricSeries(fields, activities, types), startDate, today);
}
