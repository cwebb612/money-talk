"use client";

import { GoalColor } from "../../lib/utils/goals";
import { GOAL_COLOR_OPTIONS } from "./goalTheme";

interface Props {
  value: GoalColor;
  onChange: (color: GoalColor) => void;
}

export default function GoalColorPicker({ value, onChange }: Props) {
  return (
    <div role="group" aria-label="Color" className="flex flex-wrap gap-1.5">
      {GOAL_COLOR_OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              border: `1px solid ${selected ? option.swatch : "var(--color-border)"}`,
              backgroundColor: selected ? "var(--color-border)" : "transparent",
              color: "var(--color-text)",
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: option.swatch }} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
