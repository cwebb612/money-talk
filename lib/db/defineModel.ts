import mongoose, { Model, Schema } from "mongoose";

export function defineModel<T>(name: string, schema: Schema<T>): Model<T> {
  if (mongoose.models[name]) mongoose.deleteModel(name);
  return mongoose.model<T>(name, schema);
}
