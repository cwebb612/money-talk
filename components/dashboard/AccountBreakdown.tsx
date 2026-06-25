"use client";

import AccountCard from "../accounts/AccountCard";
import { IAccount } from "../../lib/db/models/account";
import { formatUSD } from "../../lib/utils/money";

export type AccountDoc = {
  _id: string;
  name: string;
  type: IAccount["type"];
  currentValue: number;
  lastUpdated?: string | null;
};

interface AccountBreakdownProps {
  accounts: AccountDoc[];
  checked: Set<string>;
  onToggle: (id: string) => void;
}

export default function AccountBreakdown({ accounts, checked, onToggle }: AccountBreakdownProps) {
  const assets = accounts.filter((a) => a.type !== "liability");
  const liabilities = accounts.filter((a) => a.type === "liability");

  const assetTotal = assets
    .filter((a) => checked.has(a._id))
    .reduce((sum, a) => sum + a.currentValue, 0);
  const liabilityTotal = liabilities
    .filter((a) => checked.has(a._id))
    .reduce((sum, a) => sum + a.currentValue, 0);

  return (
    <div className="flex flex-col gap-6">
      <Section title="Assets" total={assetTotal} accounts={assets} checked={checked} onToggle={onToggle} />
      {liabilities.length > 0 && (
        <Section title="Liabilities" total={liabilityTotal} accounts={liabilities} checked={checked} onToggle={onToggle} />
      )}
    </div>
  );
}

function Section({
  title,
  total,
  accounts,
  checked,
  onToggle,
}: {
  title: string;
  total: number;
  accounts: AccountDoc[];
  checked: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
          {title}
        </h2>
        <span className="text-sm font-medium pr-4" style={{ color: "var(--color-text)" }}>
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
            <AccountCard
              key={account._id}
              account={account}
              checked={checked.has(account._id)}
              onToggle={() => onToggle(account._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
