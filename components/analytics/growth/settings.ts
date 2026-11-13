import { ProjectionInputs } from "../../../lib/utils/projection";

export type StartSource = "netWorth" | "investments" | "cash";

export interface StartingTotals {
  netWorth: number;
  investments: number;
  cash: number;
}

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

export function defaultGrowthSettings(totals: StartingTotals): GrowthSettings {
  return {
    startSource: totals.investments > 0 ? "investments" : "netWorth",
    startOverride: null,
    monthlyContribution: 0,
    contributionIncrease: 0,
    annualReturn: 7,
    years: 10,
  };
}

export function startingAmount(settings: GrowthSettings, totals: StartingTotals): number {
  return Math.round(settings.startOverride ?? totals[settings.startSource]);
}

export function growthInputs(settings: GrowthSettings, totals: StartingTotals): ProjectionInputs {
  return {
    start: startingAmount(settings, totals),
    monthlyContribution: settings.monthlyContribution,
    contributionIncrease: settings.contributionIncrease,
    annualReturn: settings.annualReturn,
    years: settings.years,
  };
}
