import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Types } from "mongoose";
import { verifyToken } from "../../../../lib/auth/session";
import connect from "../../../../lib/db/mongodb";
import Goal from "../../../../lib/db/models/goal";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId as string | null;
}

export async function PUT(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const ids: unknown = body.ids;
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string" && Types.ObjectId.isValid(id))) {
    return NextResponse.json({ error: "ids must be a list of goal IDs" }, { status: 400 });
  }

  await connect();
  await Goal.bulkWrite(
    ids.map((id, priority) => ({ updateOne: { filter: { _id: new Types.ObjectId(id) }, update: { priority } } }))
  );

  return NextResponse.json({ ok: true });
}
