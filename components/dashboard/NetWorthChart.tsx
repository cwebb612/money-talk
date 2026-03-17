"use client";

import {
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
} from "recharts";
import { formatUSD } from "../../lib/utils/money";

interface DataPoint {
  date: string;
  value: number;
}

interface NetWorthChartProps {
  data: DataPoint[];
  label?: string;
}

function dateToTimestamp(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

function formatTick(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTooltipDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NetWorthChart({ data, label = "Net Worth" }: NetWorthChartProps) {
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

  const scaledData = data.map((d) => ({ ...d, timestamp: dateToTimestamp(d.date) }));
  const domain: [number, number] = [scaledData[0].timestamp, scaledData[scaledData.length - 1].timestamp];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={scaledData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={domain}
          tickFormatter={formatTick}
          tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={50}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-card)",
            border: "none",
            borderRadius: 8,
            color: "var(--color-text)",
          }}
          formatter={(val: unknown) => [formatUSD(val as number), label]}
          labelFormatter={(ts: unknown) => formatTooltipDate(ts as number)}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-yellow)"
          strokeWidth={2}
          fill="url(#netWorthGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "var(--color-yellow)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
