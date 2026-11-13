export function clamp(value: number, min = -Infinity, max = Infinity): number {
  return Math.min(Math.max(value, min), max);
}
