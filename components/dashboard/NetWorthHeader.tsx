import { formatUSD } from "../../lib/utils/money";

interface NetWorthHeaderProps {
  value: number;
  updatedAt: string;
}

export default function NetWorthHeader({ value, updatedAt }: NetWorthHeaderProps) {
  const [y, m, d] = updatedAt.split("-").map(Number);
  const formatted = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mb-2">
      <p className="text-4xl font-bold" style={{ color: "var(--color-yellow)" }}>
        {formatUSD(value)}
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
        Last updated {formatted}
      </p>
    </div>
  );
}
