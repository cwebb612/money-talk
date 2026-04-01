import connect from "../../../lib/db/mongodb";
import Account from "../../../lib/db/models/account";
import Activity from "../../../lib/db/models/activity";
import TrendsCard from "../../../components/analytics/TrendsCard";
import PredictionsCard from "../../../components/analytics/PredictionsCard";

async function getAnalyticsData() {
  await connect();

  const accounts = await Account.find().lean();
  const activities = await Activity.find().sort({ recordedAt: 1 }).lean();

  const accountTypes = new Map(accounts.map((a) => [a._id.toString(), a.type]));

  // Per-account history lookup
  const historyByDate = new Map<string, Map<string, number>>();
  for (const activity of activities) {
    const day = activity.date;
    if (!historyByDate.has(day)) historyByDate.set(day, new Map());
    historyByDate.get(day)!.set(activity.accountId.toString(), activity.value);
  }

  // Net worth chart data
  const allDays = [...historyByDate.keys()].sort();
  const latestValues = new Map<string, number>();
  const chartData: { date: string; value: number }[] = [];

  for (const day of allDays) {
    historyByDate.get(day)!.forEach((value, accountId) => latestValues.set(accountId, value));

    let netWorth = 0;
    latestValues.forEach((value, accountId) => {
      const type = accountTypes.get(accountId);
      if (type === "liability") netWorth -= value;
      else if (type != null) netWorth += value;
    });

    chartData.push({ date: day, value: netWorth });
  }

  // Per-account history
  const accountHistoryMap = new Map<string, { date: string; value: number }[]>();
  for (const activity of activities) {
    const id = activity.accountId.toString();
    if (!accountHistoryMap.has(id)) accountHistoryMap.set(id, []);
    accountHistoryMap.get(id)!.push({ date: activity.date, value: activity.value });
  }

  const accountData = accounts.map((a) => ({
    id: a._id.toString(),
    name: a.name,
    type: a.type as string,
    history: accountHistoryMap.get(a._id.toString()) ?? [],
  }));

  return { chartData, accountData };
}

export default async function AnalyticsPage() {
  const { chartData, accountData } = await getAnalyticsData();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-4xl font-bold" style={{ color: "var(--color-text)" }}>Analytics</h1>
        <span className="text-sm font-semibold px-2 py-1 rounded" style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "var(--color-yellow)" }}>
          beta
        </span>
      </div>
      <TrendsCard chartData={chartData} accountData={accountData} />
      <PredictionsCard chartData={chartData} />
    </div>
  );
}
