import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { NOTE_MAX_LENGTH } from "../../utils/notes";

export interface INote extends Document {
  body: string;
  date: string | null;
  accountId: Types.ObjectId | null;
  authorId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    body: { type: String, required: true, maxlength: NOTE_MAX_LENGTH },
    date: { type: String, default: null },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", default: null },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

noteSchema.index({ date: 1 });
noteSchema.index({ accountId: 1 });

const Note: Model<INote> =
  mongoose.models.Note || mongoose.model<INote>("Note", noteSchema);

export default Note;
