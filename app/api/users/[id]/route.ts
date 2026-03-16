import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth/session";
import connect from "../../../../lib/db/mongodb";
import User from "../../../../lib/db/models/user";
import { hashPassword } from "../../../../lib/auth/password";
import { Types } from "mongoose";

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId as string | null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  await connect();
  const user = await User.findById(new Types.ObjectId(id));
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.username?.trim()) {
    const conflict = await User.findOne({ username: body.username.trim(), _id: { $ne: user._id } });
    if (conflict) return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    user.username = body.username.trim();
  }

  if (body.password) {
    user.passwordHash = await hashPassword(body.password);
  }

  await user.save();

  return NextResponse.json({
    _id: user._id.toString(),
    username: user.username,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? null,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (id === currentUserId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await connect();
  const result = await User.deleteOne({ _id: new Types.ObjectId(id) });
  if (result.deletedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(null, { status: 204 });
}
