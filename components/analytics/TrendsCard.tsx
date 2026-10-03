"use client";

import { useState, useMemo } from "react";
import AnalyticsCard from "./AnalyticsCard";
import TrendsChart, { SinglePoint, MultiPoint, AccountMeta } from "./TrendsChart";
import PresetPicker from "./PresetPicker";
import StatGrid from "./StatGrid";
import { changeColor, formatSignedUSD } from "./chartFormat";
import { formatUSD } from "../../lib/utils/money";
import {
  WindowPreset,
  dateToTimestamp,
  getChartWindow,
  sliceWindow,
  timestampToDate,
  today,
} from "../../lib/utils/monthWindow";

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

const MS_PER_DAY = 86400000;

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

function windowChange(data: { value: number }[]) {
  if (data.length < 2) return null;
  const start = data[0].value;
  const change = data[data.length - 1].value - start;
  return { change, percent: start !== 0 ? (change / Math.abs(start)) * 100 : null };
}

function allTimeHigh(data: { date: string; value: number }[]) {
  if (data.length === 0) return null;
  return data.reduce((max, d) => (d.value > max.value ? d : max), data[0]);
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

  const hasUpdateOnStart = startTs !== null && byDate.has(timestampToDate(startTs));
  if (startTs && latestValues.size > 0 && !hasUpdateOnStart) {
    const carriedPoint: MultiPoint = { timestamp: startTs };
    latestValues.forEach((val, id) => (carriedPoint[id] = val));
    result.push(carriedPoint);
  }

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

export default function TrendsCard({ chartData, accountData }: Props) {
  const [preset, setPreset] = useState<WindowPreset>("All");
  const [mode, setMode] = useState<"all" | "per-account">("all");

  const { startTs, domain, ticks } = getChartWindow(preset, chartData, today());

  const filteredData = useMemo(() => sliceWindow(chartData, startTs), [chartData, startTs]);

  const periodChange = windowChange(filteredData);
  const high = useMemo(() => allTimeHigh(chartData), [chartData]);

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
        <PresetPicker value={preset} onChange={setPreset} />
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
        domain={domain}
        ticks={ticks}
      />

      {high && (
        <StatGrid
          stats={[
            {
              label: "Change",
              value: periodChange ? formatSignedUSD(periodChange.change) : "—",
              sub: periodChange?.percent != null
                ? `${periodChange.percent >= 0 ? "+" : ""}${periodChange.percent.toFixed(1)}%`
                : null,
              color: changeColor(periodChange?.change ?? null),
            },
            {
              label: "All-Time High",
              value: formatUSD(high.value),
              sub: new Date(dateToTimestamp(high.date)).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
              color: "var(--color-text)",
            },
          ]}
        />
      )}
    </AnalyticsCard>
  );
}
