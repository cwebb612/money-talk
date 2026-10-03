import { DatedValue, dateToTimestamp, startOfMonth, timestampToDate } from "./monthWindow";

export interface MonthlyChange {
  month: string;
  change: number;
}

export interface MonthlyChangeSummary {
  averageChange: number;
  bestMonth: MonthlyChange | null;
  growthStreak: number;
}

function lastValueBefore(sortedData: DatedValue[], ts: number): number | undefined {
  let value: number | undefined;
  for (const d of sortedData) {
    if (dateToTimestamp(d.date) >= ts) break;
    value = d.value;
  }
  return value;
}

function hasUpdateBetween(sortedData: DatedValue[], fromTs: number, toTs: number): boolean {
  return sortedData.some((d) => {
    const ts = dateToTimestamp(d.date);
    return ts >= fromTs && ts < toTs;
  });
}

// The current month is left out until it has an update, so an early-month visit doesn't show a fake zero.
export function buildMonthlyChanges(sortedData: DatedValue[], startTs: number, now: number): MonthlyChange[] {
  const currentMonthStart = startOfMonth(now);
  const firstMonth = new Date(startOfMonth(startTs));
  const changes: MonthlyChange[] = [];

  for (let i = 0; ; i++) {
    const monthStart = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + i, 1).getTime();
    if (monthStart > currentMonthStart) break;
    const nextMonthStart = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + i + 1, 1).getTime();

    const opening = lastValueBefore(sortedData, monthStart);
    const closing = lastValueBefore(sortedData, nextMonthStart);
    if (opening === undefined || closing === undefined) continue;

    const isCurrentMonth = monthStart === currentMonthStart;
    if (isCurrentMonth && !hasUpdateBetween(sortedData, monthStart, nextMonthStart)) continue;

    changes.push({ month: timestampToDate(monthStart).slice(0, 7), change: closing - opening });
  }

  return changes;
}

export function summarizeMonthlyChanges(changes: MonthlyChange[]): MonthlyChangeSummary | null {
  if (changes.length === 0) return null;

  const averageChange = changes.reduce((sum, c) => sum + c.change, 0) / changes.length;
  const biggest = changes.reduce((best, c) => (c.change > best.change ? c : best), changes[0]);

  let growthStreak = 0;
  for (let i = changes.length - 1; i >= 0 && changes[i].change > 0; i--) growthStreak++;

  return {
    averageChange,
    bestMonth: biggest.change > 0 ? biggest : null,
    growthStreak,
  };
}
