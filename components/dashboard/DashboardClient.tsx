"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import NetWorthCard from "./NetWorthCard";
import AssetPieChart from "./AssetPieChart";
import AccountBreakdown, { AccountDoc } from "./AccountBreakdown";
import GoalsSummaryCard from "./GoalsSummaryCard";
import { buildNetWorthSeries } from "../../lib/utils/netWorth";
import { DashboardGrid, GridModule } from "../ui/DashboardGrid";
import { NoteDTO } from "../../lib/utils/notes";
import { GoalDTO } from "../../lib/utils/goals";

interface Props {
  accounts: AccountDoc[];
  activities: { accountId: string; date: string; value: number }[];
  notes: NoteDTO[];
  goals: GoalDTO[];
  today: string;
  updatedAt: string;
}

export default function DashboardClient({ accounts, activities, notes, goals, today, updatedAt }: Props) {
  const router = useRouter();
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

  const chartData = useMemo(() => {
    const includedTypes = new Map(
      includedAccounts.map((a) => [a._id, a.type])
    );
    return buildNetWorthSeries(activities, includedTypes);
  }, [activities, includedAccounts]);

  const hasPieData = includedAccounts.some((a) => a.type !== "liability" && a.currentValue > 0);

  return (
    <DashboardGrid>
      <GridModule span={hasPieData ? "main" : "full"} stretch>
        <NetWorthCard
          value={netWorth}
          updatedAt={updatedAt}
          chartData={chartData}
          notes={notes}
          onNotesChanged={() => router.refresh()}
        />
      </GridModule>
      {hasPieData && (
        <GridModule span="side" stretch>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <AssetPieChart accounts={includedAccounts as any} />
        </GridModule>
      )}
      <GridModule span="full">
        <AccountBreakdown accounts={accounts} checked={checked} onToggle={toggle} />
      </GridModule>
      {goals.length > 0 && (
        <GridModule span="full">
          <GoalsSummaryCard goals={goals} accounts={accounts} today={today} />
        </GridModule>
      )}
    </DashboardGrid>
  );
}
