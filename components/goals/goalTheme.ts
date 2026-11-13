import { Crown, Gem, LucideIcon } from "lucide-react";
import { GoalColor } from "../../lib/utils/goals";

export interface GoalBadge {
  label: string;
  Icon: LucideIcon;
}

export const GOAL_COLOR_OPTIONS: { value: GoalColor; label: string; swatch: string }[] = [
  { value: "default", label: "Default", swatch: "var(--color-yellow)" },
  { value: "red", label: "Red", swatch: "var(--color-red)" },
  { value: "blue", label: "Blue", swatch: "var(--color-blue)" },
  { value: "green", label: "Green", swatch: "var(--color-green)" },
  { value: "pink", label: "Pink", swatch: "var(--color-pink)" },
];

const BADGES: Record<string, GoalBadge> = {
  millionaire: { label: "Millionaire", Icon: Gem },
  billionaire: { label: "Billionaire", Icon: Crown },
};

export function goalAccent(color: GoalColor): string | null {
  if (color === "default") return null;
  return GOAL_COLOR_OPTIONS.find((option) => option.value === color)?.swatch ?? null;
}

export function goalBadge(template: string | null): GoalBadge | null {
  return template ? BADGES[template] ?? null : null;
}

export function themedCardStyle(accent: string | null) {
  if (!accent) return undefined;
  return {
    border: `1px solid ${accent}`,
    boxShadow: `0 8px 32px -16px ${accent}`,
  };
}
