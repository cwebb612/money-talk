"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatUSD } from "../../lib/utils/money";
import { TOOLTIP_STYLE, formatMonthTick, formatTooltipDate } from "./chartFormat";

export interface SinglePoint {
  timestamp: number;
  value?: number;
  trend?: number;
}

export interface MultiPoint {
  timestamp: number;
  [key: string]: number | undefined;
}

export interface AccountMeta {
  id: string;
  name: string;
  color: string;
}

interface Props {
  mode: "all" | "per-account";
  singleData: SinglePoint[];
  multiData: MultiPoint[];
  accounts: AccountMeta[];
  domain?: [number, number];
  ticks?: number[];
}

export default function TrendsChart({ mode, singleData, multiData, accounts, domain, ticks }: Props) {
  const isEmpty = mode === "all" ? singleData.length === 0 : multiData.length === 0;

  if (isEmpty) {
    return (
      <div
        className="h-48 flex items-center justify-center rounded-xl"
        style={{ backgroundColor: "var(--color-bg)", color: "var(--color-muted)" }}
      >
        No history yet
      </div>
    );
  }

  const data = mode === "all" ? singleData : multiData;
  const allTs = data.map((d) => d.timestamp);
  const xDomain: [number, number] = domain ?? [Math.min(...allTs), Math.max(...allTs)];

  const xAxis = (
    <XAxis
      dataKey="timestamp"
      type="number"
      scale="time"
      domain={xDomain}
      ticks={ticks}
      tickFormatter={formatMonthTick}
      tick={{ fill: "var(--color-muted)", fontSize: 11 }}
      axisLine={false}
      tickLine={false}
      minTickGap={50}
    />
  );

  if (mode === "all") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={singleData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="trendsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          {xAxis}
          <YAxis hide />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={formatTooltipDate}
            formatter={(val: unknown, name: unknown) => {
              const formatted = formatUSD(val as number);
              if (name === "trend") return [formatted, "Trend"];
              if (name === "projection") return [formatted, "Projection"];
              return [formatted, "Net Worth"];
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-yellow)"
            strokeWidth={2}
            fill="url(#trendsGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--color-yellow)" }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="trend"
            stroke="#f59e0b"
            strokeWidth={1}
            strokeOpacity={0.35}
            dot={false}
            activeDot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={multiData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        {xAxis}
        <YAxis
          tickFormatter={(v) => formatUSD(v)}
          tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={formatTooltipDate}
          formatter={(val: unknown, name: unknown) => {
            const acc = accounts.find((a) => a.id === name);
            return [formatUSD(val as number), acc?.name ?? String(name)];
          }}
        />
        {accounts.map((acc) => (
          <Line
            key={acc.id}
            type="monotone"
            dataKey={acc.id}
            stroke={acc.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: acc.color }}
            connectNulls
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
