import { formatUSD } from "../../lib/utils/money";

export const GAIN_COLOR = "#10b981";
export const LOSS_COLOR = "#ef4444";

export const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-card)",
  border: "none",
  borderRadius: 8,
  color: "var(--color-text)",
};

export function changeColor(change: number | null): string {
  if (change === null || change === 0) return "var(--color-muted)";
  return change > 0 ? GAIN_COLOR : LOSS_COLOR;
}

export function formatSignedUSD(value: number): string {
  return `${value >= 0 ? "+" : ""}${formatUSD(value)}`;
}

export function formatMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function formatMonthTick(ts: number, index: number): string {
  const d = new Date(ts);
  const showYear = index === 0 || d.getMonth() === 0;
  return d.toLocaleDateString("en-US", showYear ? { month: "short", year: "numeric" } : { month: "short" });
}

export function formatTooltipDate(ts: unknown): string {
  return new Date(ts as number).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
