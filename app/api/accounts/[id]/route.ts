import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth/session";
import connect from "../../../../lib/db/mongodb";
import Account from "../../../../lib/db/models/account";
import Activity from "../../../../lib/db/models/activity";
import { calculateAccountValue } from "../../../../lib/utils/money";
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
  const account = await Account.findById(new Types.ObjectId(id));
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  return NextResponse.json({ ...account.toObject(), _id: account._id.toString() });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connect();
  const account = await Account.findById(new Types.ObjectId(id));
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));

  if (body.name != null) account.name = body.name;
  if (body.institutionUrl != null) account.institutionUrl = body.institutionUrl;

  const submittedRecordedAt = body.recordedAt ? new Date(body.recordedAt) : new Date();

  const submittedValue = calculateAccountValue({
    type: account.type,
    balance: body.balance ?? account.balance,
    holdings: body.holdings ?? account.holdings,
  });

  const mostRecentActivity = await Activity.findOne({ accountId: account._id })
    .sort({ recordedAt: -1 })
    .lean();

  const toDateStr = (d: Date) => d.toISOString().split("T")[0];
  const isLatest =
    !mostRecentActivity ||
    toDateStr(submittedRecordedAt) >= toDateStr(mostRecentActivity.recordedAt);

  const submittedHoldings = body.holdings ?? account.holdings;

  if (isLatest) {
    if (body.balance != null) account.balance = body.balance;
    if (body.holdings != null) account.holdings = body.holdings;
    account.currentValue = submittedValue;
  }

  await account.save();

  await Activity.create({
    accountId: account._id,
    value: submittedValue,
    holdings: submittedHoldings,
    recordedAt: submittedRecordedAt,
  });

  return NextResponse.json({ ...account.toObject(), _id: account._id.toString() });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connect();
  const account = await Account.findById(new Types.ObjectId(id));
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  await account.deleteOne();
  return NextResponse.json({ ok: true });
}
