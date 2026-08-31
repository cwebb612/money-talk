import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Types } from "mongoose";
import { verifyToken } from "../../../../../lib/auth/session";
import connect from "../../../../../lib/db/mongodb";
import Activity from "../../../../../lib/db/models/activity";
import Account from "../../../../../lib/db/models/account";
import { calculateAccountValue } from "../../../../../lib/utils/money";
import { resyncAccountFromActivities } from "../../../../../lib/utils/activitySync";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId as string | null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { activityId } = await params;
  await connect();

  const activity = await Activity.findById(activityId);
  if (!activity) return NextResponse.json({ error: "Activity not found" }, { status: 404 });

  const account = await Account.findById(activity.accountId);
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));

  if (account.type === "investment") {
    if (!Array.isArray(body.holdings)) {
      return NextResponse.json({ error: "holdings array is required for investment accounts" }, { status: 400 });
    }
    activity.holdings = body.holdings;
    activity.value = calculateAccountValue({ type: account.type, holdings: body.holdings });
  } else {
    if (typeof body.value !== "number" || Number.isNaN(body.value)) {
      return NextResponse.json({ error: "value is required" }, { status: 400 });
    }
    activity.value = body.value;
  }

  await activity.save();
  await resyncAccountFromActivities(account._id);

  return NextResponse.json({
    _id: activity._id.toString(),
    accountId: activity.accountId.toString(),
    value: activity.value,
    holdings: activity.holdings,
    date: activity.date,
    recordedAt: activity.recordedAt,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { activityId } = await params;
  await connect();

  const activity = await Activity.findById(activityId);
  if (!activity) return NextResponse.json({ error: "Activity not found" }, { status: 404 });

  const remainingCount = await Activity.countDocuments({ accountId: activity.accountId });
  if (remainingCount <= 1) {
    return NextResponse.json(
      { error: "Can't delete the only activity record for an account" },
      { status: 400 }
    );
  }

  const accountId = activity.accountId as Types.ObjectId;
  await activity.deleteOne();
  await resyncAccountFromActivities(accountId);

  return NextResponse.json({ ok: true });
}
