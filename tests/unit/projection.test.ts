import { ProjectionInputs, averageMonthlyChange, projectGrowth, summarizeProjection } from "../../lib/utils/projection";

const base: ProjectionInputs = {
  start: 10000,
  monthlyContribution: 0,
  contributionIncrease: 0,
  annualReturn: 0,
  years: 1,
};

function finalBalance(inputs: ProjectionInputs): number {
  const points = projectGrowth(inputs);
  return points[points.length - 1].balance;
}

describe("projectGrowth", () => {
  it("returns one point for each month plus the starting point", () => {
    expect(projectGrowth({ ...base, years: 2 })).toHaveLength(25);
  });

  it("keeps the starting amount unchanged at a 0% return", () => {
    expect(finalBalance(base)).toBe(10000);
  });

  it("grows a lump sum by exactly the annual return after one year", () => {
    expect(finalBalance({ ...base, annualReturn: 7 })).toBeCloseTo(10700, 6);
  });

  it("compounds the annual return across years", () => {
    expect(finalBalance({ ...base, annualReturn: 7, years: 10 })).toBeCloseTo(10000 * Math.pow(1.07, 10), 4);
  });

  it("adds monthly contributions at the end of each month", () => {
    expect(finalBalance({ ...base, start: 0, monthlyContribution: 100, years: 2 })).toBe(2400);
  });

  it("matches the future value of an annuity for contributions with growth", () => {
    const r = Math.pow(1.06, 1 / 12) - 1;
    const expected = 500 * ((Math.pow(1 + r, 120) - 1) / r);
    expect(finalBalance({ ...base, start: 0, monthlyContribution: 500, annualReturn: 6, years: 10 })).toBeCloseTo(expected, 4);
  });

  it("raises the contribution once a year by the contribution increase", () => {
    const result = finalBalance({ ...base, start: 0, monthlyContribution: 100, contributionIncrease: 10, years: 2 });
    expect(result).toBeCloseTo(1200 + 1320, 6);
  });

  it("does not apply the return to a negative balance", () => {
    expect(finalBalance({ ...base, start: -5000, annualReturn: 7 })).toBe(-5000);
  });
});

describe("summarizeProjection", () => {
  it("splits the final balance into start, contributions and growth", () => {
    const inputs = { ...base, monthlyContribution: 100, annualReturn: 5, years: 3 };
    const summary = summarizeProjection(inputs.start, projectGrowth(inputs));
    expect(summary.contributed).toBe(3600);
    expect(summary.growth).toBeGreaterThan(0);
    expect(summary.finalBalance).toBeCloseTo(inputs.start + summary.contributed + summary.growth, 6);
  });
});

describe("averageMonthlyChange", () => {
  const now = new Date(2026, 9, 1).getTime();

  it("returns 0 with fewer than two points", () => {
    expect(averageMonthlyChange([{ date: "2026-01-01", value: 100 }], now)).toBe(0);
  });

  it("uses the last 12 months when they have two or more points", () => {
    const data = [
      { date: "2020-01-01", value: 0 },
      { date: "2025-10-01", value: 10000 },
      { date: "2026-10-01", value: 22000 },
    ];
    expect(averageMonthlyChange(data, now)).toBeCloseTo(1000, -1);
  });
});
