"use client";

import { useId } from "react";
import Select from "../ui/Select";
import FilterField from "../ui/FilterField";
import { AccountOption } from "../accounts/useAccountOptions";
import { DATE_RANGE_OPTIONS, DateRange, SORT_OPTIONS, SortOrder } from "../../lib/utils/filters";

export interface ActivityFilters {
  accountId: string;
  range: DateRange;
  sort: SortOrder;
}

export const DEFAULT_ACTIVITY_FILTERS: ActivityFilters = {
  accountId: "",
  range: "all",
  sort: "newest",
};

interface ActivityFiltersBarProps {
  filters: ActivityFilters;
  accounts: AccountOption[];
  onChange: (filters: ActivityFilters) => void;
}

export default function ActivityFiltersBar({ filters, accounts, onChange }: ActivityFiltersBarProps) {
  const accountId = useId();
  const rangeId = useId();
  const sortId = useId();

  function update(patch: Partial<ActivityFilters>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div
      className="grid grid-cols-1 tablet:grid-cols-3 items-end gap-4 rounded-xl p-4"
      style={{ backgroundColor: "var(--color-card)" }}
    >
      <FilterField label="Account" htmlFor={accountId}>
        <Select
          id={accountId}
          value={filters.accountId}
          onChange={(value) => update({ accountId: value })}
          options={[
            { value: "", label: "All accounts" },
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
    </div>
  );
}
