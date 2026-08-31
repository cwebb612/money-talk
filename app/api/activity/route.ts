import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/auth/session";
import connect from "../../../lib/db/mongodb";
import Activity from "../../../lib/db/models/activity";
import Account from "../../../lib/db/models/account";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId as string | null;
}

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 200);
  const skip = Math.max(Number(searchParams.get("skip")) || 0, 0);

  await connect();

  const accounts = await Account.find().select("_id name type").lean();
  const accountsById = new Map(
    accounts.map((a) => [a._id.toString(), { name: a.name, type: a.type }])
  );

  const activities = await Activity.find()
    .sort({ recordedAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit + 1)
    .lean();

  const hasMore = activities.length > limit;
  const page = activities.slice(0, limit);

  const items = page
    .map((a) => {
      const account = accountsById.get(a.accountId.toString());
      if (!account) return null;
      return {
        _id: a._id.toString(),
        accountId: a.accountId.toString(),
        accountName: account.name,
        accountType: account.type,
        value: a.value,
        holdings: a.holdings,
        date: a.date,
        recordedAt: a.recordedAt,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return NextResponse.json({ items, hasMore });
}
