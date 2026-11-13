export function fireNumber(annualSpending: number, withdrawalRate: number): number {
  if (withdrawalRate <= 0) return 0;
  return annualSpending / (withdrawalRate / 100);
}

export function coastFireNumber(
  fireTarget: number,
  expectedReturn: number,
  inflationRate: number,
  yearsToRetirement: number
): number {
  const realGrowth = (1 + inflationRate / 100) / (1 + expectedReturn / 100);
  return fireTarget * Math.pow(realGrowth, Math.max(0, yearsToRetirement));
}
