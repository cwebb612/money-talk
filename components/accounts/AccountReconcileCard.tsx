"use client";

import { useState } from "react";
import Card from "../ui/Card";
import AccountForm, { AccountFormData } from "./AccountForm";
import { AccountType } from "../../lib/db/models/account";
import { X } from "lucide-react";

interface ReconcileAccount {
  name: string;
  type: AccountType;
  institutionUrl?: string;
  notes?: string;
  balance?: number;
  holdings: { ticker: string; quantity: number; pricePerUnit: number }[];
}

interface AccountReconcileCardProps {
  account: ReconcileAccount;
  onUpdate: (data: AccountFormData) => Promise<void>;
  onRefreshPrices: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function AccountReconcileCard({ account, onUpdate, onRefreshPrices, onDelete }: AccountReconcileCardProps) {
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
            notes: account.notes ?? "",
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
  );
}
