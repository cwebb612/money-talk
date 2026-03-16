"use client";

import { useState } from "react";
import Card from "../ui/Card";
import ExternalLink from "../ui/ExternalLink";
import AccountForm, { AccountFormData } from "./AccountForm";
import { AccountType } from "../../lib/db/models/account";
import { formatUSD } from "../../lib/utils/money";

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
}

export default function AccountDetail({ account, onUpdate }: AccountDetailProps) {
  const [editing, setEditing] = useState(false);

  async function handleUpdate(data: AccountFormData) {
    await onUpdate(data);
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
              {account.name}
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--color-blue)", color: "var(--color-muted)" }}
            >
              {account.type}
            </span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: "var(--color-yellow)" }}>
              {formatUSD(account.currentValue)}
            </p>
            {account.institutionUrl && (
              <ExternalLink href={account.institutionUrl} className="text-sm mt-1">
                Open account
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
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs px-3 py-1 rounded-full"
              style={{ backgroundColor: "var(--color-blue)", color: "var(--color-yellow)" }}
            >
              Update Values
            </button>
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
            submitLabel="Save Changes"
          />
        ) : (
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Click &ldquo;Update Values&rdquo; to reconcile this account.
          </p>
        )}
      </Card>
    </div>
  );
}
