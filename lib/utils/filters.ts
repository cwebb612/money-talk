export type DateRange = "all" | "30d" | "90d" | "ytd" | "12m";
export type SortOrder = "oldest" | "newest";

export const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "This year" },
  { value: "12m", label: "Last 12 months" },
];

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDateString(value: unknown): value is string {
  return typeof value === "string" && DATE_PATTERN.test(value);
}

function toDateString(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

export function todayString(): string {
  return toDateString(new Date());
}

export function rangeStartDate(range: DateRange, today: string): string | null {
  const [y, m, d] = today.split("-").map(Number);
  switch (range) {
    case "all": return null;
    case "30d": return toDateString(new Date(y, m - 1, d - 30));
    case "90d": return toDateString(new Date(y, m - 1, d - 90));
    case "ytd": return `${y}-01-01`;
    case "12m": return toDateString(new Date(y - 1, m - 1, d));
  }
}
