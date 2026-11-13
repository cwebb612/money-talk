"use client";

import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TOOLTIP_STYLE, formatMonthTick, formatTooltipDate } from "../analytics/chartFormat";
import { formatCompactUSD } from "../../lib/utils/money";
import { DatedValue, addMonths, dateToTimestamp, monthTicks, sliceWindow, timestampToDate } from "../../lib/utils/monthWindow";
import { GoalDTO, GoalMetric, formatGoalValue, isPercentMetric, targetAt } from "../../lib/utils/goals";

export interface GoalChartPoint {
  timestamp: number;
  actual?: number;
  target: number;
}

const HISTORY_MONTHS_BEFORE_START = 12;

export function goalChartPoints(goal: GoalDTO, history: DatedValue[], today: string): GoalChartPoint[] {
  const todayTs = dateToTimestamp(today);
  const windowStart = addMonths(dateToTimestamp(goal.startDate), -HISTORY_MONTHS_BEFORE_START);
  const past = sliceWindow(history, windowStart).map((d) => ({
    timestamp: dateToTimestamp(d.date),
    actual: d.value,
    target: targetAt(goal, d.date),
  }));

  const endTs = goal.targetDate ? Math.max(todayTs, dateToTimestamp(goal.targetDate)) : todayTs;
  const future: GoalChartPoint[] = [];
  for (let ts = addMonths(todayTs, 1); ts <= endTs; ts = addMonths(ts, 1)) {
    future.push({ timestamp: ts, target: targetAt(goal, timestampToDate(ts)) });
  }
  if (goal.targetDate && endTs > todayTs) future.push({ timestamp: endTs, target: targetAt(goal, goal.targetDate) });

  return [...past, ...future];
}

export default function GoalChart({ data, metric, accent }: { data: GoalChartPoint[]; metric: GoalMetric; accent?: string }) {
  const targetColor = accent ?? "var(--color-blue)";
  const tickFormat = (v: number) => (isPercentMetric(metric) ? `${Math.round(v)}%` : formatCompactUSD(v));
  if (data.length < 2) {
    return (
      <div
        className="h-24 flex items-center justify-center rounded-xl text-sm"
        style={{ backgroundColor: "var(--color-bg)", color: "var(--color-muted)" }}
      >
        Not enough history for a chart yet
      </div>
    );
  }

  const first = data[0].timestamp;
  const last = data[data.length - 1].timestamp;

  return (
    <div>
      <ResponsiveContainer width="100%" height={150}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={[first, last]}
            ticks={monthTicks(first, last)}
            tickFormatter={formatMonthTick}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis tickFormatter={tickFormat} tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={formatTooltipDate}
            formatter={(val: unknown, name: unknown) => [formatGoalValue(metric, val as number), name === "actual" ? "Actual" : "Target"]}
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="var(--color-yellow)"
            strokeWidth={2}
            fill="var(--color-yellow)"
            fillOpacity={0.15}
            dot={false}
            activeDot={{ r: 4, fill: "var(--color-yellow)" }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke={targetColor}
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: "var(--color-muted)" }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5" style={{ backgroundColor: "var(--color-yellow)" }} />
          Actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5" style={{ backgroundColor: targetColor }} />
          Target
        </span>
      </div>
    </div>
  );
}
