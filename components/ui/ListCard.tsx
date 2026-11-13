import { ReactNode } from "react";

interface ListCardProps {
  summary: string;
  onClearFilters?: () => void;
  children: ReactNode;
}

export default function ListCard({ summary, onClearFilters, children }: ListCardProps) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-card)" }}>
      <div
        className="flex items-center justify-between gap-4 px-4 py-3"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <p className="text-xs tabular-nums" style={{ color: "var(--color-muted)" }}>
          {summary}
        </p>
        {onClearFilters && (
          <button onClick={onClearFilters} className="text-xs font-medium" style={{ color: "var(--color-yellow)" }}>
            Clear filters
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export function ListCardEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm px-4 py-6 text-center" style={{ color: "var(--color-muted)" }}>
      {children}
    </p>
  );
}

export function ListCardRows({ children }: { children: ReactNode }) {
  return <div className="px-4 -mb-px">{children}</div>;
}
