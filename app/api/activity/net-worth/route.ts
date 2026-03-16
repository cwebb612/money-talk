import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth/session";
import connect from "../../../../lib/db/mongodb";
import Activity from "../../../../lib/db/models/activity";
import Account from "../../../../lib/db/models/account";
import { Types } from "mongoose";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  await connect();
  const userId = new Types.ObjectId(payload.userId as string);

  const matchStage: Record<string, unknown> = { userId };
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    matchStage.recordedAt = dateFilter;
  }

  const accounts = await Account.find({ userId }).select("_id type").lean();
  const accountTypes = new Map(
    accounts.map((a) => [a._id.toString(), a.type])
  );

  const activities = await Activity.find(matchStage)
    .sort({ recordedAt: 1 })
    .lean();

  // Group: per day, latest value per account
  const dayMap = new Map<string, Map<string, number>>();
  for (const activity of activities) {
    const day = activity.recordedAt.toISOString().split("T")[0];
    if (!dayMap.has(day)) dayMap.set(day, new Map());
    dayMap.get(day)!.set(activity.accountId.toString(), activity.value);
  }

  // Carry forward latest known value for each account into each day
  const allDays = [...dayMap.keys()].sort();
  const latestValues = new Map<string, number>();
  const result: { date: string; value: number }[] = [];

  for (const day of allDays) {
    const dayEntries = dayMap.get(day)!;
    dayEntries.forEach((value, accountId) => latestValues.set(accountId, value));

    let netWorth = 0;
    latestValues.forEach((value, accountId) => {
      const type = accountTypes.get(accountId);
      netWorth += type === "liability" ? -value : value;
    });

    result.push({ date: day, value: netWorth });
  }

  return NextResponse.json(result);
}
