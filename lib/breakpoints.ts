export const BREAKPOINTS = {
  tablet: 640,
  desktop: 1024,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export function minWidthQuery(breakpoint: Breakpoint): string {
  return `(min-width: ${BREAKPOINTS[breakpoint]}px)`;
}
