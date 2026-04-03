/**
 * Aggregates activity records into a daily net-worth time series.
 *
 * Algorithm:
 *   1. Group activities by date, keeping the last recorded value per account per day.
 *   2. Walk days ascending, carrying each account's latest known value forward so
 *      accounts without a new entry on a given day retain their previous value.
 *   3. Each day: sum all account values, subtracting liabilities.
 *
 * Callers are responsible for fetching activities with whatever filters they need
 * (auth, date range, etc.) and building the accountTypes map before calling this.
 *
 * @param activities   Activity records, sorted ascending by recordedAt / date.
 * @param accountTypes Map of accountId string → account type string.
 */
export function buildNetWorthSeries(
  activities: Array<{ date: string; accountId: { toString(): string }; value: number }>,
  accountTypes: Map<string, string>
): { date: string; value: number }[] {
  const dayMap = new Map<string, Map<string, number>>();

  for (const activity of activities) {
    const day = activity.date;
    if (!dayMap.has(day)) dayMap.set(day, new Map());
    dayMap.get(day)!.set(activity.accountId.toString(), activity.value);
  }

  const allDays = [...dayMap.keys()].sort();
  const latestValues = new Map<string, number>();
  const series: { date: string; value: number }[] = [];

  for (const day of allDays) {
    dayMap.get(day)!.forEach((value, accountId) => latestValues.set(accountId, value));

    let netWorth = 0;
    latestValues.forEach((value, accountId) => {
      const type = accountTypes.get(accountId);
      if (type === "liability") netWorth -= value;
      else if (type != null) netWorth += value;
    });

    series.push({ date: day, value: netWorth });
  }

  return series;
}
