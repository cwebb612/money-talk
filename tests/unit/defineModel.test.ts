import mongoose, { Schema } from "mongoose";
import { defineModel } from "../../lib/db/defineModel";

describe("defineModel", () => {
  afterEach(() => {
    if (mongoose.models.StaleThing) mongoose.deleteModel("StaleThing");
  });

  it("keeps a field that an older registration of the same model did not have", () => {
    mongoose.model("StaleThing", new Schema({ title: String }));

    const Thing = defineModel("StaleThing", new Schema({ title: String, color: String }));
    const doc = new Thing({ title: "Goal", color: "red" });

    expect(doc.toObject().color).toBe("red");
  });

  it("keeps the field in an update", () => {
    mongoose.model("StaleThing", new Schema({ title: String }));

    const Thing = defineModel("StaleThing", new Schema({ title: String, color: String }));
    const query = Thing.findByIdAndUpdate(new mongoose.Types.ObjectId(), { color: "red" });

    expect(query.getUpdate()).toEqual({ color: "red" });
    expect(Thing.schema.path("color")).toBeDefined();
  });
});
