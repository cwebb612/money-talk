"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TOOLTIP_STYLE, formatMonthTick, formatMonthYear } from "../chartFormat";
import { formatCompactUSD, formatWholeUSD } from "../../../lib/utils/money";
import { monthTicks } from "../../../lib/utils/monthWindow";
import { BalanceSplit } from "../../../lib/utils/projection";

export interface GrowthChartPoint extends BalanceSplit {
  timestamp: number;
  balance: number;
}

const LAYERS = [
  { key: "principal", label: "Starting amount", color: "var(--color-muted)" },
  { key: "contributions", label: "Contributions", color: "var(--color-blue)" },
  { key: "growth", label: "Growth", color: "var(--color-yellow)" },
] as const;

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
      <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function TooltipRow({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex justify-between gap-4">
      {color ? <Swatch color={color} label={label} /> : <span style={{ color: "var(--color-muted)" }}>{label}</span>}
      <span className="tabular-nums">{formatWholeUSD(value)}</span>
    </div>
  );
}

function GrowthTooltip({ active, payload }: { active?: boolean; payload?: { payload: GrowthChartPoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="flex flex-col gap-1 p-3 min-w-44 text-xs" style={TOOLTIP_STYLE}>
      <div className="font-semibold">{formatMonthYear(point.timestamp)}</div>
      <TooltipRow label="Balance" value={point.balance} />
      {LAYERS.map((layer) => (
        <TooltipRow key={layer.key} label={layer.label} value={point[layer.key]} color={layer.color} />
      ))}
    </div>
  );
}

export default function GrowthChart({ data }: { data: GrowthChartPoint[] }) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={monthTicks(data[0].timestamp, data[data.length - 1].timestamp)}
            tickFormatter={formatMonthTick}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tickFormatter={formatCompactUSD} tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
          <Tooltip content={<GrowthTooltip />} />
          {LAYERS.map((layer) => (
            <Area
              key={layer.key}
              type="monotone"
              dataKey={layer.key}
              stackId="balance"
              stroke={layer.key === "growth" ? layer.color : "none"}
              strokeWidth={2}
              fill={layer.color}
              fillOpacity={0.35}
              isAnimationActive={false}
              activeDot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
        {LAYERS.map((layer) => (
          <Swatch key={layer.key} color={layer.color} label={layer.label} />
        ))}
      </div>
    </div>
  );
}
