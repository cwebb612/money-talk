import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth/session";
import connect from "../../../../lib/db/mongodb";
import Activity from "../../../../lib/db/models/activity";
import Account from "../../../../lib/db/models/account";
import { buildNetWorthSeries } from "../../../../lib/utils/netWorth";

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

  const matchStage: Record<string, unknown> = {};
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    matchStage.recordedAt = dateFilter;
  }

  const accounts = await Account.find().select("_id type").lean();
  const accountTypes = new Map(
    accounts.map((a) => [a._id.toString(), a.type])
  );

  const activities = await Activity.find(matchStage)
    .sort({ recordedAt: 1 })
    .lean();

  const result = buildNetWorthSeries(activities, accountTypes);
  return NextResponse.json(result);
}
