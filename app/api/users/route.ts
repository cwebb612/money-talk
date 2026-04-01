import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/auth/session";
import connect from "../../../lib/db/mongodb";
import User from "../../../lib/db/models/user";
import { hashPassword } from "../../../lib/auth/password";

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId as string | null;
}

export async function GET() {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connect();
  const users = await User.find().sort({ createdAt: 1 }).lean();

  return NextResponse.json({
    currentUserId,
    users: users.map((u) => ({
      _id: u._id.toString(),
      username: u.username,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt ?? null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.username?.trim() || !body?.password) {
    return NextResponse.json({ error: "username and password are required" }, { status: 400 });
  }

  await connect();
  const existing = await User.findOne({ username: { $regex: new RegExp(`^${body.username.trim()}$`, "i") } });
  if (existing) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const passwordHash = await hashPassword(body.password);
  const user = await User.create({ username: body.username.trim(), passwordHash });

  return NextResponse.json(
    {
      _id: user._id.toString(),
      username: user.username,
      createdAt: user.createdAt,
      lastLoginAt: null,
    },
    { status: 201 }
  );
}
