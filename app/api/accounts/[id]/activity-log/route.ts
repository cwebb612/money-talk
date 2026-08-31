import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Types } from "mongoose";
import { verifyToken } from "../../../../../lib/auth/session";
import connect from "../../../../../lib/db/mongodb";
import Activity from "../../../../../lib/db/models/activity";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId as string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const monthsParam = searchParams.get("months");

  await connect();

  const query: Record<string, unknown> = { accountId: new Types.ObjectId(id) };

  if (monthsParam && monthsParam !== "all") {
    const months = Number(monthsParam);
    if (!Number.isNaN(months) && months > 0) {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
      const cutoffStr = cutoff.toLocaleDateString("en-CA");
      query.date = { $gte: cutoffStr };
    }
  }

  const activities = await Activity.find(query)
    .sort({ date: -1, recordedAt: -1 })
    .lean();

  return NextResponse.json(
    activities.map((a) => ({
      _id: a._id.toString(),
      accountId: a.accountId.toString(),
      value: a.value,
      holdings: a.holdings,
      date: a.date,
      recordedAt: a.recordedAt,
    }))
  );
}
