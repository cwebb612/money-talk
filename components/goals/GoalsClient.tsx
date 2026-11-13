"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";
import Card from "../ui/Card";
import Modal from "../ui/Modal";
import GoalCard, { ActivityPoint } from "./GoalCard";
import GoalForm from "./GoalForm";
import SuggestionsDrawer from "./SuggestionsDrawer";
import ClosedGoalsCard from "./ClosedGoalsCard";
import { createGoal, deleteGoal, reorderGoals, updateGoal } from "./goalApi";
import { GoalAccount, GoalDTO, GoalFields, buildMetricSeries, emptyGoalFields, goalFieldsOf, suggestGoals } from "../../lib/utils/goals";

interface Props {
  goals: GoalDTO[];
  accounts: GoalAccount[];
  activities: ActivityPoint[];
  today: string;
}

type FormState = { mode: "closed" } | { mode: "create"; initial: GoalFields; key: string } | { mode: "edit"; goal: GoalDTO };

export default function GoalsClient({ goals, accounts, activities, today }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ mode: "closed" });
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const active = goals.filter((g) => g.status === "active");
  const closed = goals.filter((g) => g.status !== "active");
  const accountTypes = useMemo(() => new Map(accounts.map((a) => [a._id, a.type])), [accounts]);
  const suggestions = useMemo(() => {
    const netWorthHistory = buildMetricSeries({ metric: "netWorth", accountIds: [] }, activities, accountTypes);
    return suggestGoals(accounts, goals, netWorthHistory, today);
  }, [accounts, goals, activities, accountTypes, today]);

  function refresh() {
    router.refresh();
  }

  function closeForm() {
    setForm({ mode: "closed" });
  }

  async function move(index: number, direction: -1 | 1) {
    const ids = active.map((g) => g._id);
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    await reorderGoals(ids);
    refresh();
  }

  async function closeAfter(action: () => Promise<unknown>) {
    await action();
    closeForm();
    refresh();
  }

  async function save(fields: GoalFields) {
    if (form.mode === "edit") await updateGoal(form.goal._id, fields);
    else await createGoal(fields);
    closeForm();
    refresh();
  }

  return (
    <div className="max-w-2xl desktop:max-w-5xl mx-auto px-4 desktop:px-8 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm" style={{ color: "var(--color-muted)" }}>
          ← Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
          Goals
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSuggestionsOpen(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-lg font-medium"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text)" }}
          >
            <Lightbulb size={14} />
            Suggestions
          </button>
          <button
            type="button"
            onClick={() => setForm({ mode: "create", initial: emptyGoalFields(), key: "new" })}
            className="text-sm px-3 py-1 rounded-lg font-medium text-black"
            style={{ backgroundColor: "var(--color-yellow)" }}
          >
            + New Goal
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {active.length === 0 && (
          <Card>
            <p className="text-sm text-center py-6" style={{ color: "var(--color-muted)" }}>
              No active goals. Add a goal, or open Suggestions for a ready-made one.
            </p>
          </Card>
        )}

        {active.map((goal, index) => (
          <GoalCard
            key={goal._id}
            goal={goal}
            accounts={accounts}
            activities={activities}
            accountTypes={accountTypes}
            today={today}
            canMoveUp={index > 0}
            canMoveDown={index < active.length - 1}
            onMove={(direction) => move(index, direction)}
            onEdit={() => setForm({ mode: "edit", goal })}
            onChanged={refresh}
          />
        ))}

        {closed.length > 0 && <ClosedGoalsCard goals={closed} onChanged={refresh} />}
      </div>

      <SuggestionsDrawer
        open={suggestionsOpen}
        suggestions={suggestions}
        onClose={() => setSuggestionsOpen(false)}
        onPick={(suggestion) => {
          setSuggestionsOpen(false);
          setForm({ mode: "create", initial: suggestion.draft, key: suggestion.key });
        }}
      />

      <Modal open={form.mode !== "closed"} onClose={closeForm} title={form.mode === "edit" ? "Edit goal" : "New goal"}>
        {form.mode !== "closed" && (
          <GoalForm
            key={form.mode === "edit" ? form.goal._id : form.key}
            initial={form.mode === "edit" ? goalFieldsOf(form.goal) : form.initial}
            accounts={accounts}
            submitLabel={form.mode === "edit" ? "Save Changes" : "Add Goal"}
            onSubmit={save}
            onCancel={closeForm}
            onComplete={form.mode === "edit" ? () => closeAfter(() => updateGoal(form.goal._id, { status: "achieved" })) : undefined}
            onArchive={form.mode === "edit" ? () => closeAfter(() => updateGoal(form.goal._id, { status: "archived" })) : undefined}
            onDelete={form.mode === "edit" ? () => closeAfter(() => deleteGoal(form.goal._id)) : undefined}
          />
        )}
      </Modal>
    </div>
  );
}
