"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "../ui/Card";
import ActivityListItem from "../activity/ActivityListItem";
import ActivityEditDrawer, { EditableActivity } from "../activity/ActivityEditDrawer";
import { AccountType } from "../../lib/db/models/account";
import { Holding } from "./HoldingsEditor";

interface ActivityEntry {
  _id: string;
  value: number;
  holdings: Holding[];
  date: string;
  recordedAt: string;
}

interface AccountActivityCardProps {
  accountId: string;
  accountType: AccountType;
  onChanged: () => void;
}

const WINDOW_STEPS = [3, 6, 12] as const;

export default function AccountActivityCard({ accountId, accountType, onChanged }: AccountActivityCardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditableActivity | null>(null);

  const months = stepIndex < WINDOW_STEPS.length ? WINDOW_STEPS[stepIndex] : "all";

  const fetchEntries = useCallback(() => {
    fetch(`/api/accounts/${accountId}/activity-log?months=${months}`)
      .then((r) => r.json())
      .then((data: ActivityEntry[]) => setEntries(data))
      .finally(() => setLoading(false));
  }, [accountId, months]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  function handleEdit(entry: ActivityEntry) {
    setEditing({
      _id: entry._id,
      accountId,
      accountType,
      date: entry.date,
      value: entry.value,
      holdings: entry.holdings,
    });
  }

  function handleSaved() {
    setEditing(null);
    fetchEntries();
    onChanged();
  }

  function handleDeleted() {
    setEditing(null);
    fetchEntries();
    onChanged();
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text)" }}>
        Activity
      </h3>

      {loading && entries.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          Loading…
        </p>
      ) : entries.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          No activity in this range.
        </p>
      ) : (
        <div>
          {entries.map((entry) => (
            <ActivityListItem
              key={entry._id}
              date={entry.date}
              value={entry.value}
              onEdit={() => handleEdit(entry)}
            />
          ))}
        </div>
      )}

      {months !== "all" && (
        <button
          onClick={() => setStepIndex((i) => i + 1)}
          className="text-sm mt-3"
          style={{ color: "var(--color-yellow)" }}
        >
          Show more
        </button>
      )}

      <ActivityEditDrawer
        activity={editing}
        onClose={() => setEditing(null)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </Card>
  );
}
