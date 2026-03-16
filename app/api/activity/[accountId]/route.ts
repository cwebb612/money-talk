import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth/session";
import connect from "../../../../lib/db/mongodb";
import Activity from "../../../../lib/db/models/activity";
import { Types } from "mongoose";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountId } = await params;
  await connect();

  const activities = await Activity.find({
    accountId: new Types.ObjectId(accountId),
    userId: new Types.ObjectId(payload.userId as string),
  })
    .sort({ recordedAt: 1 })
    .lean();

  return NextResponse.json(
    activities.map((a) => ({
      _id: a._id.toString(),
      value: a.value,
      recordedAt: a.recordedAt,
    }))
  );
}
