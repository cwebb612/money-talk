import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IActivity extends Document {
  accountId: Types.ObjectId;
  value: number;
  recordedAt: Date;
}

const activitySchema = new Schema<IActivity>({
  accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  value: { type: Number, required: true },
  recordedAt: { type: Date, default: Date.now },
});

activitySchema.index({ recordedAt: 1 });

const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", activitySchema);

export default Activity;
