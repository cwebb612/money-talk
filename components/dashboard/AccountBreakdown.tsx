import AccountCard from "../accounts/AccountCard";
import { IAccount } from "../../lib/db/models/account";
import { formatUSD } from "../../lib/utils/money";

type AccountDoc = Pick<IAccount, "_id" | "name" | "type" | "currentValue"> & { _id: string; lastUpdated?: string | null };

interface AccountBreakdownProps {
  accounts: AccountDoc[];
}

export default function AccountBreakdown({ accounts }: AccountBreakdownProps) {
  const assets = accounts.filter((a) => a.type !== "liability");
  const liabilities = accounts.filter((a) => a.type === "liability");

  const assetTotal = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const liabilityTotal = liabilities.reduce((sum, a) => sum + a.currentValue, 0);

  return (
    <div className="flex flex-col gap-6">
      <Section title="Assets" total={assetTotal} accounts={assets} />
      {liabilities.length > 0 && (
        <Section title="Liabilities" total={liabilityTotal} accounts={liabilities} />
      )}
    </div>
  );
}

function Section({
  title,
  total,
  accounts,
}: {
  title: string;
  total: number;
  accounts: AccountDoc[];
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
          {title}
        </h2>
        <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
          {formatUSD(total)}
        </span>
      </div>
      {accounts.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          No {title.toLowerCase()} yet
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {accounts.map((account) => (
            <AccountCard key={account._id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
