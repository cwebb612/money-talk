"use client";

import { useState } from "react";
import Card from "../ui/Card";
import ExternalLink from "../ui/ExternalLink";
import AccountForm, { AccountFormData } from "./AccountForm";
import { AccountType } from "../../lib/db/models/account";
import { formatUSD } from "../../lib/utils/money";
import { X } from "lucide-react";

interface AccountDoc {
  _id: string;
  userId: string;
  name: string;
  type: AccountType;
  institutionUrl?: string;
  balance?: number;
  holdings: { ticker: string; quantity: number; pricePerUnit: number }[];
  currentValue: number;
}

interface AccountDetailProps {
  account: AccountDoc;
  onUpdate: (data: AccountFormData) => Promise<void>;
  onRefreshPrices: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function AccountDetail({ account, onUpdate, onRefreshPrices, onDelete }: AccountDetailProps) {
  const [editing, setEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isInvestment = account.type === "investment";

  async function handleRefreshPrices() {
    setRefreshing(true);
    try {
      await onRefreshPrices();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleUpdate(data: AccountFormData) {
    await onUpdate(data);
    setEditing(false);
  }

  function cancelEditing() {
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
              {account.name}
            </h2>
            <span
              className="text-sm px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              {account.type}
            </span>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <p className="text-2xl font-bold" style={{ color: "var(--color-yellow)" }}>
              {formatUSD(account.currentValue)}
            </p>
            {account.institutionUrl && (
              <ExternalLink href={account.institutionUrl} className="text-sm mt-1">
                Go To Account
              </ExternalLink>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            {editing ? "Edit Account" : "Reconcile"}
          </h3>
          {editing ? <button onClick={cancelEditing}>
              <X />
          </button> : undefined}
          {!editing && (
            <div className="flex items-center gap-2">
              {isInvestment && (
                <button
                  onClick={handleRefreshPrices}
                  disabled={refreshing}
                  className="text-sm px-3 py-1 rounded-full"
                  style={{
                    border: "1px solid var(--color-yellow)",
                    color: refreshing ? "var(--color-muted)" : "var(--color-yellow)",
                    opacity: refreshing ? 0.6 : 1,
                  }}
                >
                  {refreshing ? "Refreshing…" : "Refresh Prices"}
                </button>
              )}
              <button
                onClick={() => setEditing(true)}
                className="text-sm px-3 py-1 rounded-full"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-text)" }}
              >
                Update Account
              </button>
            </div>
          )}
        </div>
        {editing ? (
          <AccountForm
            initial={{
              name: account.name,
              type: account.type,
              institutionUrl: account.institutionUrl ?? "",
              balance: account.balance ?? 0,
              holdings: account.holdings ?? [],
            }}
            onSubmit={handleUpdate}
            onDelete={onDelete}
            submitLabel="Save Changes"
            showDateField
          />
        ) : (
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Click &ldquo;Update Account&rdquo; to reconcile this account.
          </p>
        )}
      </Card>
    </div>
  );
}
