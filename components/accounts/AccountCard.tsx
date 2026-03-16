import Link from "next/link";
import Card from "../ui/Card";
import { IAccount } from "../../lib/db/models/account";
import { formatUSD } from "../../lib/utils/money";

const TYPE_LABELS: Record<string, string> = {
  cash: "Cash",
  stock: "Stock",
  crypto: "Crypto",
  liability: "Liability",
};

interface AccountCardProps {
  account: Pick<IAccount, "_id" | "name" | "type" | "currentValue"> & { _id: string };
}

export default function AccountCard({ account }: AccountCardProps) {
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
        <p className="font-semibold text-sm" style={{ color: "var(--color-yellow)" }}>
          {formatUSD(account.currentValue)}
        </p>
      </Card>
    </Link>
  );
}
