import { buildAssetLiabilitySeries } from "../../lib/utils/netWorth";

const accountTypes = new Map([
  ["checking", "cash"],
  ["brokerage", "investment"],
  ["mortgage", "liability"],
]);

describe("buildAssetLiabilitySeries", () => {
  it("sums assets and liabilities separately for each day", () => {
    const series = buildAssetLiabilitySeries(
      [
        { date: "2026-09-01", accountId: "checking", value: 1000 },
        { date: "2026-09-01", accountId: "brokerage", value: 5000 },
        { date: "2026-09-01", accountId: "mortgage", value: 3000 },
      ],
      accountTypes
    );
    expect(series).toEqual([{ date: "2026-09-01", assets: 6000, liabilities: 3000 }]);
  });

  it("carries account values forward to days without an update", () => {
    const series = buildAssetLiabilitySeries(
      [
        { date: "2026-09-01", accountId: "checking", value: 1000 },
        { date: "2026-09-01", accountId: "mortgage", value: 3000 },
        { date: "2026-10-01", accountId: "mortgage", value: 2800 },
      ],
      accountTypes
    );
    expect(series[1]).toEqual({ date: "2026-10-01", assets: 1000, liabilities: 2800 });
  });

  it("ignores activity for unknown accounts", () => {
    const series = buildAssetLiabilitySeries(
      [{ date: "2026-09-01", accountId: "deleted", value: 999 }],
      accountTypes
    );
    expect(series).toEqual([{ date: "2026-09-01", assets: 0, liabilities: 0 }]);
  });
});
