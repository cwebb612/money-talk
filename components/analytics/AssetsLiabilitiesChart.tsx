"use client";

import { ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipContentProps } from "recharts";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { formatUSD } from "../../lib/utils/money";
import { GAIN_COLOR, LOSS_COLOR, TOOLTIP_STYLE, formatMonthTick, formatTooltipDate } from "./chartFormat";

export interface AssetLiabilityChartPoint {
  timestamp: number;
  assets: number;
  liabilities: number;
}

interface Props {
  data: AssetLiabilityChartPoint[];
  domain?: [number, number];
  ticks?: number[];
}

function BreakdownTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const { assets, liabilities } = payload[0].payload as AssetLiabilityChartPoint;

  return (
    <div className="text-xs px-3 py-2 flex flex-col gap-1" style={TOOLTIP_STYLE}>
      <div style={{ color: "var(--color-muted)" }}>{formatTooltipDate(label)}</div>
      <div style={{ color: GAIN_COLOR }}>Assets: {formatUSD(assets)}</div>
      <div style={{ color: LOSS_COLOR }}>Liabilities: {formatUSD(liabilities)}</div>
      <div className="font-semibold" style={{ color: "var(--color-yellow)" }}>
        Net Worth: {formatUSD(assets - liabilities)}
      </div>
    </div>
  );
}

export default function AssetsLiabilitiesChart({ data, domain, ticks }: Props) {
  if (data.length === 0) {
    return (
      <div
        className="h-48 flex items-center justify-center rounded-xl"
        style={{ backgroundColor: "var(--color-bg)", color: "var(--color-muted)" }}
      >
        No history yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="assetsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={GAIN_COLOR} stopOpacity={0.25} />
            <stop offset="95%" stopColor={GAIN_COLOR} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="liabilitiesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={LOSS_COLOR} stopOpacity={0.25} />
            <stop offset="95%" stopColor={LOSS_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={domain ?? ["dataMin", "dataMax"]}
          ticks={ticks}
          tickFormatter={formatMonthTick}
          tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={50}
        />
        <YAxis
          tickFormatter={(v) => formatUSD(v)}
          tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip content={BreakdownTooltip} />
        <Area
          type="monotone"
          dataKey="assets"
          stroke={GAIN_COLOR}
          strokeWidth={2}
          fill="url(#assetsGradient)"
          dot={false}
          activeDot={{ r: 4, fill: GAIN_COLOR }}
        />
        <Area
          type="monotone"
          dataKey="liabilities"
          stroke={LOSS_COLOR}
          strokeWidth={2}
          fill="url(#liabilitiesGradient)"
          dot={false}
          activeDot={{ r: 4, fill: LOSS_COLOR }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
