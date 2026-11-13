import Link from "next/link";
import GoalProgressBar from "../goals/GoalProgressBar";
import { GAIN_COLOR } from "../analytics/chartFormat";
import { goalTheme, themedCardStyle } from "../goals/goalTheme";
import { GoalAccount, GoalDTO, formatGoalValue, goalProgress, metricValue } from "../../lib/utils/goals";

interface Props {
  goals: GoalDTO[];
  accounts: GoalAccount[];
  today: string;
}

export default function GoalsSummaryCard({ goals, accounts, today }: Props) {
  return (
    <section aria-label="Goals">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
          Goals
        </h2>
        <Link href="/goals" className="text-sm font-medium pr-4" style={{ color: "var(--color-yellow)" }}>
          View all goals →
        </Link>
      </div>
      <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-2">
        {goals.map((goal) => {
          const progress = goalProgress(goal, metricValue(goal, accounts), today);
          const theme = goalTheme(goal.template);
          return (
            <Link
              key={goal._id}
              href={`/goals#goal-${goal._id}`}
              className="rounded-xl p-4 flex flex-col gap-2"
              style={{ backgroundColor: "var(--color-card)", ...themedCardStyle(theme) }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex items-center gap-1.5 text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
                  {theme && <theme.Icon size={14} className="shrink-0" style={{ color: theme.color }} />}
                  {goal.title}
                </span>
                <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: "var(--color-text)" }}>
                  {Math.floor(progress.percent)}%
                </span>
              </div>
              <GoalProgressBar percent={progress.percent} label={`${goal.title} progress`} height={6} accent={theme?.color} />
              <span className="text-xs tabular-nums" style={{ color: progress.reached ? GAIN_COLOR : "var(--color-muted)" }}>
                {progress.reached ? "Reached" : `${formatGoalValue(goal.metric, progress.remaining)} to go`}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
