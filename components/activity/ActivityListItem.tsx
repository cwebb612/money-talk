"use client";

import { Pencil } from "lucide-react";
import { formatUSD } from "../../lib/utils/money";
import { AccountType } from "../../lib/db/models/account";

interface ActivityListItemProps {
  date: string;
  value: number;
  accountName?: string;
  accountType?: AccountType;
  onEdit: () => void;
}

export default function ActivityListItem({ date, value, accountName, accountType, onEdit }: ActivityListItemProps) {
  const [y, m, d] = date.split("-").map(Number);
  const formattedDate = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="flex items-center justify-between py-2"
      style={{ borderBottom: "1px solid var(--color-border)" }}
    >
      <div>
        {accountName && (
          <p className="text-sm" style={{ color: "var(--color-text)" }}>
            {accountName}
            {accountType && (
              <span className="text-xs ml-2" style={{ color: "var(--color-muted)" }}>
                {accountType}
              </span>
            )}
          </p>
        )}
        <p className="text-xs" style={{ color: "var(--color-muted)" }}>
          {formattedDate}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
          {formatUSD(value)}
        </p>
        <button onClick={onEdit} aria-label="Edit activity" style={{ color: "var(--color-muted)" }}>
          <Pencil size={16} />
        </button>
      </div>
    </div>
  );
}
