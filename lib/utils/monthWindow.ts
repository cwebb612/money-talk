// Chart windows start on the 1st of a month and run to today, because accounts are reconciled monthly.

export type WindowPreset = "1M" | "6M" | "YTD" | "1Y" | "All";

export interface DatedValue {
  date: string;
  value: number;
}

const MONTHS_BACK: Record<Exclude<WindowPreset, "YTD" | "All">, number> = {
  "1M": 1,
  "6M": 6,
  "1Y": 12,
};

export function dateToTimestamp(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

export function timestampToDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-CA");
}

export function startOfMonth(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function getWindowStart(preset: WindowPreset, now: number, firstDate: string | null): number | null {
  const today = new Date(now);
  switch (preset) {
    case "YTD":
      return new Date(today.getFullYear(), 0, 1).getTime();
    case "All":
      return firstDate ? startOfMonth(dateToTimestamp(firstDate)) : null;
    default:
      return new Date(today.getFullYear(), today.getMonth() - MONTHS_BACK[preset], 1).getTime();
  }
}

// Adds a point on the window start that carries the last earlier value, so the line starts on the 1st.
export function sliceWindow<T extends { date: string }>(data: T[], startTs: number | null): T[] {
  if (startTs === null) return data;

  const inWindow = data.filter((d) => dateToTimestamp(d.date) >= startTs);
  const before = data.filter((d) => dateToTimestamp(d.date) < startTs);
  const carried = before[before.length - 1];

  const startsOnTheFirst = inWindow.length > 0 && dateToTimestamp(inWindow[0].date) === startTs;
  if (!carried || startsOnTheFirst) return inWindow;

  return [{ ...carried, date: timestampToDate(startTs) }, ...inWindow];
}

const TICK_STEPS = [1, 2, 3, 6, 12];
const MAX_TICKS = 8;

export function monthTicks(startTs: number, endTs: number): number[] {
  const start = new Date(startOfMonth(startTs));
  const end = new Date(endTs);
  const monthCount =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;

  const step =
    TICK_STEPS.find((s) => Math.ceil(monthCount / s) <= MAX_TICKS) ??
    Math.ceil(monthCount / 12 / MAX_TICKS) * 12;

  const ticks: number[] = [];
  for (let i = 0; i < monthCount; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const absoluteMonth = d.getFullYear() * 12 + d.getMonth();
    if (absoluteMonth % step === 0) ticks.push(d.getTime());
  }
  return ticks;
}

export function today(): number {
  return startOfDay(Date.now());
}

export interface ChartWindow {
  startTs: number | null;
  domain?: [number, number];
  ticks?: number[];
}

export function getChartWindow(preset: WindowPreset, sortedData: { date: string }[], now: number): ChartWindow {
  const startTs = getWindowStart(preset, now, sortedData[0]?.date ?? null);
  if (startTs === null) return { startTs };

  const lastDate = sortedData[sortedData.length - 1]?.date;
  const endTs = Math.max(now, lastDate ? dateToTimestamp(lastDate) : now);
  return { startTs, domain: [startTs, endTs], ticks: monthTicks(startTs, endTs) };
}
