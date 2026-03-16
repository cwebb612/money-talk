import mongoose from "mongoose";
import { seedUser } from "./seed";

const MONGO_URL = process.env.MONGO_URL!;

if (!MONGO_URL) {
  throw new Error("MONGO_URL environment variable is not set");
}

declare global {
  var _mongooseConnection: Promise<typeof mongoose> | undefined;
}

async function connect(): Promise<typeof mongoose> {
  if (global._mongooseConnection) {
    return global._mongooseConnection;
  }

  global._mongooseConnection = mongoose
    .connect(MONGO_URL)
    .then(async (instance) => {
      await seedUser();
      return instance;
    });

  return global._mongooseConnection;
}

export default connect;
