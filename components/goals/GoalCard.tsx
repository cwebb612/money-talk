"use client";

import { ReactNode, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, CircleCheck, LayoutDashboard, Pencil } from "lucide-react";
import Card from "../ui/Card";
import HoverHint from "../ui/HoverHint";
import GoalProgressBar from "./GoalProgressBar";
import GoalChart, { goalChartPoints } from "./GoalChart";
import { updateGoal } from "./goalApi";
import { goalTheme, themedCardStyle } from "./goalTheme";
import { GAIN_COLOR, LOSS_COLOR, formatMonthYear, formatTooltipDate } from "../analytics/chartFormat";
import { formatWholeUSD } from "../../lib/utils/money";
import { dateToTimestamp } from "../../lib/utils/monthWindow";
import {
  GoalAccount,
  GoalDTO,
  METRIC_LABELS,
  TARGET_MODE_LABELS,
  buildMetricSeries,
  formatGoalValue,
  goalProgress,
  isOnTrack,
  metricValue,
  projectCompletion,
  requiredMonthly,
} from "../../lib/utils/goals";

export interface ActivityPoint {
  accountId: string;
  date: string;
  value: number;
}

interface Props {
  goal: GoalDTO;
  accounts: GoalAccount[];
  activities: ActivityPoint[];
  accountTypes: Map<string, string>;
  today: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
  onChanged: () => void;
}

function formatDate(date: string): string {
  return formatTooltipDate(dateToTimestamp(date));
}

function IconButton({ label, hint, onClick, disabled, pressed, children }: {
  label: string;
  hint: string;
  onClick?: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: ReactNode;
}) {
  return (
    <HoverHint hint={hint}>
      {(describedBy) => (
        <button
          type="button"
          aria-label={label}
          aria-describedby={describedBy}
          aria-pressed={pressed}
          onClick={onClick}
          disabled={disabled}
          className="flex items-center justify-center rounded-lg w-8 h-8 transition-colors disabled:opacity-30"
          style={{
            color: pressed ? "var(--color-yellow)" : "var(--color-muted)",
            backgroundColor: pressed ? "var(--color-border)" : "transparent",
          }}
        >
          {children}
        </button>
      )}
    </HoverHint>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs" style={{ color: "var(--color-muted)" }}>
        {label}
      </dt>
      <dd className="text-sm font-semibold tabular-nums truncate" style={{ color: color ?? "var(--color-text)" }}>
        {value}
      </dd>
    </div>
  );
}

function modeSummary(goal: GoalDTO): string | null {
  switch (goal.targetMode) {
    case "fixed":
      return null;
    case "growing":
      return `Grows ${goal.targetGrowthRate}% a year`;
    case "contribution":
      return `${goal.direction === "increase" ? "Add" : "Pay down"} ${formatWholeUSD(goal.targetAmount)} since ${formatDate(goal.startDate)}`;
    default:
      return TARGET_MODE_LABELS[goal.targetMode];
  }
}

export default function GoalCard(props: Props) {
  const { goal, accounts, activities, accountTypes, today, canMoveUp, canMoveDown, onMove, onEdit, onChanged } = props;
  const [error, setError] = useState("");
  const theme = goalTheme(goal.template);

  const history = useMemo(() => buildMetricSeries(goal, activities, accountTypes), [goal, activities, accountTypes]);
  const chartData = useMemo(() => goalChartPoints(goal, history, today), [goal, history, today]);

  const current = metricValue(goal, accounts);
  const progress = goalProgress(goal, current, today);
  const projected = progress.reached ? null : projectCompletion(goal, history, current, today);
  const needed = progress.reached ? null : requiredMonthly(goal, current, today);
  const onTrack = isOnTrack(goal.targetDate, projected);
  const format = (value: number) => formatGoalValue(goal.metric, value);

  async function run(action: () => Promise<unknown>) {
    setError("");
    try {
      await action();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const meta = [METRIC_LABELS[goal.metric], modeSummary(goal)].filter(Boolean).join(" · ");

  return (
    <Card style={themedCardStyle(theme)}>
      <article id={`goal-${goal._id}`} aria-label={goal.title} className="flex flex-col gap-4" style={{ scrollMarginTop: 24 }}>
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {theme && <theme.Icon size={18} style={{ color: theme.color }} aria-label={theme.label} />}
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                {goal.title}
              </h2>
              {progress.reached && (
                <button
                  type="button"
                  onClick={() => run(() => updateGoal(goal._id, { status: "achieved" }))}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-black"
                  style={{ backgroundColor: GAIN_COLOR }}
                >
                  <CircleCheck size={12} />
                  Reached · Mark complete
                </button>
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
              {meta}
            </p>
          </div>
          <div className="flex items-center shrink-0">
            <IconButton
              label="Move up"
              hint={canMoveUp ? "Move up. Higher goals show first here and on the dashboard." : "This goal is already first."}
              onClick={() => onMove(-1)}
              disabled={!canMoveUp}
            >
              <ChevronUp size={16} />
            </IconButton>
            <IconButton
              label="Move down"
              hint={canMoveDown ? "Move down. Lower goals show later here and on the dashboard." : "This goal is already last."}
              onClick={() => onMove(1)}
              disabled={!canMoveDown}
            >
              <ChevronDown size={16} />
            </IconButton>
            <IconButton
              label="Show on dashboard"
              hint={goal.showOnDashboard ? "Shown on the dashboard. Click to hide it." : "Not on the dashboard. Click to show it."}
              pressed={goal.showOnDashboard}
              onClick={() => run(() => updateGoal(goal._id, { showOnDashboard: !goal.showOnDashboard }))}
            >
              <LayoutDashboard size={16} />
            </IconButton>
            <IconButton label="Edit goal" hint="Edit, complete, archive or delete this goal." onClick={onEdit}>
              <Pencil size={16} />
            </IconButton>
          </div>
        </header>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <p className="tabular-nums">
              <span className="text-2xl font-bold" style={{ color: theme?.color ?? "var(--color-yellow)" }}>
                {format(progress.current)}
              </span>
              <span className="text-sm" style={{ color: "var(--color-muted)" }}>
                {" "}of {format(progress.target)}
              </span>
            </p>
            <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--color-text)" }}>
              {Math.floor(progress.percent)}%
            </span>
          </div>
          <GoalProgressBar percent={progress.percent} label={`${goal.title} progress`} markers accent={theme?.color} />
        </div>

        <dl className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
          <Stat label="Left to go" value={format(progress.remaining)} />
          <Stat
            label="Projected finish"
            value={progress.reached ? "Reached" : projected ? formatMonthYear(dateToTimestamp(projected)) : "Not at this pace"}
            color={progress.reached ? GAIN_COLOR : undefined}
          />
          {goal.targetDate && (
            <Stat
              label={`Due ${formatDate(goal.targetDate)}`}
              value={progress.reached ? "Done" : onTrack ? "On track" : "Behind"}
              color={progress.reached || onTrack ? GAIN_COLOR : LOSS_COLOR}
            />
          )}
          {needed !== null && <Stat label="Needed per month" value={formatWholeUSD(needed)} color="var(--color-yellow)" />}
        </dl>

        <GoalChart data={chartData} metric={goal.metric} accent={theme?.color} />

        {goal.notes && (
          <p className="text-sm whitespace-pre-wrap break-words" style={{ color: "var(--color-muted)" }}>
            {goal.notes}
          </p>
        )}

        {error && <p className="text-sm" style={{ color: "var(--color-red)" }}>{error}</p>}
      </article>
    </Card>
  );
}
