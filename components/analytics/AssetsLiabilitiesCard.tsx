"use client";

import { useMemo, useState } from "react";
import AnalyticsCard from "./AnalyticsCard";
import PresetPicker from "./PresetPicker";
import StatGrid from "./StatGrid";
import AssetsLiabilitiesChart from "./AssetsLiabilitiesChart";
import { changeColor } from "./chartFormat";
import { AssetLiabilityPoint } from "../../lib/utils/netWorth";
import { WindowPreset, dateToTimestamp, getChartWindow, sliceWindow, today } from "../../lib/utils/monthWindow";

interface Props {
  series: AssetLiabilityPoint[];
}

function debtToAssetPercent(point: AssetLiabilityPoint | undefined): number | null {
  if (!point || point.assets === 0) return null;
  return (point.liabilities / point.assets) * 100;
}

export default function AssetsLiabilitiesCard({ series }: Props) {
  const [preset, setPreset] = useState<WindowPreset>("All");

  const { startTs, domain, ticks } = getChartWindow(preset, series, today());
  const windowed = useMemo(() => sliceWindow(series, startTs), [series, startTs]);
  const chartData = windowed.map((p) => ({ ...p, timestamp: dateToTimestamp(p.date) }));

  const currentRatio = debtToAssetPercent(windowed[windowed.length - 1]);
  const startRatio = debtToAssetPercent(windowed[0]);
  const ratioChange = currentRatio !== null && startRatio !== null ? currentRatio - startRatio : null;

  return (
    <AnalyticsCard title="Assets vs Liabilities">
      <div className="mb-4">
        <PresetPicker value={preset} onChange={setPreset} />
      </div>

      <AssetsLiabilitiesChart data={chartData} domain={domain} ticks={ticks} />

      {windowed.length > 0 && (
        <StatGrid
          stats={[
            {
              label: "Debt-to-Asset",
              value: currentRatio !== null ? `${currentRatio.toFixed(1)}%` : "—",
              sub: "of assets owed",
              color: "var(--color-text)",
            },
            {
              label: "Ratio Change",
              value: ratioChange !== null ? `${ratioChange > 0 ? "+" : ""}${ratioChange.toFixed(1)} pts` : "—",
              sub: ratioChange !== null && ratioChange !== 0 ? (ratioChange < 0 ? "less debt" : "more debt") : null,
              color: changeColor(ratioChange === null ? null : -ratioChange),
            },
          ]}
        />
      )}
    </AnalyticsCard>
  );
}
