"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatUSD } from "../../lib/utils/money";

const COLORS = [
  "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6",
  "#ef4444", "#06b6d4", "#f97316", "#ec4899",
];

interface Account {
  _id: string;
  name: string;
  type: string;
  currentValue: number;
}

interface Props {
  accounts: Account[];
}

export default function AssetPieChart({ accounts }: Props) {
  const [open, setOpen] = useState(true);

  const assets = accounts.filter((a) => a.type !== "liability" && a.currentValue > 0);
  if (assets.length === 0) return null;

  const total = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const data = assets.map((a) => ({ name: a.name, value: a.currentValue }));

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: "var(--color-card)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between mb-4 text-left"
        aria-label={open ? "Collapse" : "Expand"}
      >
        <h2 className="text-xl font-bold" style={{ color: "var(--color-yellow)" }}>
          Asset Breakdown
        </h2>
        <span className="text-xs px-2 py-1" style={{ color: "var(--color-muted)" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "none",
                  borderRadius: 8,
                  color: "var(--color-text)",
                }}
                formatter={(val: unknown) => [formatUSD(val as number), ""]}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-col gap-2 mt-3">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span style={{ color: "var(--color-text)" }}>{d.name}</span>
                </div>
                <div className="flex gap-3" style={{ color: "var(--color-muted)" }}>
                  <span>{total > 0 ? ((d.value / total) * 100).toFixed(1) : "0"}%</span>
                  <span className="tabular-nums">{formatUSD(d.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
