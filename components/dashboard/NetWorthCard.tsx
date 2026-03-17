"use client";

import { useState } from "react";
import NetWorthHeader from "./NetWorthHeader";
import NetWorthChart from "./NetWorthChart";
import { formatUSD } from "../../lib/utils/money";
import { ChevronUp, ChevronDown } from "lucide-react"

type Preset = "1M" | "6M" | "YTD" | "1Y" | "5Y" | "All";

const PRESETS: Preset[] = ["1M", "6M", "YTD", "1Y", "5Y", "All"];

function dateToTimestamp(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

function getStartTimestamp(preset: Preset): number | null {
  const now = new Date();
  switch (preset) {
    case "1M":  return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
    case "6M":  return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).getTime();
    case "YTD": return new Date(now.getFullYear(), 0, 1).getTime();
    case "1Y":  return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
    case "5Y":  return new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()).getTime();
    case "All": return null;
  }
}

interface Props {
  value: number;
  updatedAt: string;
  chartData: { date: string; value: number }[];
}

export default function NetWorthCard({ value, updatedAt, chartData }: Props) {
  const [open, setOpen] = useState(true);
  const [preset, setPreset] = useState<Preset>("All");

  const startTs = getStartTimestamp(preset);

  const filteredData = startTs
    ? chartData.filter((d) => dateToTimestamp(d.date) >= startTs)
    : chartData;

  const endValue = chartData[chartData.length - 1]?.value ?? 0;
  const startValue = (() => {
    if (!startTs) return chartData[0]?.value ?? endValue;
    const before = chartData.filter((d) => dateToTimestamp(d.date) <= startTs);
    return before.length > 0 ? before[before.length - 1].value : (filteredData[0]?.value ?? endValue);
  })();

  const change = endValue - startValue;
  const changePct = startValue !== 0 ? (change / startValue) * 100 : 0;
  const changeColor = change > 0 ? "#10b981" : change < 0 ? "#ef4444" : "var(--color-muted)";

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: "var(--color-card)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between text-left"
        aria-label={open ? "Collapse chart" : "Expand chart"}
      >
        <NetWorthHeader value={value} updatedAt={updatedAt} />
        <span className="text-xs mt-1 px-2 py-1" style={{ color: "var(--color-muted)" }}>
          {open ? <ChevronUp /> : <ChevronDown />}
        </span>
      </button>

      {open && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
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
            {chartData.length > 1 && (
              <span className="text-xs tabular-nums" style={{ color: changeColor }}>
                {change >= 0 ? "+" : ""}{formatUSD(change)} ({changePct >= 0 ? "+" : ""}{changePct.toFixed(1)}%)
              </span>
            )}
          </div>
          <NetWorthChart data={filteredData} />
        </div>
      )}
    </div>
  );
}
