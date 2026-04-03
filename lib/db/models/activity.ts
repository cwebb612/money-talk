import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IActivityHolding {
  ticker: string;
  quantity: number;
  pricePerUnit: number;
}

export interface IActivity extends Document {
  accountId: Types.ObjectId;
  value: number;
  holdings: IActivityHolding[];
  date: string; // YYYY-MM-DD in the user's local timezone
  recordedAt: Date;
}

const activityHoldingSchema = new Schema<IActivityHolding>(
  {
    ticker: { type: String, required: true },
    quantity: { type: Number, required: true },
    pricePerUnit: { type: Number, required: true },
  },
  { _id: false }
);

const activitySchema = new Schema<IActivity>({
  accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  value: { type: Number, required: true },
  holdings: { type: [activityHoldingSchema], default: [] },
  date: { type: String, required: true },
  recordedAt: { type: Date, default: Date.now },
});

activitySchema.index({ recordedAt: 1 });
activitySchema.index({ date: 1 });
activitySchema.index({ accountId: 1, date: 1 });

const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", activitySchema);

export default Activity;
