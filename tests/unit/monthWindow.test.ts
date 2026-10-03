import {
  getWindowStart,
  sliceWindow,
  monthTicks,
  dateToTimestamp,
  timestampToDate,
} from "../../lib/utils/monthWindow";

const OCT_15 = new Date(2026, 9, 15, 14, 30).getTime();

function startDate(preset: Parameters<typeof getWindowStart>[0], firstDate: string | null = null) {
  const ts = getWindowStart(preset, OCT_15, firstDate);
  return ts === null ? null : timestampToDate(ts);
}

describe("getWindowStart", () => {
  it("starts 1M on the 1st of last month", () => {
    expect(startDate("1M")).toBe("2026-09-01");
  });

  it("starts 6M on the 1st of the month six months back", () => {
    expect(startDate("6M")).toBe("2026-04-01");
  });

  it("starts 1Y on the 1st of the same month last year", () => {
    expect(startDate("1Y")).toBe("2025-10-01");
  });

  it("starts YTD on January 1st", () => {
    expect(startDate("YTD")).toBe("2026-01-01");
  });

  it("starts All on the 1st of the month of the first data point", () => {
    expect(startDate("All", "2020-03-17")).toBe("2020-03-01");
  });

  it("returns null for All without data", () => {
    expect(startDate("All", null)).toBeNull();
  });

  it("crosses the year boundary for 1M in January", () => {
    const jan10 = new Date(2026, 0, 10).getTime();
    expect(timestampToDate(getWindowStart("1M", jan10, null)!)).toBe("2025-12-01");
  });
});

describe("sliceWindow", () => {
  const data = [
    { date: "2026-08-20", value: 100 },
    { date: "2026-09-05", value: 120 },
    { date: "2026-10-05", value: 150 },
  ];

  it("carries the last value before the window forward to the 1st", () => {
    expect(sliceWindow(data, dateToTimestamp("2026-09-01"))).toEqual([
      { date: "2026-09-01", value: 100 },
      { date: "2026-09-05", value: 120 },
      { date: "2026-10-05", value: 150 },
    ]);
  });

  it("does not add a carried point when an update falls on the 1st", () => {
    const onTheFirst = [{ date: "2026-08-20", value: 100 }, { date: "2026-09-01", value: 110 }];
    expect(sliceWindow(onTheFirst, dateToTimestamp("2026-09-01"))).toEqual([
      { date: "2026-09-01", value: 110 },
    ]);
  });

  it("does not add a carried point when there is no earlier data", () => {
    expect(sliceWindow(data, dateToTimestamp("2026-08-01"))).toEqual(data);
  });

  it("returns all data when the window has no start", () => {
    expect(sliceWindow(data, null)).toEqual(data);
  });
});

describe("monthTicks", () => {
  it("puts a tick on every 1st for short windows", () => {
    const ticks = monthTicks(dateToTimestamp("2026-09-01"), OCT_15).map(timestampToDate);
    expect(ticks).toEqual(["2026-09-01", "2026-10-01"]);
  });

  it("skips months so long windows have at most 8 ticks", () => {
    const ticks = monthTicks(dateToTimestamp("2020-01-01"), OCT_15).map(timestampToDate);
    expect(ticks.length).toBeLessThanOrEqual(8);
    expect(ticks.every((t) => t.endsWith("-01-01"))).toBe(true);
  });
});
