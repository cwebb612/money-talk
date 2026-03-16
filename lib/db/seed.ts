import User from "./models/user";
import { hashPassword } from "../auth/password";

export async function seedUser(): Promise<void> {
  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;

  if (!username || !password) return;

  const existing = await User.findOne({ username });
  if (existing) return;

  const passwordHash = await hashPassword(password);
  await User.create({ username, passwordHash });
}
