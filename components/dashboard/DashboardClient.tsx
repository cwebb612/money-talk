"use client";

import { useState, useCallback } from "react";
import NetWorthCard from "./NetWorthCard";
import AssetPieChart from "./AssetPieChart";
import AccountBreakdown, { AccountDoc } from "./AccountBreakdown";

interface Props {
  accounts: AccountDoc[];
  chartData: { date: string; value: number }[];
  updatedAt: string;
}

export default function DashboardClient({ accounts, chartData, updatedAt }: Props) {
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(accounts.map((a) => a._id))
  );

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const includedAccounts = accounts.filter((a) => checked.has(a._id));

  const netWorth = includedAccounts.reduce(
    (sum, a) => sum + (a.type === "liability" ? -a.currentValue : a.currentValue),
    0
  );

  return (
    <>
      <NetWorthCard value={netWorth} updatedAt={updatedAt} chartData={chartData} />
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AssetPieChart accounts={includedAccounts as any} />
      <AccountBreakdown accounts={accounts} checked={checked} onToggle={toggle} />
    </>
  );
}
