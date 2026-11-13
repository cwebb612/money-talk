"use client";

import { ReactNode } from "react";
import PillToggle from "../../ui/PillToggle";
import NumberField from "../../ui/NumberField";
import InfoTip from "../../ui/InfoTip";
import { GAIN_COLOR, LOSS_COLOR } from "../chartFormat";
import { formatWholeUSD } from "../../../lib/utils/money";
import { AccountTotals } from "../../../lib/utils/netWorth";
import { GrowthSettings, MAX_YEARS, START_SOURCE_LABELS } from "./settings";

const LOSING_VALUE = { label: "Losing value", color: LOSS_COLOR };

const RETURN_LEVELS = [
  { upTo: 0, label: "No growth", color: "var(--color-muted)" },
  { upTo: 2, label: "Very conservative", color: "var(--color-muted)" },
  { upTo: 4, label: "Conservative", color: "var(--color-text)" },
  { upTo: 6, label: "Moderate", color: "var(--color-text)" },
  { upTo: 8, label: "Historically typical", color: GAIN_COLOR },
  { upTo: 11, label: "Optimistic", color: "var(--color-yellow)" },
  { upTo: 14, label: "Aggressive", color: "var(--color-yellow)" },
  { upTo: Infinity, label: "Speculative", color: LOSS_COLOR },
];

const SOURCE_OPTIONS = [
  { value: "netWorth", label: START_SOURCE_LABELS.netWorth },
  { value: "investments", label: START_SOURCE_LABELS.investments },
  { value: "cash", label: START_SOURCE_LABELS.cash },
  { value: "custom", label: "Custom" },
] as const;

function describeReturn(rate: number) {
  if (rate < 0) return LOSING_VALUE;
  return RETURN_LEVELS.find((level) => rate <= level.upTo)!;
}

function LinkButton({ onClick, className, title, children }: {
  onClick: () => void;
  className: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} title={title} className={`text-xs underline ${className}`} style={{ color: "var(--color-yellow)" }}>
      {children}
    </button>
  );
}

interface Props {
  settings: GrowthSettings;
  start: number;
  totals: AccountTotals;
  averageMonthly: number;
  onChange: (patch: Partial<GrowthSettings>) => void;
}

export default function GrowthInputs({ settings, start, totals, averageMonthly, onChange }: Props) {
  const returnLevel = describeReturn(settings.annualReturn);
  const sourceValue = settings.startOverride === null ? settings.startSource : "custom";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <PillToggle
          ariaLabel="Starting amount source"
          value={sourceValue}
          options={[...SOURCE_OPTIONS]}
          onChange={(value) =>
            onChange(value === "custom" ? { startOverride: start } : { startSource: value, startOverride: null })
          }
        />
        <NumberField inline integer label="Starting amount" prefix="$" value={start} onChange={(value) => onChange({ startOverride: value })} />
        {settings.startOverride !== null && (
          <LinkButton className="self-end" onClick={() => onChange({ startOverride: null })}>
            Reset to actual {START_SOURCE_LABELS[settings.startSource].toLowerCase()} ({formatWholeUSD(totals[settings.startSource])})
          </LinkButton>
        )}
      </div>

      <NumberField
        inline
        integer
        label="Years"
        slider={{ min: 1, max: MAX_YEARS, step: 1 }}
        value={settings.years}
        onChange={(years) => onChange({ years })}
      />

      <div className="flex flex-col gap-2">
        <NumberField
          inline
          label="Annual return"
          suffix="%"
          min={-50}
          max={50}
          slider={{ min: 0, max: 20, step: 0.5 }}
          value={settings.annualReturn}
          onChange={(annualReturn) => onChange({ annualReturn })}
        />
        <span className="text-xs font-semibold" aria-live="polite" style={{ color: returnLevel.color }}>
          {returnLevel.label}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Monthly contribution"
            prefix="$"
            value={settings.monthlyContribution}
            onChange={(monthlyContribution) => onChange({ monthlyContribution })}
          />
          <NumberField
            label="Increase per year"
            info={
              <InfoTip label="About the yearly increase">
                <span className="block">
                  <strong>3%</strong> is typical. It is close to the average yearly pay raise.
                </span>
                <span className="block mt-1">
                  <strong>2–3%</strong> keeps pace with inflation.
                </span>
                <span className="block mt-1">
                  <strong>0%</strong> keeps the same dollar amount every year.
                </span>
              </InfoTip>
            }
            suffix="%"
            min={-100}
            max={100}
            value={settings.contributionIncrease}
            onChange={(contributionIncrease) => onChange({ contributionIncrease })}
          />
        </div>
        {averageMonthly > 0 && (
          <LinkButton
            className="self-start"
            title="Average net-worth change over the last 12 months. It includes market gains."
            onClick={() => onChange({ monthlyContribution: averageMonthly })}
          >
            Use my 12-month average: {formatWholeUSD(averageMonthly)}/mo
          </LinkButton>
        )}
      </div>
    </div>
  );
}
