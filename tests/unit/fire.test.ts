import { coastFireNumber, fireNumber } from "../../lib/utils/fire";

describe("fireNumber", () => {
  it("is 25 times yearly spending at a 4% withdrawal rate", () => {
    expect(fireNumber(40000, 4)).toBe(1000000);
  });

  it("is 0 when the withdrawal rate is 0", () => {
    expect(fireNumber(40000, 0)).toBe(0);
  });
});

describe("coastFireNumber", () => {
  it("discounts the FIRE number by the expected return over the years left", () => {
    expect(coastFireNumber(1000000, 7, 0, 10)).toBeCloseTo(1000000 / Math.pow(1.07, 10), 4);
  });

  it("uses the real return after inflation", () => {
    expect(coastFireNumber(1000000, 7, 3, 10)).toBeCloseTo(1000000 * Math.pow(1.03 / 1.07, 10), 4);
  });

  it("equals the FIRE number when no years are left", () => {
    expect(coastFireNumber(1000000, 7, 3, -2)).toBe(1000000);
  });
});
