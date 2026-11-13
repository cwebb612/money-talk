import { DatedValue, dateToTimestamp } from "./monthWindow";
import { clamp } from "./math";

export interface ProjectionInputs {
  start: number;
  monthlyContribution: number;
  contributionIncrease: number;
  annualReturn: number;
  years: number;
}

export interface ProjectionPoint {
  month: number;
  balance: number;
  contributed: number;
}

export interface BalanceSplit {
  principal: number;
  contributions: number;
  growth: number;
}

const MS_PER_DAY = 86400000;
const DAYS_PER_YEAR = 365.25;

function monthlyRate(annualPercent: number): number {
  return Math.pow(1 + annualPercent / 100, 1 / 12) - 1;
}

export function projectGrowth(inputs: ProjectionInputs): ProjectionPoint[] {
  const growthRate = monthlyRate(inputs.annualReturn);
  const totalMonths = Math.round(inputs.years * 12);

  let balance = inputs.start;
  let contributed = 0;
  const points: ProjectionPoint[] = [{ month: 0, balance, contributed }];

  for (let month = 1; month <= totalMonths; month++) {
    if (balance > 0) balance *= 1 + growthRate;
    const yearIndex = Math.floor((month - 1) / 12);
    const contribution = inputs.monthlyContribution * Math.pow(1 + inputs.contributionIncrease / 100, yearIndex);
    balance += contribution;
    contributed += contribution;
    points.push({ month, balance, contributed });
  }

  return points;
}

export function splitBalance(point: ProjectionPoint, start: number): BalanceSplit {
  const principal = clamp(point.balance, 0, Math.max(start, 0));
  const contributions = clamp(point.balance - principal, 0, point.contributed);
  return { principal, contributions, growth: Math.max(0, point.balance - principal - contributions) };
}

export function averageMonthlyChange(sortedData: DatedValue[], now: number): number {
  if (sortedData.length < 2) return 0;
  const cutoff = now - DAYS_PER_YEAR * MS_PER_DAY;
  const recent = sortedData.filter((d) => dateToTimestamp(d.date) >= cutoff);
  const points = recent.length >= 2 ? recent : sortedData;
  const first = points[0];
  const last = points[points.length - 1];
  const days = (dateToTimestamp(last.date) - dateToTimestamp(first.date)) / MS_PER_DAY;
  if (days < 1) return 0;
  return Math.round(((last.value - first.value) / days) * (DAYS_PER_YEAR / 12));
}
