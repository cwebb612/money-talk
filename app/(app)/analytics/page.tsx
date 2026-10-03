export const dynamic = "force-dynamic";

import connect from "../../../lib/db/mongodb";
import Account from "../../../lib/db/models/account";
import Activity from "../../../lib/db/models/activity";
import TrendsCard from "../../../components/analytics/TrendsCard";
import PredictionsCard from "../../../components/analytics/PredictionsCard";
import MonthlyChangeCard from "../../../components/analytics/MonthlyChangeCard";
import AssetsLiabilitiesCard from "../../../components/analytics/AssetsLiabilitiesCard";
import { buildNetWorthSeries, buildAssetLiabilitySeries } from "../../../lib/utils/netWorth";
import { PageContainer, DashboardGrid, GridModule } from "../../../components/ui/DashboardGrid";

async function getAnalyticsData() {
  await connect();

  const accounts = await Account.find().lean();
  const activities = await Activity.find().sort({ recordedAt: 1 }).lean();

  const accountTypes = new Map(accounts.map((a) => [a._id.toString(), a.type]));
  const chartData = buildNetWorthSeries(activities, accountTypes);
  const assetLiabilitySeries = buildAssetLiabilitySeries(activities, accountTypes);

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

  return { chartData, accountData, assetLiabilitySeries };
}

export default async function AnalyticsPage() {
  const { chartData, accountData, assetLiabilitySeries } = await getAnalyticsData();

  return (
    <PageContainer className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-4xl font-bold" style={{ color: "var(--color-text)" }}>Analytics</h1>
        <span className="text-sm font-semibold px-2 py-1 rounded" style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "var(--color-yellow)" }}>
          beta
        </span>
      </div>
      <DashboardGrid>
        <GridModule span="half" stretch>
          <TrendsCard chartData={chartData} accountData={accountData} />
        </GridModule>
        <GridModule span="half" stretch>
          <MonthlyChangeCard chartData={chartData} />
        </GridModule>
        <GridModule span="half" stretch>
          <AssetsLiabilitiesCard series={assetLiabilitySeries} />
        </GridModule>
        <GridModule span="half" stretch>
          <PredictionsCard chartData={chartData} />
        </GridModule>
      </DashboardGrid>
    </PageContainer>
  );
}
