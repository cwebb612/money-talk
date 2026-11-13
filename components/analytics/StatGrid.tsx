export interface Stat {
  label: string;
  value: string;
  sub?: string | null;
  color: string;
}

interface Props {
  stats: Stat[];
  minColumnWidth?: number;
}

export default function StatGrid({ stats, minColumnWidth }: Props) {
  const columns = minColumnWidth
    ? `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`
    : `repeat(${stats.length}, 1fr)`;

  return (
    <div className="mt-4" style={{ display: "grid", gridTemplateColumns: columns, gap: 12 }}>
      {stats.map(({ label, value, sub, color }) => (
        <div key={label} className="rounded-lg p-4" style={{ backgroundColor: "var(--color-border)" }}>
          <div className="text-xs mb-2" style={{ color: "var(--color-muted)" }}>{label}</div>
          <div className="text-xl font-semibold tabular-nums" style={{ color }}>{value}</div>
          {sub && <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>{sub}</div>}
        </div>
      ))}
    </div>
  );
}
