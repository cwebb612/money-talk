export type ActivityRecord = { date: string; accountId: { toString(): string }; value: number };

/**
 * Walks activity records day by day, carrying each account's latest value forward.
 *
 * Algorithm:
 *   1. Group activities by date, keeping the last recorded value per account per day.
 *   2. Walk days ascending, carrying each account's latest known value forward so
 *      accounts without a new entry on a given day retain their previous value.
 *   3. Each day: pass the latest values to `toPoint`; a `null` result skips the day.
 *
 * Callers are responsible for fetching activities with whatever filters they need
 * (auth, date range, etc.) before calling this.
 *
 * @param activities Activity records, sorted ascending by recordedAt / date.
 * @param toPoint    Builds the series point for one day from each account's latest value.
 */
export function mapDailyLatest<T>(
  activities: ActivityRecord[],
  toPoint: (date: string, latestValues: Map<string, number>) => T | null
): T[] {
  const dayMap = new Map<string, Map<string, number>>();
  for (const activity of activities) {
    if (!dayMap.has(activity.date)) dayMap.set(activity.date, new Map());
    dayMap.get(activity.date)!.set(activity.accountId.toString(), activity.value);
  }

  const latestValues = new Map<string, number>();
  const series: T[] = [];
  for (const day of [...dayMap.keys()].sort()) {
    dayMap.get(day)!.forEach((value, accountId) => latestValues.set(accountId, value));
    const point = toPoint(day, latestValues);
    if (point !== null) series.push(point);
  }
  return series;
}

export function buildNetWorthSeries(
  activities: ActivityRecord[],
  accountTypes: Map<string, string>
): { date: string; value: number }[] {
  return mapDailyLatest(activities, (date, latestValues) => {
    const { assets, liabilities } = splitByType(latestValues, accountTypes);
    return { date, value: assets - liabilities };
  });
}

export interface AssetLiabilityPoint {
  date: string;
  assets: number;
  liabilities: number;
}

// Same carry-forward walk as buildNetWorthSeries, keeping assets and liabilities apart.
export function buildAssetLiabilitySeries(
  activities: ActivityRecord[],
  accountTypes: Map<string, string>
): AssetLiabilityPoint[] {
  return mapDailyLatest(activities, (date, latestValues) => ({ date, ...splitByType(latestValues, accountTypes) }));
}

function splitByType(latestValues: Map<string, number>, accountTypes: Map<string, string>) {
  let assets = 0;
  let liabilities = 0;
  latestValues.forEach((value, accountId) => {
    const type = accountTypes.get(accountId);
    if (type === "liability") liabilities += value;
    else if (type != null) assets += value;
  });
  return { assets, liabilities };
}

export interface AccountTotals {
  netWorth: number;
  investments: number;
  cash: number;
}

export function currentTotals(accounts: Array<{ type: string; currentValue?: number }>): AccountTotals {
  const byType: Record<string, number> = { cash: 0, investment: 0, liability: 0 };
  for (const account of accounts) byType[account.type] += account.currentValue ?? 0;
  return {
    netWorth: byType.cash + byType.investment - byType.liability,
    investments: byType.investment,
    cash: byType.cash,
  };
}
