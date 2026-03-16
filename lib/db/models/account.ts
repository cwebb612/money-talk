import mongoose, { Schema, Document, Model } from "mongoose";

export type AccountType = "cash" | "stock" | "crypto" | "liability";

export interface IHolding {
  ticker: string;
  quantity: number;
  pricePerUnit: number;
}

export interface IAccount extends Document {
  name: string;
  type: AccountType;
  institutionUrl?: string;
  balance?: number;
  holdings: IHolding[];
  currentValue: number;
  createdAt: Date;
  updatedAt: Date;
}

const holdingSchema = new Schema<IHolding>(
  {
    ticker: { type: String, required: true },
    quantity: { type: Number, required: true },
    pricePerUnit: { type: Number, required: true },
  },
  { _id: false }
);

const accountSchema = new Schema<IAccount>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["cash", "stock", "crypto", "liability"],
      required: true,
    },
    institutionUrl: { type: String },
    balance: { type: Number },
    holdings: { type: [holdingSchema], default: [] },
    currentValue: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

const Account: Model<IAccount> =
  mongoose.models.Account || mongoose.model<IAccount>("Account", accountSchema);

export default Account;
