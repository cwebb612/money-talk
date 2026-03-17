import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../../lib/auth/session";
import connect from "../../../../../lib/db/mongodb";
import Activity from "../../../../../lib/db/models/activity";
import { Types } from "mongoose";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId as string | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connect();

  const activities = await Activity.find({
    accountId: new Types.ObjectId(id),
  })
    .sort({ recordedAt: 1 })
    .lean();

  const dayMap = new Map<string, number>();
  for (const a of activities) {
    const day = a.date;
    dayMap.set(day, a.value);
  }

  const chartData = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));

  return NextResponse.json(chartData);
}
