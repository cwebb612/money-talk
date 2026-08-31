"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Card from "../../../components/ui/Card";
import ActivityListItem from "../../../components/activity/ActivityListItem";
import ActivityEditDrawer, { EditableActivity } from "../../../components/activity/ActivityEditDrawer";
import { AccountType } from "../../../lib/db/models/account";
import { Holding } from "../../../components/accounts/HoldingsEditor";

interface ActivityEntry {
  _id: string;
  accountId: string;
  accountName: string;
  accountType: AccountType;
  value: number;
  holdings: Holding[];
  date: string;
  recordedAt: string;
}

const PAGE_SIZE = 50;

export default function ActivityLogPage() {
  const [items, setItems] = useState<ActivityEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditableActivity | null>(null);

  const fetchPage = useCallback((limit: number) => {
    fetch(`/api/activity?limit=${limit}&skip=0`)
      .then((r) => r.json())
      .then((data: { items: ActivityEntry[]; hasMore: boolean }) => {
        setItems(data.items);
        setHasMore(data.hasMore);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPage(PAGE_SIZE);
  }, [fetchPage]);

  function loadMore() {
    fetchPage(items.length + PAGE_SIZE);
  }

  function handleEdit(entry: ActivityEntry) {
    setEditing({
      _id: entry._id,
      accountId: entry.accountId,
      accountType: entry.accountType,
      accountName: entry.accountName,
      date: entry.date,
      value: entry.value,
      holdings: entry.holdings,
    });
  }

  function handleChanged() {
    setEditing(null);
    fetchPage(Math.max(items.length, PAGE_SIZE));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm" style={{ color: "var(--color-muted)" }}>
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--color-text)" }}>
        Activity Log
      </h1>

      <Card>
        {loading && items.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Loading…
          </p>
        ) : items.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            No activity yet.
          </p>
        ) : (
          <div>
            {items.map((entry) => (
              <ActivityListItem
                key={entry._id}
                date={entry.date}
                value={entry.value}
                accountName={entry.accountName}
                accountType={entry.accountType}
                onEdit={() => handleEdit(entry)}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <button
            onClick={loadMore}
            className="text-sm mt-3"
            style={{ color: "var(--color-yellow)" }}
          >
            Load more
          </button>
        )}
      </Card>

      <ActivityEditDrawer
        activity={editing}
        onClose={() => setEditing(null)}
        onSaved={handleChanged}
        onDeleted={handleChanged}
      />
    </div>
  );
}
