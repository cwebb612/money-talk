import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import connect from "../db/mongodb";
import ApiKey from "../db/models/apiKey";

export function generateApiKey(): string {
  return "mt_" + randomBytes(32).toString("hex");
}

export function keyPrefix(key: string): string {
  return key.slice(0, 11);
}

export async function validateApiKey(request: NextRequest): Promise<string | null> {
  const key = request.headers.get("X-API-Key");
  if (!key) return null;

  await connect();
  const apiKey = await ApiKey.findOneAndUpdate(
    { key },
    { lastUsedAt: new Date() },
    { new: false }
  ).lean();

  if (!apiKey) return null;
  return apiKey.userId.toString();
}
