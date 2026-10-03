import { buildMonthlyChanges, summarizeMonthlyChanges } from "../../lib/utils/monthlyChange";
import { dateToTimestamp } from "../../lib/utils/monthWindow";

const OCT_15 = new Date(2026, 9, 15).getTime();

const data = [
  { date: "2026-06-03", value: 1000 },
  { date: "2026-07-02", value: 1200 },
  { date: "2026-08-04", value: 1100 },
  { date: "2026-09-01", value: 1500 },
  { date: "2026-10-05", value: 1700 },
];

describe("buildMonthlyChanges", () => {
  it("measures each month from the previous month's last value", () => {
    expect(buildMonthlyChanges(data, dateToTimestamp("2026-07-01"), OCT_15)).toEqual([
      { month: "2026-07", change: 200 },
      { month: "2026-08", change: -100 },
      { month: "2026-09", change: 400 },
      { month: "2026-10", change: 200 },
    ]);
  });

  it("skips months with no earlier value to compare against", () => {
    const changes = buildMonthlyChanges(data, dateToTimestamp("2026-06-01"), OCT_15);
    expect(changes[0].month).toBe("2026-07");
  });

  it("shows a zero change for a month without an update", () => {
    const withGap = data.filter((d) => d.date !== "2026-08-04");
    const changes = buildMonthlyChanges(withGap, dateToTimestamp("2026-08-01"), OCT_15);
    expect(changes[0]).toEqual({ month: "2026-08", change: 0 });
  });

  it("leaves out the current month until it has an update", () => {
    const beforeOctoberUpdate = data.filter((d) => d.date !== "2026-10-05");
    const changes = buildMonthlyChanges(beforeOctoberUpdate, dateToTimestamp("2026-09-01"), OCT_15);
    expect(changes.map((c) => c.month)).toEqual(["2026-09"]);
  });
});

describe("summarizeMonthlyChanges", () => {
  it("returns null without changes", () => {
    expect(summarizeMonthlyChanges([])).toBeNull();
  });

  it("computes the average, best month, and current growth streak", () => {
    expect(
      summarizeMonthlyChanges([
        { month: "2026-07", change: 200 },
        { month: "2026-08", change: -100 },
        { month: "2026-09", change: 400 },
        { month: "2026-10", change: 200 },
      ])
    ).toEqual({
      averageChange: 175,
      bestMonth: { month: "2026-09", change: 400 },
      growthStreak: 2,
    });
  });

  it("has no best month when every month lost value", () => {
    const summary = summarizeMonthlyChanges([{ month: "2026-09", change: -50 }]);
    expect(summary?.bestMonth).toBeNull();
    expect(summary?.growthStreak).toBe(0);
  });
});
