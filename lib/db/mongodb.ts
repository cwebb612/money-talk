import mongoose from "mongoose";
import { seedUser } from "./seed";

const MONGO_URL = process.env.MONGO_URL!;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME!;

if (!MONGO_URL) {
  throw new Error("MONGO_URL environment variable is not set");
}
if (!MONGO_DB_NAME) {
  throw new Error("MONGO_DB_NAME environment variable is not set");
}

declare global {
  var _mongooseConnection: Promise<typeof mongoose> | undefined;
}

async function connect(): Promise<typeof mongoose> {
  if (global._mongooseConnection) {
    return global._mongooseConnection;
  }

  global._mongooseConnection = mongoose
    .connect(MONGO_URL, { dbName: MONGO_DB_NAME })
    .then(async (instance) => {
      await seedUser();
      return instance;
    });

  return global._mongooseConnection;
}

export default connect;
