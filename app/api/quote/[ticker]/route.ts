import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/auth/session";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance();

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return !!payload?.userId;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticker } = await params;

  try {
    const quote = await yf.quote(ticker.toUpperCase());
    const price = quote.regularMarketPrice;
    if (!price) {
      return NextResponse.json({ error: "Price unavailable" }, { status: 404 });
    }
    return NextResponse.json({ ticker: ticker.toUpperCase(), price });
  } catch {
    return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
  }
}
