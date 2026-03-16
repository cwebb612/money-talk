import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../../lib/auth/session";
import connect from "../../../../../lib/db/mongodb";
import Account from "../../../../../lib/db/models/account";
import Activity from "../../../../../lib/db/models/activity";
import { calculateAccountValue } from "../../../../../lib/utils/money";
import { Types } from "mongoose";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance();

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId as string | null;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connect();
  const account = await Account.findById(new Types.ObjectId(id));
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  if (account.type !== "stock" && account.type !== "crypto") {
    return NextResponse.json({ error: "Only stock and crypto accounts support price refresh" }, { status: 400 });
  }

  const updatedHoldings = await Promise.all(
    account.holdings.map(async (h) => {
      try {
        const quote = await yf.quote(h.ticker.toUpperCase());
        const price = quote.regularMarketPrice;
        return { ticker: h.ticker, quantity: h.quantity, pricePerUnit: price ?? h.pricePerUnit };
      } catch {
        return { ticker: h.ticker, quantity: h.quantity, pricePerUnit: h.pricePerUnit };
      }
    })
  );

  account.holdings = updatedHoldings;
  account.currentValue = calculateAccountValue({ type: account.type, holdings: updatedHoldings });
  await account.save();

  await Activity.create({
    accountId: account._id,
    value: account.currentValue,
    holdings: updatedHoldings,
    recordedAt: new Date(),
  });

  return NextResponse.json({ ...account.toObject(), _id: account._id.toString() });
}
