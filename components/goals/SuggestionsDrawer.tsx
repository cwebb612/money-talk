"use client";

import Drawer from "../ui/Drawer";
import { goalAccent, goalBadge } from "./goalTheme";
import { GoalSuggestion, SUGGESTION_GROUPS } from "../../lib/utils/goals";

interface Props {
  open: boolean;
  suggestions: GoalSuggestion[];
  onClose: () => void;
  onPick: (suggestion: GoalSuggestion) => void;
}

export default function SuggestionsDrawer({ open, suggestions, onClose, onPick }: Props) {
  const groups = SUGGESTION_GROUPS.map((group) => ({ group, items: suggestions.filter((s) => s.group === group) })).filter(
    (g) => g.items.length > 0
  );

  return (
    <Drawer open={open} onClose={onClose} title="Suggested goals">
      {groups.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          You already use every suggested goal.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(({ group, items }) => (
            <section key={group} aria-label={group}>
              <h4 className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-muted)" }}>
                {group}
              </h4>
              <ul>
                {items.map((suggestion) => {
                  const accent = goalAccent(suggestion.draft.color);
                  const badge = goalBadge(suggestion.key);
                  return (
                    <li
                      key={suggestion.key}
                      className="flex items-center justify-between gap-3 py-2.5"
                      style={{ borderBottom: "1px solid var(--color-border)" }}
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-medium" style={{ color: accent ?? "var(--color-text)" }}>
                          {badge && <badge.Icon size={14} />}
                          {suggestion.title}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                          {suggestion.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onPick(suggestion)}
                        aria-label={`Use ${suggestion.title}`}
                        className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg text-black"
                        style={{ backgroundColor: accent ?? "var(--color-yellow)" }}
                      >
                        Add
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Drawer>
  );
}
