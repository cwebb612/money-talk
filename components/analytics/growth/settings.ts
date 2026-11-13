import { AccountTotals } from "../../../lib/utils/netWorth";

export type StartSource = keyof AccountTotals;

export interface GrowthSettings {
  startSource: StartSource;
  startOverride: number | null;
  monthlyContribution: number;
  contributionIncrease: number;
  annualReturn: number;
  years: number;
}

export const START_SOURCE_LABELS: Record<StartSource, string> = {
  netWorth: "Net worth",
  investments: "Investments",
  cash: "Cash",
};

export const MAX_YEARS = 60;

export function defaultGrowthSettings(totals: AccountTotals): GrowthSettings {
  return {
    startSource: totals.investments > 0 ? "investments" : "netWorth",
    startOverride: null,
    monthlyContribution: 0,
    contributionIncrease: 0,
    annualReturn: 7,
    years: 10,
  };
}
