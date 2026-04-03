"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import AnalyticsCard from "./AnalyticsCard";
import { formatUSD, parseNumeric, formatNumeric } from "../../lib/utils/money";

interface Props {
  chartData: { date: string; value: number }[];
}

interface ChartPoint {
  timestamp: number;
  actual?: number;
  projection?: number;
}

// Inflation-adjusted historical S&P 500 average annual return
const SP500_AVG = 7;
const RATE_MAX  = 20;

function dateToTimestamp(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

function getRateMood(rate: number): { emoji: string; label: string; color: string } {
  if (rate === 0)  return { emoji: "💀", label: "burying cash in the backyard", color: "#6b7280" };
  if (rate <= 2)   return { emoji: "🐻", label: "bearish",                       color: "#ef4444" };
  if (rate <= 4)   return { emoji: "😴", label: "savings account energy",        color: "#f97316" };
  if (rate <= 6)   return { emoji: "🙂", label: "steady",                        color: "#f59e0b" };
  if (rate <= 8)   return { emoji: "📈", label: "historically reasonable",       color: "#10b981" };
  if (rate <= 11)  return { emoji: "🚀", label: "bullish",                       color: "#10b981" };
  if (rate <= 14)  return { emoji: "🤑", label: "very optimistic",               color: "#8b5cf6" };
  if (rate <= 17)  return { emoji: "🎰", label: "sir this is a casino",          color: "#ec4899" };
  return                  { emoji: "🤡", label: "unrealistic (but go off)",      color: "#ef4444" };
}

function formatTick(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatTooltipDate(ts: unknown): string {
  return new Date(ts as number).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const MS_PER_YEAR = 365.25 * 86400000;

/** Average monthly net-worth change over the most recent 12 months (or all data). */
function estimateMonthlySavings(data: { date: string; value: number }[]): number {
  if (data.length < 2) return 0;
  const cutoff = Date.now() - MS_PER_YEAR;
  const window = data.filter((d) => dateToTimestamp(d.date) >= cutoff);
  const pts    = window.length >= 2 ? window : data;
  const days = (dateToTimestamp(pts[pts.length - 1].date) - dateToTimestamp(pts[0].date)) / 86400000;
  if (days < 1) return 0;
  const dailyChange = (pts[pts.length - 1].value - pts[0].value) / days;
  return Math.round(dailyChange * (365.25 / 12));
}

export default function PredictionsCard({ chartData }: Props) {
  const [years, setYears] = useState(10);
  const [annualRate, setAnnualRate] = useState(SP500_AVG);
  const [includeContributions, setIncludeContributions] = useState(false);
  const [contributionInput, setContributionInput] = useState<string>("");

  const todayTs = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }, []);

  const suggestedMonthly = useMemo(() => estimateMonthlySavings(chartData), [chartData]);

  // Resolve the monthly contribution to use: text input overrides suggestion
  const monthlyContribution = useMemo(() => {
    if (!includeContributions) return 0;
    const parsed = parseNumeric(contributionInput);
    if (parsed !== 0 || contributionInput.trim() !== "") return parsed;
    return suggestedMonthly;
  }, [includeContributions, contributionInput, suggestedMonthly]);

  const { chartPoints, finalProjected } = useMemo(() => {
    const empty = { chartPoints: [] as ChartPoint[], finalProjected: null as number | null };
    if (chartData.length === 0) return empty;

    const lastPoint = chartData[chartData.length - 1];
    const lastValue = lastPoint.value;
    const annualSavings = monthlyContribution * 12;
    const rate = annualRate / 100;

    // Build history points
    const history: ChartPoint[] = chartData.map((d) => ({
      timestamp: dateToTimestamp(d.date),
      actual: d.value,
    }));

    // Build yearly projection using: Year N = (Year N-1 + annualSavings) × (1 + rate)
    const lastTs     = dateToTimestamp(lastPoint.date);
    const projection: ChartPoint[] = [];
    let netWorth = lastValue;
    for (let y = 0; y <= years; y++) {
      projection.push({ timestamp: lastTs + y * MS_PER_YEAR, projection: netWorth });
      netWorth = (netWorth + annualSavings) * (1 + rate);
    }

    // Anchor last history point so lines connect
    history[history.length - 1] = {
      ...history[history.length - 1],
      projection: projection[0].projection,
    };

    const last = projection[projection.length - 1];
    return {
      chartPoints: [...history, ...projection.slice(1)],
      finalProjected: last.projection ?? null,
    };
  }, [chartData, years, annualRate, monthlyContribution]);

  const mood   = getRateMood(annualRate);
  const avgPct = (SP500_AVG / RATE_MAX) * 100;

  return (
    <AnalyticsCard title="Predictions">
      <div className="flex flex-col gap-4 mb-4">

        {/* Prediction horizon */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--color-muted)" }}>Prediction Horizon</span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--color-text)" }}>
              {years} year{years !== 1 ? "s" : ""}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: "var(--color-yellow)" }}
          />
        </div>

        {/* Future contributions */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeContributions}
              onChange={(e) => setIncludeContributions(e.target.checked)}
              style={{ accentColor: "var(--color-yellow)", width: 14, height: 14 }}
            />
            <span className="text-xs" style={{ color: "var(--color-text)" }}>Include future contributions</span>
          </label>
          {includeContributions && (
            <div className="ml-5 flex flex-col gap-1.5">
              {suggestedMonthly !== 0 && (
                <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                  Suggested based on trends:{" "}
                  <button
                    className="underline"
                    style={{ color: "var(--color-yellow)" }}
                    onClick={() => setContributionInput(formatNumeric(suggestedMonthly))}
                  >
                    {formatUSD(suggestedMonthly)}/mo
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--color-muted)" }}>Monthly contribution</span>
                <div className="flex items-center rounded px-2 py-1 gap-1" style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                  <span className="text-xs" style={{ color: "var(--color-muted)" }}>$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={suggestedMonthly !== 0 ? formatNumeric(suggestedMonthly) : "0"}
                    value={contributionInput}
                    onChange={(e) => setContributionInput(e.target.value)}
                    onBlur={(e) => { const n = parseNumeric(e.target.value); if (n) setContributionInput(formatNumeric(n)); }}
                    className="text-xs tabular-nums bg-transparent outline-none w-24"
                    style={{ color: "var(--color-text)" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Annual return slider */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--color-muted)" }}>Annual Return</span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: mood.color }}>
              {mood.emoji} {annualRate.toFixed(1)}% — {mood.label}
            </span>
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="range"
              min={0}
              max={RATE_MAX}
              step={0.5}
              value={annualRate}
              onChange={(e) => setAnnualRate(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: mood.color }}
            />
            {/* Marker at S&P 500 historical average */}
            <div
              style={{
                position: "absolute",
                left: `calc(${avgPct}% - 1px)`,
                top: 0,
                bottom: 0,
                width: 2,
                backgroundColor: "var(--color-muted)",
                opacity: 0.4,
                pointerEvents: "none",
              }}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-xs" style={{ color: "var(--color-muted)" }}>0%</span>
            <span className="text-xs" style={{ color: "var(--color-muted)", position: "relative", left: `calc(${avgPct}% - 50%)` }}>
              📊 {SP500_AVG}% S&P avg
            </span>
            <span className="text-xs" style={{ color: "var(--color-muted)" }}>{RATE_MAX}%</span>
          </div>
        </div>

      </div>

      {/* Chart */}
      {chartPoints.length === 0 ? (
        <div
          className="h-48 flex items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--color-bg)", color: "var(--color-muted)" }}
        >
          No history yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartPoints} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="predictionsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={formatTick}
              tick={{ fill: "var(--color-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={60}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "none",
                borderRadius: 8,
                color: "var(--color-text)",
              }}
              labelFormatter={formatTooltipDate}
              formatter={(val: unknown, name: unknown) => {
                if (name === "actual")     return [formatUSD(val as number), "Net Worth"];
                if (name === "projection") return [formatUSD(val as number), "Projected"];
                return null;
              }}
            />
            <ReferenceLine
              x={todayTs}
              stroke="var(--color-muted)"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
            {/* Actual history */}
            <Area
              type="monotone"
              dataKey="actual"
              stroke="var(--color-yellow)"
              strokeWidth={2}
              fill="url(#predictionsGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--color-yellow)" }}
              connectNulls={false}
            />
            {/* Projection line */}
            <Line
              type="monotone"
              dataKey="projection"
              stroke="var(--color-yellow)"
              strokeWidth={2}
              strokeDasharray="6 4"
              strokeOpacity={0.55}
              dot={false}
              activeDot={{ r: 4, fill: "var(--color-yellow)" }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Terminal value stat card */}
      {finalProjected !== null && (
        <div className="mt-4 rounded-lg p-4" style={{ backgroundColor: "var(--color-border)" }}>
          <div className="text-xs mb-2" style={{ color: "var(--color-muted)" }}>
            Projected net worth in {years} year{years !== 1 ? "s" : ""}
            {includeContributions && monthlyContribution !== 0 && (
              <span> · {formatUSD(monthlyContribution)}/mo contributions</span>
            )}
            <span> · {annualRate.toFixed(1)}% compounding annually</span>
          </div>
          <div className="text-2xl font-semibold tabular-nums" style={{ color: "var(--color-yellow)" }}>
            {formatUSD(finalProjected)}
          </div>
        </div>
      )}
    </AnalyticsCard>
  );
}
