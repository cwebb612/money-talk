"use client";

import { useState } from "react";
import NetWorthHeader from "./NetWorthHeader";
import NetWorthChart from "./NetWorthChart";

interface Props {
  value: number;
  updatedAt: string;
  chartData: { date: string; value: number }[];
}

export default function NetWorthCard({ value, updatedAt, chartData }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: "var(--color-card)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between text-left"
        aria-label={open ? "Collapse chart" : "Expand chart"}
      >
        <NetWorthHeader value={value} updatedAt={updatedAt} />
        <span className="text-xs mt-1 px-2 py-1" style={{ color: "var(--color-muted)" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div className="mt-4">
          <NetWorthChart data={chartData} />
        </div>
      )}
    </div>
  );
}
