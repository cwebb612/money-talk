"use client";

import { useState, ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface Props {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function AnalyticsCard({ title, children, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: "var(--color-card)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left"
        aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
      >
        <span className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
          {title}
        </span>
        <span style={{ color: "var(--color-muted)" }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}
