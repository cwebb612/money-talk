import Link from "next/link";
import Card from "../ui/Card";
import { IAccount } from "../../lib/db/models/account";
import { formatUSD } from "../../lib/utils/money";

const TYPE_LABELS: Record<string, string> = {
  cash: "Cash",
  investment: "Investment",
  liability: "Liability",
};

interface AccountCardProps {
  account: Pick<IAccount, "_id" | "name" | "type" | "currentValue"> & {
    _id: string;
    lastUpdated?: string | null;
  };
}

function formatLastUpdated(dateStr: string): { label: string; stale: boolean } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const stale = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24) > 30;
  const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return { label, stale };
}

export default function AccountCard({ account }: AccountCardProps) {
  const updatedInfo = account.lastUpdated ? formatLastUpdated(account.lastUpdated) : null;

  return (
    <Link href={`/accounts/${account._id}`}>
      <Card className="flex items-center justify-between hover:opacity-80 transition-opacity cursor-pointer">
        <div>
          <p className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
            {account.name}
          </p>
          <span
            className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
            style={{ backgroundColor: "var(--color-border)", color: "var(--color-muted)" }}
          >
            {TYPE_LABELS[account.type]}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <p className="font-semibold text-sm" style={{ color: "var(--color-yellow)" }}>
            {formatUSD(account.currentValue)}
          </p>
          {updatedInfo && (
            <p
              className="text-xs"
              style={{ color: updatedInfo.stale ? "#ef4444" : "var(--color-muted)" }}
            >
              {updatedInfo.label}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
