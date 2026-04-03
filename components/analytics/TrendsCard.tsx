"use client";

import { useState, useMemo } from "react";
import AnalyticsCard from "./AnalyticsCard";
import TrendsChart, { SinglePoint, MultiPoint, AccountMeta } from "./TrendsChart";
import { formatUSD } from "../../lib/utils/money";

type Preset = "1M" | "6M" | "YTD" | "1Y" | "All";
const PRESETS: Preset[] = ["1M", "6M", "YTD", "1Y", "All"];

const ACCOUNT_COLORS = [
  "#3b82f6", "#10b981", "#8b5cf6", "#ef4444",
  "#06b6d4", "#f97316", "#a78bfa", "#f59e0b",
];

interface AccountData {
  id: string;
  name: string;
  type: string;
  history: { date: string; value: number }[];
}

interface Props {
  chartData: { date: string; value: number }[];
  accountData: AccountData[];
}

function dateToTimestamp(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

const MS_PER_DAY = 86400000;

function getStartTimestamp(preset: Preset): number | null {
  const now = new Date();
  switch (preset) {
    case "1M":  return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
    case "6M":  return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).getTime();
    case "YTD": return new Date(now.getFullYear(), 0, 1).getTime();
    case "1Y":  return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
    case "All": return null;
  }
}

function linearRegression(points: { x: number; y: number }[]): ((x: number) => number) | null {
  const n = points.length;
  if (n < 2) return null;
  const sumX  = points.reduce((s, p) => s + p.x, 0);
  const sumY  = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;
  const slope     = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return (x: number) => slope * x + intercept;
}

function computeStats(data: { date: string; value: number }[]) {
  if (data.length === 0) return null;

  const allTimeHigh = data.reduce((max, d) => (d.value > max.value ? d : max), data[0]);

  // Group by calendar month end-values — shared basis for avg, best, and streak
  const monthMap = new Map<string, number[]>();
  for (const d of data) {
    const month = d.date.slice(0, 7);
    if (!monthMap.has(month)) monthMap.set(month, []);
    monthMap.get(month)!.push(d.value);
  }
  const monthEnds = [...monthMap.keys()].sort().map((m) => {
    const vals = monthMap.get(m)!;
    return { month: m, value: vals[vals.length - 1] };
  });

  if (monthEnds.length < 2) return { allTimeHigh, avgMonthlyChange: null, bestMonth: null, streak: 0 };

  const changes = monthEnds.slice(1).map((curr, i) => ({
    month: curr.month,
    change: curr.value - monthEnds[i].value,
  }));

  const avgMonthlyChange = changes.reduce((s, c) => s + c.change, 0) / changes.length;
  const bestMonth = changes.reduce((best, c) => (c.change > best.change ? c : best), changes[0]);

  let streak = 0;
  for (let i = changes.length - 1; i >= 0; i--) {
    if (changes[i].change > 0) streak++;
    else break;
  }

  return { allTimeHigh, avgMonthlyChange, bestMonth, streak };
}

function buildMultiData(
  accounts: AccountData[],
  startTs: number | null,
): MultiPoint[] {
  // Build a fast lookup: date -> accountId -> value
  const byDate = new Map<string, Map<string, number>>();
  for (const acc of accounts) {
    for (const h of acc.history) {
      if (!byDate.has(h.date)) byDate.set(h.date, new Map());
      byDate.get(h.date)!.set(acc.id, h.value);
    }
  }

  const sortedDates = [...byDate.keys()].sort();

  // Seed carry-forward values from before the window
  const latestValues = new Map<string, number>();
  for (const date of sortedDates) {
    if (startTs && dateToTimestamp(date) >= startTs) break;
    byDate.get(date)!.forEach((val, id) => latestValues.set(id, val));
  }

  const result: MultiPoint[] = [];
  for (const date of sortedDates) {
    const ts = dateToTimestamp(date);
    if (startTs && ts < startTs) continue;

    byDate.get(date)!.forEach((val, id) => latestValues.set(id, val));

    const point: MultiPoint = { timestamp: ts };
    accounts.forEach((acc) => {
      if (latestValues.has(acc.id)) point[acc.id] = latestValues.get(acc.id);
    });
    result.push(point);
  }

  return result;
}

function formatMonthLabel(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function TrendsCard({ chartData, accountData }: Props) {
  const [preset, setPreset] = useState<Preset>("All");
  const [mode, setMode] = useState<"all" | "per-account">("all");

  const startTs = getStartTimestamp(preset);

  const filteredData = useMemo(
    () => startTs ? chartData.filter((d) => dateToTimestamp(d.date) >= startTs) : chartData,
    [chartData, startTs]
  );

  const stats = useMemo(() => computeStats(filteredData), [filteredData]);

  // Regression + trend/projection for single mode
  const regression = useMemo(
    () => filteredData.length >= 2
      ? linearRegression(filteredData.map((d) => ({ x: dateToTimestamp(d.date) / MS_PER_DAY, y: d.value })))
      : null,
    [filteredData]
  );

  const singleData: SinglePoint[] = useMemo(() => filteredData.map((d) => {
    const ts = dateToTimestamp(d.date);
    return {
      timestamp: ts,
      value: d.value,
      trend: regression ? regression(ts / MS_PER_DAY) : undefined,
    };
  }), [filteredData, regression]);

  // Multi-account mode data
  const multiData = useMemo(() => buildMultiData(accountData, startTs), [accountData, startTs]);
  const accountsWithColors: AccountMeta[] = accountData
    .filter((acc) => acc.history.length > 0)
    .map((acc, i) => ({
      id: acc.id,
      name: acc.name,
      color: ACCOUNT_COLORS[i % ACCOUNT_COLORS.length],
    }));

  return (
    <AnalyticsCard title="Trends">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: preset === p ? "var(--color-yellow)" : "transparent",
                color: preset === p ? "black" : "var(--color-muted)",
                fontWeight: preset === p ? 600 : 400,
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["all", "per-account"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: mode === m ? "var(--color-border)" : "transparent",
                color: mode === m ? "var(--color-text)" : "var(--color-muted)",
                fontWeight: mode === m ? 600 : 400,
              }}
            >
              {m === "all" ? "All Accounts" : "Per Account"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <TrendsChart
        mode={mode}
        singleData={singleData}
        multiData={multiData}
        accounts={accountsWithColors}
      />

      {/* Stat cards */}
      {stats && (
        <div
          className="mt-4"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}
        >
          {[
            {
              label: "Avg Monthly",
              value: stats.avgMonthlyChange !== null
                ? `${stats.avgMonthlyChange >= 0 ? "+" : ""}${formatUSD(stats.avgMonthlyChange)}`
                : "—",
              sub: null,
              color: stats.avgMonthlyChange === null
                ? "var(--color-muted)"
                : stats.avgMonthlyChange >= 0 ? "#10b981" : "#ef4444",
            },
            {
              label: "Best Month",
              value: stats.bestMonth ? `+${formatUSD(stats.bestMonth.change)}` : "—",
              sub: stats.bestMonth ? formatMonthLabel(stats.bestMonth.month) : null,
              color: "#10b981",
            },
            {
              label: "All-Time High",
              value: formatUSD(stats.allTimeHigh.value),
              sub: new Date(dateToTimestamp(stats.allTimeHigh.date)).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
              color: "var(--color-text)",
            },
            {
              label: "Growth Streak",
              value: stats.streak > 0 ? `${stats.streak} mo` : "—",
              sub: stats.streak > 0 ? "consecutive" : null,
              color: stats.streak > 0 ? "#10b981" : "var(--color-muted)",
            },
          ].map(({ label, value, sub, color }) => (
            <div
              key={label}
              className="rounded-lg p-4"
              style={{ backgroundColor: "var(--color-border)" }}
            >
              <div className="text-xs mb-2" style={{ color: "var(--color-muted)" }}>{label}</div>
              <div className="text-xl font-semibold tabular-nums" style={{ color }}>{value}</div>
              {sub && <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>{sub}</div>}
            </div>
          ))}
        </div>
      )}
    </AnalyticsCard>
  );
}
