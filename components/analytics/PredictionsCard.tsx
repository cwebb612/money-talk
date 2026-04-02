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
import { formatUSD } from "../../lib/utils/money";

interface Props {
  chartData: { date: string; value: number }[];
}

interface ChartPoint {
  timestamp: number;
  actual?: number;
  projection?: number;
  bandLow?: number;
  bandWidth?: number;
}

// Inflation-adjusted historical S&P 500 average annual return
const SP500_AVG = 7;
const RATE_MAX  = 20;
const MS_PER_MONTH = (365.25 / 12) * 86400000;

type Lookback = "3M" | "6M" | "1Y" | "3Y" | "All";
const LOOKBACKS: Lookback[] = ["3M", "6M", "1Y", "3Y", "All"];

function getLookbackStartMs(lookback: Lookback): number | null {
  const now = new Date();
  switch (lookback) {
    case "3M":  return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).getTime();
    case "6M":  return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).getTime();
    case "1Y":  return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
    case "3Y":  return new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()).getTime();
    case "All": return null;
  }
}

function dateToTimestamp(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

function toDays(ms: number): number {
  return ms / 86400000;
}

interface RegressionResult {
  logSlope: number; // daily log-growth rate (ln(value)/day)
  cagr: number;     // compound annual growth rate as a decimal (e.g. 0.083 = 8.3%)
  sigma: number;    // std dev of log residuals — drives prediction interval width
}

// Log-linear regression: fits log(y) = logSlope * x + intercept.
// The slope is a daily percentage growth rate; exp(slope * 365.25) - 1 = CAGR.
// Residuals in log-space give sigma, which feeds statistically grounded uncertainty bands.
function runRegression(data: { date: string; value: number }[]): RegressionResult | null {
  const valid = data.filter((d) => d.value > 0);
  const points = valid.map((d) => ({ x: toDays(dateToTimestamp(d.date)), y: Math.log(d.value) }));
  const n = points.length;
  if (n < 2) return null;
  const sumX  = points.reduce((s, p) => s + p.x, 0);
  const sumY  = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;
  const logSlope  = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - logSlope * sumX) / n;
  const residuals = points.map((p) => p.y - (logSlope * p.x + intercept));
  const sigma     = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / Math.max(n - 2, 1));
  const cagr      = Math.exp(logSlope * 365.25) - 1;
  return { logSlope, cagr, sigma };
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

export default function PredictionsCard({ chartData }: Props) {
  const [years, setYears] = useState(10);
  const [includeHistory, setIncludeHistory] = useState(true);
  const [lookback, setLookback] = useState<Lookback>("All");
  const [includeRange, setIncludeRange] = useState(true);
  const [annualRate, setAnnualRate] = useState(SP500_AVG);

  const todayTs = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }, []);

  // Regression uses only the lookback window to estimate growth rate.
  // Falls back to all data if the window contains fewer than 2 points.
  const regressionData = useMemo(() => {
    const startMs = getLookbackStartMs(lookback);
    if (!startMs) return chartData;
    const filtered = chartData.filter((d) => dateToTimestamp(d.date) >= startMs);
    return filtered.length >= 2 ? filtered : chartData;
  }, [chartData, lookback]);

  const reg = useMemo(() => runRegression(regressionData), [regressionData]);

  const { chartPoints, finalProjected, finalLow, finalHigh } = useMemo(() => {
    const empty = { chartPoints: [], finalProjected: null, finalLow: null, finalHigh: null };
    if (chartData.length === 0) return empty;

    const lastPoint      = chartData[chartData.length - 1];
    const lastTs         = dateToTimestamp(lastPoint.date);
    const lastValue      = lastPoint.value;
    const logSlopePerDay = includeHistory && reg ? reg.logSlope : 0;
    const sigma          = reg?.sigma ?? 0;
    const monthlyRate    = annualRate / 100 / 12;
    const totalMonths    = years * 12;

    const history: ChartPoint[] = chartData.map((d) => ({
      timestamp: dateToTimestamp(d.date),
      actual: d.value,
    }));

    const projection: ChartPoint[] = [];
    for (let m = 0; m <= totalMonths; m++) {
      const ts   = lastTs + m * MS_PER_MONTH;
      const days = toDays(m * MS_PER_MONTH);
      // Historical trend (exponential) * investment return (compound)
      const value = lastValue * Math.exp(logSlopePerDay * days) * Math.pow(1 + monthlyRate, m);
      // Log-normal prediction interval: uncertainty grows as sigma * sqrt(months)
      const logHalf  = includeRange && sigma > 0 ? sigma * Math.sqrt(m) : 0;
      const bandHalf = logHalf > 0 ? value * (Math.exp(logHalf) - 1) : 0;
      projection.push({
        timestamp: ts,
        projection: value,
        bandLow:   includeRange ? value - bandHalf : undefined,
        bandWidth: includeRange ? bandHalf * 2 : undefined,
      });
    }

    // Anchor last history point so both series connect visually
    history[history.length - 1] = {
      ...history[history.length - 1],
      projection: projection[0].projection,
      bandLow:    projection[0].bandLow,
      bandWidth:  projection[0].bandWidth,
    };

    const last = projection[projection.length - 1];
    return {
      chartPoints:    [...history, ...projection.slice(1)],
      finalProjected: last.projection ?? null,
      finalLow:       includeRange && last.bandLow != null ? last.bandLow : null,
      finalHigh:      includeRange && last.bandLow != null && last.bandWidth != null
        ? last.bandLow + last.bandWidth
        : null,
    };
  }, [chartData, years, includeHistory, includeRange, annualRate, reg]);

  const mood   = getRateMood(annualRate);
  const avgPct = (SP500_AVG / RATE_MAX) * 100;

  return (
    <AnalyticsCard title="Predictions">
      <div className="flex flex-col gap-3 mb-4">

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

        {/* Checkboxes */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeHistory}
                onChange={(e) => setIncludeHistory(e.target.checked)}
                style={{ accentColor: "var(--color-yellow)", width: 14, height: 14 }}
              />
              <span className="text-xs" style={{ color: "var(--color-text)" }}>Include historical growth</span>
              {reg !== null && (
                <span
                  className="text-xs tabular-nums"
                  style={{ color: reg.cagr >= 0 ? "#10b981" : "#ef4444" }}
                >
                  {reg.cagr >= 0 ? "+" : ""}{(reg.cagr * 100).toFixed(1)}% CAGR
                </span>
              )}
            </label>
            {includeHistory && (
              <div className="ml-5 flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--color-muted)" }}>Lookback</span>
                <div className="flex gap-1">
                  {LOOKBACKS.map((lb) => (
                    <button
                      key={lb}
                      onClick={() => setLookback(lb)}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: lookback === lb ? "var(--color-yellow)" : "transparent",
                        color: lookback === lb ? "black" : "var(--color-muted)",
                        fontWeight: lookback === lb ? 600 : 400,
                        border: lookback === lb ? "none" : "1px solid var(--color-border)",
                      }}
                    >
                      {lb}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeRange}
              onChange={(e) => setIncludeRange(e.target.checked)}
              style={{ accentColor: "var(--color-yellow)", width: 14, height: 14 }}
            />
            <span className="text-xs" style={{ color: "var(--color-text)" }}>Show uncertainty range</span>
          </label>
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
              <linearGradient id="rangeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#f59e0b" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.18} />
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
                return null; // hide bandLow / bandWidth
              }}
            />
            <ReferenceLine
              x={todayTs}
              stroke="var(--color-muted)"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
            {/* Uncertainty band: invisible floor + visible width stacked on top */}
            <Area type="monotone" dataKey="bandLow"   stackId="range" stroke="none" fill="transparent"           dot={false} activeDot={false} legendType="none" connectNulls />
            <Area type="monotone" dataKey="bandWidth" stackId="range" stroke="none" fill="url(#rangeGradient)"   dot={false} activeDot={false} legendType="none" connectNulls />
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
          <div className="text-xs mb-3" style={{ color: "var(--color-muted)" }}>
            Projected net worth in {years} year{years !== 1 ? "s" : ""}
          </div>
          {finalLow !== null && finalHigh !== null ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--color-muted)" }}>Low</div>
                <div className="text-base font-semibold tabular-nums" style={{ color: "#ef4444" }}>{formatUSD(finalLow)}</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--color-muted)" }}>Projected</div>
                <div className="text-base font-semibold tabular-nums" style={{ color: "var(--color-yellow)" }}>{formatUSD(finalProjected)}</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--color-muted)" }}>High</div>
                <div className="text-base font-semibold tabular-nums" style={{ color: "#10b981" }}>{formatUSD(finalHigh)}</div>
              </div>
            </div>
          ) : (
            <div className="text-2xl font-semibold tabular-nums" style={{ color: "var(--color-yellow)" }}>
              {formatUSD(finalProjected)}
            </div>
          )}
        </div>
      )}
    </AnalyticsCard>
  );
}
