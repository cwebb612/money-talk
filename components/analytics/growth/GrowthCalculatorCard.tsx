"use client";

import { useMemo, useState } from "react";
import AnalyticsCard from "../AnalyticsCard";
import StatGrid from "../StatGrid";
import GrowthInputs from "./GrowthInputs";
import GrowthChart, { GROWTH_LAYERS, GrowthChartPoint } from "./GrowthChart";
import { changeColor, formatMonthYear, formatWholeUSD } from "../chartFormat";
import { today } from "../../../lib/utils/monthWindow";
import { ProjectionPoint, addMonths, averageMonthlyChange, projectGrowth, summarizeProjection } from "../../../lib/utils/projection";
import { GrowthSettings, StartingTotals, defaultGrowthSettings, growthInputs } from "./settings";

interface Props {
  chartData: { date: string; value: number }[];
  totals: StartingTotals;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toChartPoint(point: ProjectionPoint, start: number, todayTs: number): GrowthChartPoint {
  const principal = clamp(point.balance, 0, Math.max(start, 0));
  const contributions = clamp(point.balance - principal, 0, point.contributed);
  return {
    timestamp: addMonths(todayTs, point.month),
    balance: point.balance,
    principal,
    contributions,
    growth: Math.max(0, point.balance - principal - contributions),
  };
}

export default function GrowthCalculatorCard({ chartData, totals }: Props) {
  const [settings, setSettings] = useState<GrowthSettings>(() => defaultGrowthSettings(totals));
  const todayTs = today();
  const averageMonthly = useMemo(() => averageMonthlyChange(chartData, todayTs), [chartData, todayTs]);
  const onChange = (patch: Partial<GrowthSettings>) => setSettings((s) => ({ ...s, ...patch }));

  const result = useMemo(() => {
    const inputs = growthInputs(settings, totals);
    const points = projectGrowth(inputs);
    return {
      summary: summarizeProjection(inputs.start, points),
      chartPoints: points.map((p) => toChartPoint(p, inputs.start, todayTs)),
    };
  }, [settings, totals, todayTs]);

  const endLabel = formatMonthYear(addMonths(todayTs, settings.years * 12));

  return (
    <AnalyticsCard title="Growth Calculator">
      <GrowthInputs settings={settings} totals={totals} averageMonthly={averageMonthly} onChange={onChange} />

      <div className="mt-4">
        <GrowthChart data={result.chartPoints} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: "var(--color-muted)" }}>
        {GROWTH_LAYERS.map((layer) => (
          <span key={layer.key} className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: layer.color }} />
            {layer.label}
          </span>
        ))}
      </div>

      <StatGrid
        minColumnWidth={120}
        stats={[
          { label: `Value in ${endLabel}`, value: formatWholeUSD(result.summary.finalBalance), color: "var(--color-yellow)" },
          { label: "Contributed", value: formatWholeUSD(result.summary.contributed), color: "var(--color-text)" },
          { label: "Growth earned", value: formatWholeUSD(result.summary.growth), color: changeColor(result.summary.growth) },
        ]}
      />
    </AnalyticsCard>
  );
}
