import { cookies } from "next/headers";
import Link from "next/link";
import { verifyToken } from "../../lib/auth/session";
import connect from "../../lib/db/mongodb";
import Account from "../../lib/db/models/account";
import Activity from "../../lib/db/models/activity";
import NetWorthCard from "../../components/dashboard/NetWorthCard";
import AssetPieChart from "../../components/dashboard/AssetPieChart";
import AccountBreakdown from "../../components/dashboard/AccountBreakdown";

async function getDashboardData() {
  await connect();

  const accounts = await Account.find().sort({ type: 1 }).lean();
  const activities = await Activity.find().sort({ recordedAt: 1 }).lean();

  const accountTypes = new Map(accounts.map((a) => [a._id.toString(), a.type]));
  const dayMap = new Map<string, Map<string, number>>();

  for (const activity of activities) {
    const day = activity.date;
    if (!dayMap.has(day)) dayMap.set(day, new Map());
    dayMap.get(day)!.set(activity.accountId.toString(), activity.value);
  }

  const allDays = [...dayMap.keys()].sort();
  const latestValues = new Map<string, number>();
  const chartData: { date: string; value: number }[] = [];

  for (const day of allDays) {
    dayMap.get(day)!.forEach((value, accountId) => latestValues.set(accountId, value));

    let netWorth = 0;
    latestValues.forEach((value, accountId) => {
      const type = accountTypes.get(accountId);
      if (type === "liability") netWorth -= value;
      else if (type != null) netWorth += value;
    });

    chartData.push({ date: day, value: netWorth });
  }

  const currentNetWorth = accounts.reduce(
    (sum, a) => sum + (a.type === "liability" ? -a.currentValue : a.currentValue),
    0
  );
  const lastUpdated =
    activities.length > 0
      ? activities[activities.length - 1].recordedAt.toISOString()
      : new Date().toISOString();

  return {
    accounts: accounts.map((a) => ({
      _id: a._id.toString(),
      name: a.name,
      type: a.type,
      institutionUrl: a.institutionUrl ?? null,
      balance: a.balance ?? null,
      holdings: (a.holdings ?? []).map((h) => ({
        ticker: h.ticker,
        quantity: h.quantity,
        pricePerUnit: h.pricePerUnit,
      })),
      currentValue: a.currentValue,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
      updatedAt: a.updatedAt instanceof Date ? a.updatedAt.toISOString() : String(a.updatedAt),
    })),
    chartData,
    currentNetWorth,
    lastUpdated,
  };
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload?.userId) return null;

  const { accounts, chartData, currentNetWorth, lastUpdated } = await getDashboardData();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
      <NetWorthCard value={currentNetWorth} updatedAt={lastUpdated} chartData={chartData} />

      {accounts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
            No accounts yet. Add your first account to start tracking.
          </p>
          <Link
            href="/accounts/new"
            className="px-6 py-2 rounded-lg font-semibold text-sm text-black"
            style={{ backgroundColor: "var(--color-yellow)" }}
          >
            Add Account
          </Link>
        </div>
      ) : (
        <>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <AssetPieChart accounts={accounts as any} />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <AccountBreakdown accounts={accounts as any} />
        </>
      )}
    </div>
  );
}
