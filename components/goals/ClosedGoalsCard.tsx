"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Card from "../ui/Card";
import Popconfirm from "../ui/Popconfirm";
import { deleteGoal, updateGoal } from "./goalApi";
import { formatTooltipDate } from "../analytics/chartFormat";
import { dateToTimestamp } from "../../lib/utils/monthWindow";
import { GoalDTO } from "../../lib/utils/goals";

interface Props {
  goals: GoalDTO[];
  onChanged: () => void;
}

export default function ClosedGoalsCard({ goals, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function run(action: () => Promise<unknown>) {
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      onChanged();
    }
  }

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
          Completed and archived ({goals.length})
        </h2>
        <span style={{ color: "var(--color-muted)" }}>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </button>

      {open && (
        <ul className="mt-3">
          {goals.map((goal) => (
            <li
              key={goal._id}
              className="flex items-center justify-between gap-3 py-3"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
                  {goal.title}
                </p>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {goal.status === "achieved" && goal.achievedAt
                    ? `Completed ${formatTooltipDate(dateToTimestamp(goal.achievedAt))}`
                    : "Archived"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => run(() => updateGoal(goal._id, { status: "active" }))}
                  className="text-xs font-medium"
                  style={{ color: "var(--color-yellow)" }}
                >
                  Reopen
                </button>
                <Popconfirm
                  title="Delete this goal?"
                  onConfirm={() => run(() => deleteGoal(goal._id))}
                >
                  <button type="button" className="text-xs font-medium" style={{ color: "var(--color-red)" }}>
                    Delete
                  </button>
                </Popconfirm>
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm mt-2" style={{ color: "var(--color-red)" }}>{error}</p>}
    </Card>
  );
}
