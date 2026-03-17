"use client";

import { useState } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import HoldingsEditor, { Holding } from "./HoldingsEditor";
import { AccountType } from "../../lib/db/models/account";

export interface AccountFormData {
  name: string;
  type: AccountType;
  institutionUrl: string;
  balance: number;
  holdings: Holding[];
  recordedAt?: string;
}

interface AccountFormProps {
  initial?: Partial<AccountFormData>;
  onSubmit: (data: AccountFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  submitLabel?: string;
  showDateField?: boolean;
}

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "investment", label: "Investment" },
  { value: "liability", label: "Liability" },
];

export default function AccountForm({
  initial,
  onSubmit,
  onDelete,
  submitLabel = "Save",
  showDateField = false,
}: AccountFormProps) {
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in browser's local timezone
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<AccountType>(initial?.type ?? "cash");
  const [institutionUrl, setInstitutionUrl] = useState(initial?.institutionUrl ?? "");
  const [balance, setBalance] = useState(initial?.balance ?? 0);
  const [holdings, setHoldings] = useState<Holding[]>(initial?.holdings ?? []);
  const [recordedAt, setRecordedAt] = useState(initial?.recordedAt ?? today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit({ name, type, institutionUrl, balance, holdings, recordedAt: showDateField ? recordedAt : undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const isCashLike = type === "cash" || type === "liability";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs mb-1" style={{ color: "var(--color-muted)" }}>
          Account Name
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chase Checking"
          required
        />
      </div>

      <div>
        <label className="block text-xs mb-1" style={{ color: "var(--color-muted)" }}>
          Type
        </label>
        <div className="flex gap-2 flex-wrap">
          {ACCOUNT_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                backgroundColor: type === value ? "var(--color-yellow)" : "var(--color-border)",
                color: type === value ? "black" : "var(--color-text)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs mb-1" style={{ color: "var(--color-muted)" }}>
          Institution Link (optional)
        </label>
        <Input
          type="url"
          value={institutionUrl}
          onChange={(e) => setInstitutionUrl(e.target.value)}
          placeholder="https://your-bank.com"
        />
      </div>

      {isCashLike ? (
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-muted)" }}>
            {type === "liability" ? "Amount Owed" : "Balance"}
          </label>
          <Input
            type="number"
            value={balance || ""}
            onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            required
          />
        </div>
      ) : (
        <div>
          <label className="block text-xs mb-2" style={{ color: "var(--color-muted)" }}>
            Holdings
          </label>
          <HoldingsEditor holdings={holdings} onChange={setHoldings} />
        </div>
      )}

      {showDateField && (
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-muted)" }}>
            Date
          </label>
          <Input
            type="date"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            required
          />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : submitLabel}
      </Button>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
        >
          Delete Account
        </button>
      )}
    </form>
  );
}
