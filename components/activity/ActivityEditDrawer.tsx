"use client";

import { useEffect, useState } from "react";
import Drawer from "../ui/Drawer";
import Popconfirm from "../ui/Popconfirm";
import Button from "../ui/Button";
import Input from "../ui/Input";
import HoldingsEditor, { Holding } from "../accounts/HoldingsEditor";
import { AccountType } from "../../lib/db/models/account";
import { parseNumeric, formatNumeric } from "../../lib/utils/money";

export interface EditableActivity {
  _id: string;
  accountId: string;
  accountType: AccountType;
  accountName?: string;
  date: string;
  value: number;
  holdings: Holding[];
}

interface ActivityEditDrawerProps {
  activity: EditableActivity | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export default function ActivityEditDrawer({ activity, onClose, onSaved, onDeleted }: ActivityEditDrawerProps) {
  const [valueStr, setValueStr] = useState("");
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!activity) return;
    setValueStr(formatNumeric(activity.value));
    setHoldings(activity.holdings);
    setError("");
  }, [activity]);

  if (!activity) return null;

  const isInvestment = activity.accountType === "investment";
  const [y, m, d] = activity.date.split("-").map(Number);
  const formattedDate = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      const body = isInvestment ? { holdings } : { value: parseNumeric(valueStr) };
      const res = await fetch(`/api/activity/entry/${activity!._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to save activity");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setError("");
    try {
      const res = await fetch(`/api/activity/entry/${activity!._id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to delete activity");
      }
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <Drawer open={!!activity} onClose={onClose} title="Edit Activity">
      <div className="flex flex-col gap-4">
        {activity.accountName && (
          <p className="text-sm" style={{ color: "var(--color-text)" }}>
            {activity.accountName}
          </p>
        )}
        <p className="text-xs" style={{ color: "var(--color-muted)" }}>
          {formattedDate}
        </p>

        {isInvestment ? (
          <div>
            <label className="block text-xs mb-2" style={{ color: "var(--color-muted)" }}>
              Holdings
            </label>
            <HoldingsEditor holdings={holdings} onChange={setHoldings} />
          </div>
        ) : (
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--color-muted)" }}>
              {activity.accountType === "liability" ? "Amount Owed" : "Balance"}
            </label>
            <Input
              type="text"
              inputMode="decimal"
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              onBlur={(e) => setValueStr(formatNumeric(parseNumeric(e.target.value)))}
              placeholder="0.00"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>

        <Popconfirm title="Delete this activity? This cannot be undone." onConfirm={handleDelete}>
          <button
            type="button"
            className="w-full py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
          >
            Delete Activity
          </button>
        </Popconfirm>
      </div>
    </Drawer>
  );
}
