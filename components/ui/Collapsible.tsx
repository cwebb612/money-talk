"use client";

import { ReactNode, useState, useSyncExternalStore } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

// Matches Tailwind's `lg` breakpoint, where DashboardGrid switches to the desktop layout.
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeToDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeToDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false
  );
}

export function useCollapsible(defaultOpen = true) {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(defaultOpen);

  return {
    expanded: open || isDesktop,
    collapsible: !isDesktop,
    toggle: () => setOpen((o) => !o),
  };
}

interface CollapsibleHeaderProps {
  expanded: boolean;
  collapsible: boolean;
  onToggle: () => void;
  label: string;
  children: ReactNode;
  className?: string;
  chevronClassName?: string;
  chevronSize?: number;
}

// The chevron is also hidden with CSS so desktop never flashes it before hydration.
export function CollapsibleHeader({
  expanded,
  collapsible,
  onToggle,
  label,
  children,
  className = "",
  chevronClassName = "text-xs px-2 py-1",
  chevronSize,
}: CollapsibleHeaderProps) {
  if (!collapsible) {
    return <div className={`w-full flex justify-between ${className}`}>{children}</div>;
  }

  return (
    <button
      onClick={onToggle}
      className={`w-full flex justify-between text-left ${className}`}
      aria-expanded={expanded}
      aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
    >
      {children}
      <span className={`lg:hidden ${chevronClassName}`} style={{ color: "var(--color-muted)" }}>
        {expanded ? <ChevronUp size={chevronSize} /> : <ChevronDown size={chevronSize} />}
      </span>
    </button>
  );
}
