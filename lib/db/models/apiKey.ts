import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IApiKey extends Document {
  userId: Types.ObjectId;
  name: string;
  key: string;
  prefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    prefix: { type: String, required: true },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

apiKeySchema.index({ userId: 1 });

const ApiKey: Model<IApiKey> =
  mongoose.models.ApiKey || mongoose.model<IApiKey>("ApiKey", apiKeySchema);

export default ApiKey;
