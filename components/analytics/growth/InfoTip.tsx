"use client";

import { ReactNode, useId, useState } from "react";
import { Info } from "lucide-react";

interface Props {
  label: string;
  children: ReactNode;
}

export default function InfoTip({ label, children }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="inline-flex items-center justify-center rounded-full p-0.5 focus-visible:outline-2"
        style={{ color: "var(--color-muted)", outlineColor: "var(--color-blue)" }}
      >
        <Info size={13} />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute right-0 top-full mt-1 z-10 w-72 max-w-[calc(100vw-2rem)] rounded-lg p-3 text-xs leading-relaxed shadow-lg"
          style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
        >
          {children}
        </span>
      )}
    </span>
  );
}
