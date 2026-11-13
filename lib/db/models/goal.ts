import mongoose, { Schema, Document, Model, Types } from "mongoose";
import {
  FireInputs,
  GOAL_METRICS,
  GOAL_NOTES_MAX_LENGTH,
  GOAL_STATUSES,
  GOAL_TITLE_MAX_LENGTH,
  GoalDirection,
  GoalMetric,
  GoalStatus,
  TARGET_MODES,
  TargetMode,
} from "../../utils/goals";

export interface IGoal extends Document {
  title: string;
  notes: string;
  metric: GoalMetric;
  accountIds: Types.ObjectId[];
  direction: GoalDirection;
  startValue: number;
  startDate: string;
  targetMode: TargetMode;
  targetAmount: number;
  targetGrowthRate: number;
  targetDate: string | null;
  fireInputs: FireInputs | null;
  status: GoalStatus;
  achievedAt: string | null;
  showOnDashboard: boolean;
  priority: number;
  template: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const fireInputsSchema = new Schema<FireInputs>(
  {
    annualSpending: { type: Number, required: true },
    withdrawalRate: { type: Number, required: true },
    expectedReturn: { type: Number, required: true },
    currentAge: { type: Number, required: true },
    retirementAge: { type: Number, required: true },
  },
  { _id: false }
);

const goalSchema = new Schema<IGoal>(
  {
    title: { type: String, required: true, maxlength: GOAL_TITLE_MAX_LENGTH },
    notes: { type: String, default: "", maxlength: GOAL_NOTES_MAX_LENGTH },
    metric: { type: String, enum: GOAL_METRICS, required: true },
    accountIds: { type: [Schema.Types.ObjectId], ref: "Account", default: [] },
    direction: { type: String, enum: ["increase", "decrease"], required: true },
    startValue: { type: Number, required: true },
    startDate: { type: String, required: true },
    targetMode: { type: String, enum: TARGET_MODES, required: true },
    targetAmount: { type: Number, required: true },
    targetGrowthRate: { type: Number, default: 0 },
    targetDate: { type: String, default: null },
    fireInputs: { type: fireInputsSchema, default: null },
    status: { type: String, enum: GOAL_STATUSES, default: "active" },
    achievedAt: { type: String, default: null },
    showOnDashboard: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    template: { type: String, default: null },
  },
  { timestamps: true }
);

goalSchema.index({ status: 1, priority: 1 });

const Goal: Model<IGoal> = mongoose.models.Goal || mongoose.model<IGoal>("Goal", goalSchema);

export default Goal;
