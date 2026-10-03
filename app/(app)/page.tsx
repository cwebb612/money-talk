import { cookies } from "next/headers";
import Link from "next/link";
import { verifyToken } from "../../lib/auth/session";
import connect from "../../lib/db/mongodb";
import Account from "../../lib/db/models/account";
import Activity from "../../lib/db/models/activity";
import DashboardClient from "../../components/dashboard/DashboardClient";
import { PageContainer } from "../../components/ui/DashboardGrid";

async function getDashboardData() {
  await connect();

  const accounts = await Account.find().sort({ type: 1 }).lean();
  const activities = await Activity.find().sort({ recordedAt: 1 }).lean();

  const lastUpdated =
    activities.length > 0
      ? activities[activities.length - 1].date
      : new Date().toLocaleDateString("en-CA");

  const accountLastUpdated = new Map<string, string>();
  for (const activity of activities) {
    accountLastUpdated.set(activity.accountId.toString(), activity.date);
  }

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
      lastUpdated: accountLastUpdated.get(a._id.toString()) ?? null,
    })),
    activities: activities.map((act) => ({
      accountId: act.accountId.toString(),
      date: act.date,
      value: act.value,
    })),
    lastUpdated,
  };
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload?.userId) return null;

  const { accounts, activities, lastUpdated } = await getDashboardData();

  return (
    <PageContainer>
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
        <DashboardClient accounts={accounts} activities={activities} updatedAt={lastUpdated} />
      )}
    </PageContainer>
  );
}
