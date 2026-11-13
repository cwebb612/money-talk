"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import ActivityFiltersBar, {
  ActivityFilters,
  DEFAULT_ACTIVITY_FILTERS,
} from "../../../components/activity/ActivityFiltersBar";
import ListCard, { ListCardEmpty, ListCardRows } from "../../../components/ui/ListCard";
import { useAccountOptions } from "../../../components/accounts/useAccountOptions";
import ActivityListItem from "../../../components/activity/ActivityListItem";
import ActivityEditDrawer, { EditableActivity } from "../../../components/activity/ActivityEditDrawer";
import { AccountType } from "../../../lib/db/models/account";
import { Holding } from "../../../components/accounts/HoldingsEditor";
import { rangeStartDate, todayString } from "../../../lib/utils/filters";

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

function activityQuery(filters: ActivityFilters, limit: number): string {
  const params = new URLSearchParams({ limit: String(limit), skip: "0", sort: filters.sort });
  if (filters.accountId) params.set("accountId", filters.accountId);
  const from = rangeStartDate(filters.range, todayString());
  if (from) params.set("from", from);
  return params.toString();
}

function hasActiveFilters(filters: ActivityFilters): boolean {
  return filters.accountId !== DEFAULT_ACTIVITY_FILTERS.accountId || filters.range !== DEFAULT_ACTIVITY_FILTERS.range;
}

export default function ActivityLogPage() {
  const [items, setItems] = useState<ActivityEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditableActivity | null>(null);
  const [filters, setFilters] = useState(DEFAULT_ACTIVITY_FILTERS);
  const accounts = useAccountOptions();
  const latestRequest = useRef(0);

  const fetchPage = useCallback(
    (limit: number) => {
      const request = ++latestRequest.current;
      const isLatest = () => request === latestRequest.current;
      fetch(`/api/activity?${activityQuery(filters, limit)}`)
        .then((r) => r.json())
        .then((data: { items: ActivityEntry[]; hasMore: boolean }) => {
          if (!isLatest()) return;
          setItems(data.items);
          setHasMore(data.hasMore);
        })
        .finally(() => {
          if (isLatest()) setLoading(false);
        });
    },
    [filters]
  );

  useEffect(() => {
    fetchPage(PAGE_SIZE);
  }, [fetchPage]);

  const filtersActive = hasActiveFilters(filters);

  function listSummary(): string {
    if (loading) return "Loading…";
    return `${items.length}${hasMore ? "+" : ""} ${items.length === 1 ? "entry" : "entries"}`;
  }

  function clearFilters() {
    setFilters({ ...DEFAULT_ACTIVITY_FILTERS, sort: filters.sort });
  }

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
    <div className="max-w-2xl desktop:max-w-5xl mx-auto px-4 desktop:px-8 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm" style={{ color: "var(--color-muted)" }}>
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--color-text)" }}>
        Activity Log
      </h1>

      <div className="flex flex-col gap-6">
        <ActivityFiltersBar filters={filters} accounts={accounts} onChange={setFilters} />

        <ListCard summary={listSummary()} onClearFilters={filtersActive ? clearFilters : undefined}>
          {!loading && items.length === 0 ? (
            <ListCardEmpty>{filtersActive ? "No activity matches these filters." : "No activity yet."}</ListCardEmpty>
          ) : (
            <ListCardRows>
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
            </ListCardRows>
          )}

          {hasMore && (
            <div className="px-4 py-3">
              <button onClick={loadMore} className="text-sm" style={{ color: "var(--color-yellow)" }}>
                Load more
              </button>
            </div>
          )}
        </ListCard>
      </div>

      <ActivityEditDrawer
        activity={editing}
        onClose={() => setEditing(null)}
        onSaved={handleChanged}
        onDeleted={handleChanged}
      />
    </div>
  );
}
