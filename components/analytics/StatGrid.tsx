export interface Stat {
  label: string;
  value: string;
  sub?: string | null;
  color: string;
}

export default function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div
      className="mt-4"
      style={{ display: "grid", gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 12 }}
    >
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
