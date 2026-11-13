"use client";

import { ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TOOLTIP_STYLE, formatCompactUSD, formatMonthYear, formatWholeUSD } from "../chartFormat";
import { yearTicks, formatYear } from "./chartAxis";

export interface GrowthChartPoint {
  timestamp: number;
  balance: number;
  principal: number;
  contributions: number;
  growth: number;
}

export const GROWTH_LAYERS = [
  { key: "principal", label: "Starting amount", color: "var(--color-muted)" },
  { key: "contributions", label: "Contributions", color: "var(--color-blue)" },
  { key: "growth", label: "Growth", color: "var(--color-yellow)" },
] as const;

function GrowthTooltip({ active, payload }: { active?: boolean; payload?: { payload: GrowthChartPoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="flex flex-col gap-1 p-3 min-w-44 text-xs" style={TOOLTIP_STYLE}>
      <div className="font-semibold">{formatMonthYear(point.timestamp)}</div>
      <div className="flex justify-between gap-4">
        <span style={{ color: "var(--color-muted)" }}>Balance</span>
        <span className="tabular-nums">{formatWholeUSD(point.balance)}</span>
      </div>
      {GROWTH_LAYERS.map((layer) => (
        <div key={layer.key} className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
            <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: layer.color }} />
            {layer.label}
          </span>
          <span className="tabular-nums">{formatWholeUSD(point[layer.key])}</span>
        </div>
      ))}
    </div>
  );
}

export default function GrowthChart({ data }: { data: GrowthChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          ticks={yearTicks(data.map((d) => d.timestamp))}
          tickFormatter={formatYear}
          tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tickFormatter={formatCompactUSD} tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
        <Tooltip content={<GrowthTooltip />} />
        {GROWTH_LAYERS.map((layer) => (
          <Area
            key={layer.key}
            type="monotone"
            dataKey={layer.key}
            stackId="balance"
            stroke={layer.key === "growth" ? "var(--color-yellow)" : "none"}
            strokeWidth={2}
            fill={layer.color}
            fillOpacity={0.35}
            isAnimationActive={false}
            activeDot={false}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
