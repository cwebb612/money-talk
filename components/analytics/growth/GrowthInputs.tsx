"use client";

import PillToggle from "../../ui/PillToggle";
import NumberField from "./NumberField";
import InfoTip from "./InfoTip";
import { GAIN_COLOR, LOSS_COLOR, formatWholeUSD } from "../chartFormat";
import { GrowthSettings, MAX_YEARS, START_SOURCE_LABELS, StartSource, StartingTotals, startingAmount } from "./settings";

const RETURN_LEVELS = [
  { upTo: -0.01, label: "Losing value", color: LOSS_COLOR },
  { upTo: 0, label: "No growth", color: "var(--color-muted)" },
  { upTo: 2, label: "Very conservative", color: "var(--color-muted)" },
  { upTo: 4, label: "Conservative", color: "var(--color-text)" },
  { upTo: 6, label: "Moderate", color: "var(--color-text)" },
  { upTo: 8, label: "Historically typical", color: GAIN_COLOR },
  { upTo: 11, label: "Optimistic", color: "var(--color-yellow)" },
  { upTo: 14, label: "Aggressive", color: "var(--color-yellow)" },
  { upTo: Infinity, label: "Speculative", color: LOSS_COLOR },
];

function describeReturn(rate: number) {
  return RETURN_LEVELS.find((level) => rate <= level.upTo) ?? RETURN_LEVELS[RETURN_LEVELS.length - 1];
}

const SOURCE_OPTIONS = [
  ...(Object.keys(START_SOURCE_LABELS) as StartSource[]).map((value) => ({ value, label: START_SOURCE_LABELS[value] })),
  { value: "custom" as const, label: "Custom" },
];

interface Props {
  settings: GrowthSettings;
  totals: StartingTotals;
  averageMonthly: number;
  onChange: (patch: Partial<GrowthSettings>) => void;
}

export default function GrowthInputs({ settings, totals, averageMonthly, onChange }: Props) {
  const start = startingAmount(settings, totals);
  const returnLevel = describeReturn(settings.annualReturn);
  const sourceValue = settings.startOverride === null ? settings.startSource : "custom";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <PillToggle
          ariaLabel="Starting amount source"
          value={sourceValue}
          options={SOURCE_OPTIONS}
          onChange={(value) =>
            onChange(value === "custom" ? { startOverride: start } : { startSource: value, startOverride: null })
          }
        />
        <NumberField inline integer label="Starting amount" prefix="$" value={start} onChange={(value) => onChange({ startOverride: value })} />
        {settings.startOverride !== null && (
          <button
            type="button"
            onClick={() => onChange({ startOverride: null })}
            className="self-end text-xs underline"
            style={{ color: "var(--color-yellow)" }}
          >
            Reset to actual {START_SOURCE_LABELS[settings.startSource].toLowerCase()} ({formatWholeUSD(totals[settings.startSource])})
          </button>
        )}
      </div>

      <NumberField
        inline
        label="Years"
        integer
        min={1}
        max={MAX_YEARS}
        slider={{ min: 1, max: MAX_YEARS, step: 1 }}
        value={settings.years}
        onChange={(value) => onChange({ years: value })}
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
          onChange={(value) => onChange({ annualReturn: value })}
        />
        <div className="text-xs" aria-live="polite">
          <span className="font-semibold" style={{ color: returnLevel.color }}>{returnLevel.label}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Monthly contribution"
            prefix="$"
            value={settings.monthlyContribution}
            onChange={(value) => onChange({ monthlyContribution: value })}
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
            onChange={(value) => onChange({ contributionIncrease: value })}
          />
        </div>
        {averageMonthly > 0 && (
          <button
            type="button"
            onClick={() => onChange({ monthlyContribution: averageMonthly })}
            className="self-start text-xs underline"
            style={{ color: "var(--color-yellow)" }}
            title="Average net-worth change over the last 12 months. It includes market gains."
          >
            Use my 12-month average: {formatWholeUSD(averageMonthly)}/mo
          </button>
        )}
      </div>
    </div>
  );
}
