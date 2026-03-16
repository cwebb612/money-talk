"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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

function formatAxisDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { month: "short", day: '2-digit', year: "2-digit" });
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

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="date"
          tickFormatter={formatAxisDate}
          tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={40}
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
          labelFormatter={(label: unknown) => formatAxisDate(label as string)}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--color-yellow)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "var(--color-yellow)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
