"use client";

import { useMemo, useState } from "react";
import AnalyticsCard from "./AnalyticsCard";
import PresetPicker from "./PresetPicker";
import MonthlyChangeChart from "./MonthlyChangeChart";
import StatGrid from "./StatGrid";
import { changeColor, formatMonth, formatSignedUSD } from "./chartFormat";
import { formatUSD } from "../../lib/utils/money";
import { WindowPreset, getWindowStart, today } from "../../lib/utils/monthWindow";
import { buildMonthlyChanges, summarizeMonthlyChanges } from "../../lib/utils/monthlyChange";

interface Props {
  chartData: { date: string; value: number }[];
}

export default function MonthlyChangeCard({ chartData }: Props) {
  const [preset, setPreset] = useState<WindowPreset>("1Y");

  const todayTs = today();
  const startTs = getWindowStart(preset, todayTs, chartData[0]?.date ?? null);

  const changes = useMemo(
    () => (startTs === null ? [] : buildMonthlyChanges(chartData, startTs, todayTs)),
    [chartData, startTs, todayTs]
  );
  const summary = summarizeMonthlyChanges(changes);

  return (
    <AnalyticsCard title="Monthly Change">
      <div className="mb-4">
        <PresetPicker value={preset} onChange={setPreset} />
      </div>

      <MonthlyChangeChart data={changes} />

      {summary && (
        <StatGrid
          stats={[
            {
              label: "Avg Monthly",
              value: formatSignedUSD(summary.averageChange),
              color: changeColor(summary.averageChange),
            },
            {
              label: "Best Month",
              value: summary.bestMonth ? `+${formatUSD(summary.bestMonth.change)}` : "—",
              sub: summary.bestMonth ? formatMonth(summary.bestMonth.month) : null,
              color: changeColor(summary.bestMonth?.change ?? null),
            },
            {
              label: "Growth Streak",
              value: summary.growthStreak > 0 ? `${summary.growthStreak} mo` : "—",
              sub: summary.growthStreak > 0 ? "consecutive" : null,
              color: changeColor(summary.growthStreak),
            },
          ]}
        />
      )}
    </AnalyticsCard>
  );
}
