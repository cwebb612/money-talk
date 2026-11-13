import { clamp } from "../../lib/utils/math";

describe("clamp", () => {
  it("keeps a value inside the bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("leaves a side open when its bound is missing", () => {
    expect(clamp(-50, undefined, 10)).toBe(-50);
    expect(clamp(50, 0)).toBe(50);
  });
});
