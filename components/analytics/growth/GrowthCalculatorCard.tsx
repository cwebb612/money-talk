"use client";

import { useMemo, useState } from "react";
import AnalyticsCard from "../AnalyticsCard";
import StatGrid from "../StatGrid";
import GrowthInputs from "./GrowthInputs";
import GrowthChart from "./GrowthChart";
import { changeColor, formatMonthYear } from "../chartFormat";
import { formatWholeUSD } from "../../../lib/utils/money";
import { AccountTotals } from "../../../lib/utils/netWorth";
import { DatedValue, addMonths, today } from "../../../lib/utils/monthWindow";
import { averageMonthlyChange, projectGrowth, splitBalance } from "../../../lib/utils/projection";
import { GrowthSettings, defaultGrowthSettings } from "./settings";

const YEARLY_CHART_AFTER_YEARS = 10;

interface Props {
  chartData: DatedValue[];
  totals: AccountTotals;
}

export default function GrowthCalculatorCard({ chartData, totals }: Props) {
  const [settings, setSettings] = useState<GrowthSettings>(() => defaultGrowthSettings(totals));
  const todayTs = today();
  const averageMonthly = useMemo(() => averageMonthlyChange(chartData, todayTs), [chartData, todayTs]);
  const start = Math.round(settings.startOverride ?? totals[settings.startSource]);

  const { last, chartPoints } = useMemo(() => {
    const points = projectGrowth({ ...settings, start });
    const monthsPerPoint = settings.years > YEARLY_CHART_AFTER_YEARS ? 12 : 1;
    return {
      last: points[points.length - 1],
      chartPoints: points
        .filter((p) => p.month % monthsPerPoint === 0)
        .map((p) => ({ timestamp: addMonths(todayTs, p.month), balance: p.balance, ...splitBalance(p, start) })),
    };
  }, [settings, start, todayTs]);

  const growth = last.balance - start - last.contributed;
  const endLabel = formatMonthYear(addMonths(todayTs, settings.years * 12));

  return (
    <AnalyticsCard title="Growth Calculator">
      <GrowthInputs
        settings={settings}
        start={start}
        totals={totals}
        averageMonthly={averageMonthly}
        onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
      />

      <div className="mt-4">
        <GrowthChart data={chartPoints} />
      </div>

      <StatGrid
        minColumnWidth={120}
        stats={[
          { label: `Value in ${endLabel}`, value: formatWholeUSD(last.balance), color: "var(--color-yellow)" },
          { label: "Contributed", value: formatWholeUSD(last.contributed), color: "var(--color-text)" },
          { label: "Growth earned", value: formatWholeUSD(growth), color: changeColor(growth) },
        ]}
      />
    </AnalyticsCard>
  );
}
