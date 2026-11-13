const MAX_TICKS = 6;
const MONTHS_PER_YEAR = 12;

export function yearTicks(monthlyTimestamps: number[]): number[] {
  const years = Math.max(1, Math.round((monthlyTimestamps.length - 1) / MONTHS_PER_YEAR));
  const step = Math.max(1, Math.ceil(years / MAX_TICKS)) * MONTHS_PER_YEAR;
  const ticks: number[] = [];
  for (let i = 0; i < monthlyTimestamps.length; i += step) ticks.push(monthlyTimestamps[i]);
  return ticks;
}

export function formatYear(ts: number): string {
  return String(new Date(ts).getFullYear());
}
