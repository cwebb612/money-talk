import connect from "../../../lib/db/mongodb";
import Activity from "../../../lib/db/models/activity";
import { findGoals, loadGoalAccounts } from "../../../lib/db/goalQueries";
import { todayString } from "../../../lib/utils/filters";
import GoalsClient from "../../../components/goals/GoalsClient";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  await connect();

  const [goals, accounts, activities] = await Promise.all([
    findGoals(),
    loadGoalAccounts(),
    Activity.find({}, { accountId: 1, date: 1, value: 1 }).sort({ recordedAt: 1 }).lean(),
  ]);

  return (
    <GoalsClient
      goals={goals}
      accounts={accounts.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))}
      activities={activities.map((a) => ({ accountId: a.accountId.toString(), date: a.date, value: a.value }))}
      today={todayString()}
    />
  );
}
