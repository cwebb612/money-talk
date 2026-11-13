import { Crown, Gem, LucideIcon } from "lucide-react";

export interface GoalTheme {
  label: string;
  color: string;
  Icon: LucideIcon;
}

const THEMES: Record<string, GoalTheme> = {
  millionaire: { label: "Millionaire", color: "var(--color-blue)", Icon: Gem },
  billionaire: { label: "Billionaire", color: "var(--color-red)", Icon: Crown },
};

export function goalTheme(template: string | null): GoalTheme | null {
  return template ? THEMES[template] ?? null : null;
}

export function themedCardStyle(theme: GoalTheme | null) {
  if (!theme) return undefined;
  return {
    border: `1px solid ${theme.color}`,
    boxShadow: `0 8px 32px -16px ${theme.color}`,
  };
}
