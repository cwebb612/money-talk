"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { formatUSD } from "../../lib/utils/money";
import { MonthlyChange } from "../../lib/utils/monthlyChange";
import { GAIN_COLOR, LOSS_COLOR, TOOLTIP_STYLE, formatMonth, formatSignedUSD } from "./chartFormat";

function formatTick(month: string, index: number) {
  const isJanuary = month.endsWith("-01");
  if (index === 0 || isJanuary) return formatMonth(month);
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

export default function MonthlyChangeChart({ data }: { data: MonthlyChange[] }) {
  if (data.length === 0) {
    return (
      <div
        className="h-48 flex items-center justify-center rounded-xl"
        style={{ backgroundColor: "var(--color-bg)", color: "var(--color-muted)" }}
      >
        Not enough history yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="month"
          tickFormatter={formatTick}
          tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={20}
        />
        <YAxis
          tickFormatter={(v) => formatUSD(v)}
          tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <ReferenceLine y={0} stroke="var(--color-border)" />
        <Tooltip
          cursor={{ fill: "var(--color-border)", opacity: 0.4 }}
          contentStyle={TOOLTIP_STYLE}
          itemStyle={{ color: "var(--color-text)" }}
          labelFormatter={(month) => formatMonth(String(month))}
          formatter={(val: unknown) => [formatSignedUSD(val as number), "Change"]}
        />
        <Bar dataKey="change" radius={[3, 3, 3, 3]}>
          {data.map((d) => (
            <Cell key={d.month} fill={d.change >= 0 ? GAIN_COLOR : LOSS_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
