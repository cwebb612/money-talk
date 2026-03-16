/**
 * @swagger
 * /api/keys:
 *   get:
 *     summary: List API keys
 *     description: Lists all API keys for the authenticated user. Requires a browser session.
 *     tags: [Key Management]
 *     responses:
 *       200:
 *         description: Array of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ApiKey'
 *       401:
 *         description: Not logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create API key
 *     description: Creates a new API key. The full key is returned **once only** — store it immediately.
 *     tags: [Key Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Home automation
 *                 description: A label to identify the key
 *     responses:
 *       201:
 *         description: Key created. The `key` field is returned once only.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiKeyCreated'
 *       400:
 *         description: Missing name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/auth/session";
import connect from "../../../lib/db/mongodb";
import ApiKey from "../../../lib/db/models/apiKey";
import { generateApiKey, keyPrefix } from "../../../lib/auth/apiKey";
import { Types } from "mongoose";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId as string | null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connect();
  const keys = await ApiKey.find({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(
    keys.map((k) => ({
      _id: k._id.toString(),
      name: k.name,
      key: k.key,
      prefix: k.prefix,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    }))
  );
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  await connect();
  const rawKey = generateApiKey();
  const apiKey = await ApiKey.create({
    userId: new Types.ObjectId(userId),
    name: body.name.trim(),
    key: rawKey,
    prefix: keyPrefix(rawKey),
  });

  return NextResponse.json(
    {
      _id: apiKey._id.toString(),
      name: apiKey.name,
      key: apiKey.key,
      prefix: apiKey.prefix,
      createdAt: apiKey.createdAt,
      lastUsedAt: null,
    },
    { status: 201 }
  );
}
