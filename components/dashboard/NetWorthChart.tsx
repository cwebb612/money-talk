"use client";

import { useState } from "react";
import {
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
} from "recharts";
import { formatUSD } from "../../lib/utils/money";
import { NoteDTO, attachNotesToSeries } from "../../lib/utils/notes";
import ChartNotesDrawer from "../notes/ChartNotesDrawer";

interface DataPoint {
  date: string;
  value: number;
}

interface ChartPoint extends DataPoint {
  timestamp: number;
  notes: NoteDTO[];
}

interface NetWorthChartProps {
  data: DataPoint[];
  label?: string;
  notes?: NoteDTO[];
  onNotesChanged?: () => void;
  noteAccountId?: string;
}

const MAX_TOOLTIP_NOTES = 3;

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

interface ChartTooltipProps {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
  seriesLabel: string;
  clickable: boolean;
}

function ChartTooltip({ active, payload, seriesLabel, clickable }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const shownNotes = point.notes.slice(0, MAX_TOOLTIP_NOTES);
  const hiddenCount = point.notes.length - shownNotes.length;

  return (
    <div
      className="rounded-lg px-3 py-2 text-sm"
      style={{ backgroundColor: "var(--color-card)", color: "var(--color-text)", maxWidth: 280, boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}
    >
      <p className="text-xs" style={{ color: "var(--color-muted)" }}>{formatTooltipDate(point.timestamp)}</p>
      <p>
        {seriesLabel}: <span className="font-semibold">{formatUSD(point.value)}</span>
      </p>
      {shownNotes.length > 0 && (
        <div className="mt-2 pt-2 flex flex-col gap-1.5" style={{ borderTop: "1px solid var(--color-border)" }}>
          {shownNotes.map((note) => (
            <p key={note._id} className="text-xs line-clamp-3 whitespace-pre-wrap">
              {note.accountName && <span style={{ color: "var(--color-yellow)" }}>{note.accountName}: </span>}
              {note.body}
            </p>
          ))}
          {hiddenCount > 0 && (
            <p className="text-xs" style={{ color: "var(--color-muted)" }}>+{hiddenCount} more</p>
          )}
        </div>
      )}
      {clickable && (
        <p className="text-xs mt-2" style={{ color: "var(--color-muted)" }}>
          {point.notes.length > 0 ? "Click to view notes" : "Click to add a note"}
        </p>
      )}
    </div>
  );
}

interface NoteDotProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: ChartPoint;
}

function NoteDot({ cx, cy, index, payload }: NoteDotProps) {
  if (cx == null || cy == null || !payload?.notes.length) return <g key={`note-dot-${index}`} />;
  return (
    <circle
      key={`note-dot-${index}`}
      cx={cx}
      cy={cy}
      r={5}
      fill="var(--color-card)"
      stroke="var(--color-yellow)"
      strokeWidth={2}
    />
  );
}

export default function NetWorthChart({
  data,
  label = "Net Worth",
  notes = [],
  onNotesChanged,
  noteAccountId,
}: NetWorthChartProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  const clickable = onNotesChanged != null;
  const chartData: ChartPoint[] = attachNotesToSeries(data, notes).map((d) => ({
    ...d,
    timestamp: dateToTimestamp(d.date),
  }));
  const domain: [number, number] = [chartData[0].timestamp, chartData[chartData.length - 1].timestamp];
  const selectedNotes = chartData.find((d) => d.date === selectedDate)?.notes ?? [];

  function handleClick(state: { activeTooltipIndex?: number | string | null }) {
    const index = Number(state.activeTooltipIndex);
    const point = Number.isInteger(index) ? chartData[index] : undefined;
    if (point) setSelectedDate(point.date);
  }

  return (
    <>
      <div style={{ cursor: clickable ? "pointer" : undefined }}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            onClick={clickable ? handleClick : undefined}
          >
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
            <Tooltip content={<ChartTooltip seriesLabel={label} clickable={clickable} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-yellow)"
              strokeWidth={2}
              fill="url(#netWorthGradient)"
              dot={NoteDot}
              activeDot={{ r: 4, fill: "var(--color-yellow)" }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {clickable && (
        <ChartNotesDrawer
          date={selectedDate}
          notes={selectedNotes}
          accountId={noteAccountId}
          onClose={() => setSelectedDate(null)}
          onChanged={onNotesChanged}
        />
      )}
    </>
  );
}
