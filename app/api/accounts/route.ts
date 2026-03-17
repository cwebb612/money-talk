import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/auth/session";
import connect from "../../../lib/db/mongodb";
import Account from "../../../lib/db/models/account";
import Activity from "../../../lib/db/models/activity";
import { calculateAccountValue } from "../../../lib/utils/money";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId as string | null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connect();
  const accounts = await Account.find().sort({ type: 1 }).lean();

  return NextResponse.json(
    accounts.map((a) => ({ ...a, _id: a._id.toString() }))
  );
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.type) {
    return NextResponse.json({ error: "name and type are required" }, { status: 400 });
  }

  const validTypes = ["cash", "investment", "liability"];
  if (!validTypes.includes(body.type)) {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
  }

  if ((body.type === "cash" || body.type === "liability") && body.balance == null) {
    return NextResponse.json({ error: "balance is required for cash and liability accounts" }, { status: 400 });
  }

  if (body.type === "investment" && !Array.isArray(body.holdings)) {
    return NextResponse.json({ error: "holdings array is required for investment accounts" }, { status: 400 });
  }

  await connect();

  const account = await Account.create({
    name: body.name,
    type: body.type,
    institutionUrl: body.institutionUrl ?? undefined,
    notes: body.notes ?? undefined,
    balance: body.balance ?? undefined,
    holdings: body.holdings ?? [],
    currentValue: 0,
  });

  const currentValue = calculateAccountValue({
    type: account.type,
    balance: account.balance,
    holdings: account.holdings,
  });

  account.currentValue = currentValue;
  await account.save();

  await Activity.create({
    accountId: account._id,
    value: currentValue,
    holdings: account.holdings ?? [],
    date: body.date ?? new Date().toISOString().split("T")[0],
    recordedAt: new Date(),
  });

  return NextResponse.json(
    { ...account.toObject(), _id: account._id.toString() },
    { status: 201 }
  );
}
