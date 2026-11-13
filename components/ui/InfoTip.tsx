"use client";

import { ReactNode, useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { clamp } from "../../lib/utils/math";

interface Props {
  label: string;
  children: ReactNode;
}

const TIP_WIDTH = 288;
const EDGE_GAP = 8;
const ANCHOR_GAP = 4;

export default function InfoTip({ label, children }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);

  const place = useCallback(() => {
    const tip = tipRef.current;
    const anchor = buttonRef.current?.getBoundingClientRect();
    if (!tip || !anchor) return;
    const width = Math.min(TIP_WIDTH, window.innerWidth - EDGE_GAP * 2);
    const left = clamp(anchor.left + anchor.width / 2 - width / 2, EDGE_GAP, window.innerWidth - width - EDGE_GAP);
    tip.style.width = `${width}px`;
    const height = tip.offsetHeight;
    const below = anchor.bottom + ANCHOR_GAP;
    const fitsBelow = below + height <= window.innerHeight - EDGE_GAP;
    const top = fitsBelow ? below : Math.max(EDGE_GAP, anchor.top - ANCHOR_GAP - height);
    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
    tip.style.visibility = "visible";
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        ref={buttonRef}
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
      {open &&
        createPortal(
          <span
            ref={tipRef}
            id={id}
            role="tooltip"
            className="rounded-lg p-3 text-xs leading-relaxed shadow-lg pointer-events-none"
            style={{
              position: "fixed",
              zIndex: 200,
              top: 0,
              left: 0,
              width: TIP_WIDTH,
              visibility: "hidden",
              backgroundColor: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            {children}
          </span>,
          document.body
        )}
    </span>
  );
}
