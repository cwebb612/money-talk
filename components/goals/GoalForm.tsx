"use client";

import { ReactNode, useId, useState } from "react";
import { Archive, CircleCheck, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import PillToggle from "../ui/PillToggle";
import NumberField from "../ui/NumberField";
import InfoTip from "../ui/InfoTip";
import Popconfirm from "../ui/Popconfirm";
import GoalColorPicker from "./GoalColorPicker";
import { todayString } from "../../lib/utils/filters";
import {
  DEFAULT_FIRE_INPUTS,
  EMERGENCY_FUND_MONTHS,
  FIRE_TYPES,
  FireInputs,
  GOAL_METRICS,
  GOAL_NOTES_MAX_LENGTH,
  GOAL_TITLE_MAX_LENGTH,
  GoalAccount,
  GoalFields,
  GoalMetric,
  METRIC_LABELS,
  PICKABLE_TARGET_MODES,
  TARGET_MODE_LABELS,
  TargetMode,
  formatGoalValue,
  goalDirection,
  isFireMode,
  isPercentMetric,
  targetAt,
  targetModeDescription,
} from "../../lib/utils/goals";

export interface GoalFormActions {
  onComplete?: () => Promise<void>;
  onArchive?: () => Promise<void>;
  onDelete?: () => Promise<void>;
}

interface Props extends GoalFormActions {
  initial: GoalFields;
  accounts: GoalAccount[];
  submitLabel: string;
  onSubmit: (fields: GoalFields) => Promise<void>;
  onCancel: () => void;
}

const mutedStyle = { color: "var(--color-muted)" };

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label htmlFor={htmlFor} className="text-xs" style={mutedStyle}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SecondaryButton({ onClick, disabled, danger, children }: {
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${danger ? "hover:bg-red-500/10" : ""}`}
      style={{
        border: `1px solid ${danger ? "var(--color-red)" : "var(--color-border)"}`,
        color: danger ? "var(--color-red)" : "var(--color-text)",
      }}
    >
      {children}
    </button>
  );
}

export default function GoalForm({ initial, accounts, submitLabel, onSubmit, onCancel, onComplete, onArchive, onDelete }: Props) {
  const [fields, setFields] = useState<GoalFields>(initial);
  const [monthlySpending, setMonthlySpending] = useState(() => Math.round(initial.targetAmount / EMERGENCY_FUND_MONTHS));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const titleId = useId();
  const metricId = useId();
  const dateId = useId();
  const startId = useId();
  const notesId = useId();

  const today = todayString();
  const direction = goalDirection(fields, accounts);
  const percent = isPercentMetric(fields.metric);
  const modes = PICKABLE_TARGET_MODES.filter((mode) => !(direction === "decrease" && isFireMode(mode)));
  const pickedMode = fields.targetMode === "coastFire" ? "fire" : fields.targetMode;
  const fire = fields.fireInputs ?? DEFAULT_FIRE_INPUTS;
  const isEmergencyFund = fields.template === "emergencyFund" && fields.targetMode === "fixed";
  const targetToday = targetAt({ ...fields, fireInputs: fire, startDate: today, direction, startValue: 0 }, today);

  function set(patch: Partial<GoalFields>) {
    setFields((f) => {
      const next = { ...f, ...patch };
      const decreasing = goalDirection(next, accounts) === "decrease";
      if (decreasing && isFireMode(next.targetMode)) return { ...next, targetMode: "fixed", fireInputs: null };
      if (isPercentMetric(next.metric) && next.targetMode !== "fixed") return { ...next, targetMode: "fixed", fireInputs: null };
      return next;
    });
  }

  function setFire(patch: Partial<FireInputs>) {
    set({ fireInputs: { ...fire, ...patch } });
  }

  function setMode(mode: TargetMode) {
    if (mode === pickedMode) return;
    set({ targetMode: mode, fireInputs: isFireMode(mode) ? fire : null, startDate: mode === "contribution" ? fields.startDate ?? today : null });
  }

  function toggleAccount(id: string) {
    set({ accountIds: fields.accountIds.includes(id) ? fields.accountIds.filter((a) => a !== id) : [...fields.accountIds, id] });
  }

  async function run(action: () => Promise<void>) {
    setError("");
    setSaving(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const canSave = fields.title.trim().length > 0 && (fields.metric !== "accounts" || fields.accountIds.length > 0) && !saving;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) run(() => onSubmit(fields));
      }}
      className="flex flex-col gap-5"
    >
      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
        <Field label="Title" htmlFor={titleId}>
          <Input
            id={titleId}
            value={fields.title}
            maxLength={GOAL_TITLE_MAX_LENGTH}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="e.g. Reach $100k net worth"
            autoFocus
          />
        </Field>
        <Field label="Track" htmlFor={metricId}>
          <Select
            id={metricId}
            value={fields.metric}
            onChange={(value) => set({ metric: value as GoalMetric })}
            options={GOAL_METRICS.map((m) => ({ value: m, label: METRIC_LABELS[m] }))}
          />
        </Field>
      </div>

      {fields.metric === "accounts" && (
        <fieldset className="flex flex-wrap gap-x-4 gap-y-2">
          <legend className="text-xs mb-1.5" style={mutedStyle}>
            Accounts
          </legend>
          {accounts.map((account) => (
            <label key={account._id} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text)" }}>
              <input
                type="checkbox"
                checked={fields.accountIds.includes(account._id)}
                onChange={() => toggleAccount(account._id)}
                style={{ accentColor: "var(--color-yellow)" }}
              />
              {account.name}
            </label>
          ))}
        </fieldset>
      )}

      <div className="flex flex-col gap-3">
        {!percent && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs" style={mutedStyle}>
                Target
              </span>
              <PillToggle
                ariaLabel="Target type"
                value={pickedMode}
                options={modes.map((m) => ({ value: m, label: TARGET_MODE_LABELS[m] }))}
                onChange={setMode}
              />
            </div>
            <p className="text-xs" style={mutedStyle}>
              {targetModeDescription(fields.targetMode, direction)}
            </p>
          </div>
        )}

        {isFireMode(fields.targetMode) && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs" style={mutedStyle}>
              FIRE type
              <InfoTip label="About FIRE types">
                Full FIRE: invest enough to live on your investments now. Coast FIRE: invest enough that growth alone gets you to FIRE by your retirement age.
              </InfoTip>
            </span>
            <PillToggle
              ariaLabel="FIRE type"
              value={fields.targetMode}
              options={[...FIRE_TYPES]}
              onChange={(mode) => set({ targetMode: mode })}
            />
          </div>
        )}

        <div className="grid grid-cols-2 tablet:grid-cols-3 gap-3">
          {isEmergencyFund && (
            <NumberField
              label="Monthly spending"
              prefix="$"
              value={monthlySpending}
              min={0}
              onChange={(value) => {
                setMonthlySpending(value);
                set({ targetAmount: value * EMERGENCY_FUND_MONTHS });
              }}
            />
          )}

          {!isEmergencyFund && !isFireMode(fields.targetMode) && (
            <NumberField
              label={fields.targetMode === "contribution" ? (direction === "decrease" ? "Amount to pay down" : "Amount to add") : "Target amount"}
              prefix={percent ? undefined : "$"}
              suffix={percent ? "%" : undefined}
              value={fields.targetAmount}
              onChange={(value) => set({ targetAmount: value })}
              info={
                fields.targetMode === "contribution" ? (
                  <InfoTip label="About amount to add">Counts every change in value since the start date, including market growth.</InfoTip>
                ) : undefined
              }
            />
          )}

          {fields.targetMode === "contribution" && (
            <Field label="Start date" htmlFor={startId}>
              <Input
                id={startId}
                type="date"
                value={fields.startDate ?? today}
                max={today}
                onChange={(e) => set({ startDate: e.target.value || today })}
                className="h-9 py-0"
              />
            </Field>
          )}

          {fields.targetMode === "growing" && (
            <NumberField label="Yearly growth" suffix="%" value={fields.targetGrowthRate} min={0} max={100} onChange={(v) => set({ targetGrowthRate: v })} />
          )}

          {isFireMode(fields.targetMode) && (
            <>
              <NumberField label="Annual spending" prefix="$" value={fire.annualSpending} min={0} onChange={(v) => setFire({ annualSpending: v })} />
              <NumberField
                label="Withdrawal rate"
                suffix="%"
                value={fire.withdrawalRate}
                min={0.1}
                max={100}
                onChange={(v) => setFire({ withdrawalRate: v })}
                info={<InfoTip label="About the withdrawal rate">The percent you take out each year. 4% is the common rule.</InfoTip>}
              />
              <NumberField label="Inflation" suffix="%" value={fields.targetGrowthRate} min={0} max={100} onChange={(v) => set({ targetGrowthRate: v })} />
            </>
          )}

          {fields.targetMode === "coastFire" && (
            <>
              <NumberField label="Expected return" suffix="%" value={fire.expectedReturn} min={0} max={100} onChange={(v) => setFire({ expectedReturn: v })} />
              <NumberField label="Current age" value={fire.currentAge} integer min={0} max={120} onChange={(v) => setFire({ currentAge: v })} />
              <NumberField label="Retirement age" value={fire.retirementAge} integer min={0} max={120} onChange={(v) => setFire({ retirementAge: v })} />
            </>
          )}
        </div>

        {(isEmergencyFund || fields.targetMode === "growing" || isFireMode(fields.targetMode)) && (
          <p className="text-xs" style={mutedStyle}>
            Target today: <span style={{ color: "var(--color-text)" }}>{formatGoalValue(fields.metric, targetToday)}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
        <Field label="Target date (optional)" htmlFor={dateId}>
          <Input
            id={dateId}
            type="date"
            value={fields.targetDate ?? ""}
            min={today}
            onChange={(e) => set({ targetDate: e.target.value || null })}
          />
        </Field>
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-xs" style={mutedStyle}>
            Color
          </span>
          <GoalColorPicker value={fields.color} onChange={(color) => set({ color })} />
        </div>
      </div>

      <Field label="Notes" htmlFor={notesId}>
        <textarea
          id={notesId}
          value={fields.notes}
          maxLength={GOAL_NOTES_MAX_LENGTH}
          onChange={(e) => set({ notes: e.target.value })}
          rows={2}
          className="outline-none border border-[var(--color-border)] focus:border-[var(--color-blue)] transition-colors"
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            backgroundColor: "var(--color-bg)",
            color: "var(--color-text)",
            fontSize: "0.875rem",
            resize: "vertical",
          }}
        />
      </Field>

      {error && <p className="text-sm" style={{ color: "var(--color-red)" }}>{error}</p>}

      <div className="flex items-center gap-2 flex-wrap">
        <Button type="submit" disabled={!canSave} className="py-1.5">
          {saving ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="py-1.5">
          Cancel
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {onComplete && (
            <SecondaryButton onClick={() => run(onComplete)} disabled={saving}>
              <CircleCheck size={14} />
              Mark complete
            </SecondaryButton>
          )}
          {onArchive && (
            <SecondaryButton onClick={() => run(onArchive)} disabled={saving}>
              <Archive size={14} />
              Archive
            </SecondaryButton>
          )}
          {onDelete && (
            <Popconfirm title="Delete this goal?" onConfirm={() => run(onDelete)}>
              <SecondaryButton danger>
                <Trash2 size={14} />
                Delete
              </SecondaryButton>
            </Popconfirm>
          )}
        </div>
      </div>
    </form>
  );
}
