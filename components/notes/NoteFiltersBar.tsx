"use client";

import { useId } from "react";
import { Search, X } from "lucide-react";
import Select from "../ui/Select";
import PillToggle from "../ui/PillToggle";
import FilterField from "../ui/FilterField";
import { NoteAccountOption } from "./NoteForm";
import { NO_ACCOUNT, NoteFilters } from "../../lib/utils/notes";
import { DATE_RANGE_OPTIONS, DateRange, SORT_OPTIONS, SortOrder } from "../../lib/utils/filters";

const UNDATED_OPTIONS = [
  { value: "show", label: "Show" },
  { value: "hide", label: "Hide" },
];

interface NoteFiltersBarProps {
  filters: NoteFilters;
  accounts: NoteAccountOption[];
  onChange: (filters: NoteFilters) => void;
}

export default function NoteFiltersBar({ filters, accounts, onChange }: NoteFiltersBarProps) {
  const searchId = useId();
  const accountId = useId();
  const rangeId = useId();
  const sortId = useId();

  function update(patch: Partial<NoteFilters>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div
      className="grid grid-cols-1 tablet:grid-cols-3 desktop:grid-cols-[minmax(12rem,1fr)_11rem_10rem_9rem_auto] items-end gap-4 rounded-xl p-4"
      style={{ backgroundColor: "var(--color-card)" }}
    >
      <FilterField label="Search" htmlFor={searchId} className="tablet:col-span-3 desktop:col-span-1">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--color-muted)" }}
          />
          <input
            id={searchId}
            type="search"
            value={filters.query}
            onChange={(e) => update({ query: e.target.value })}
            placeholder="Search notes…"
            className="block w-full pl-9 pr-9 py-2 rounded-lg outline-none text-sm [&::-webkit-search-cancel-button]:hidden"
            style={{
              backgroundColor: "var(--color-card)",
              color: "var(--color-text)",
              border: "1px solid var(--color-muted)",
            }}
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => update({ query: "" })}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-muted)" }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </FilterField>

      <FilterField label="Account" htmlFor={accountId}>
        <Select
          id={accountId}
          value={filters.accountId}
          onChange={(value) => update({ accountId: value })}
          options={[
            { value: "", label: "All accounts" },
            { value: NO_ACCOUNT, label: "No account" },
            ...accounts.map((account) => ({ value: account._id, label: account.name })),
          ]}
        />
      </FilterField>

      <FilterField label="Date" htmlFor={rangeId}>
        <Select
          id={rangeId}
          value={filters.range}
          onChange={(value) => update({ range: value as DateRange })}
          options={DATE_RANGE_OPTIONS}
        />
      </FilterField>

      <FilterField label="Sort" htmlFor={sortId}>
        <Select
          id={sortId}
          value={filters.sort}
          onChange={(value) => update({ sort: value as SortOrder })}
          options={SORT_OPTIONS}
        />
      </FilterField>

      <FilterField label="Undated" className="tablet:col-span-3 desktop:col-span-1">
        <div className="flex items-center h-[38px]">
          <PillToggle
            ariaLabel="Undated notes"
            value={filters.includeUndated ? "show" : "hide"}
            options={UNDATED_OPTIONS}
            onChange={(value) => update({ includeUndated: value === "show" })}
          />
        </div>
      </FilterField>
    </div>
  );
}
