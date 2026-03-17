import { calculateAccountValue, formatUSD } from "../../lib/utils/money";

describe("calculateAccountValue", () => {
  it("returns balance for cash accounts", () => {
    expect(calculateAccountValue({ type: "cash", balance: 1000, holdings: [] })).toBe(1000);
  });

  it("returns balance for liability accounts", () => {
    expect(calculateAccountValue({ type: "liability", balance: 5000, holdings: [] })).toBe(5000);
  });

  it("returns 0 when cash balance is undefined", () => {
    expect(calculateAccountValue({ type: "cash", balance: undefined, holdings: [] })).toBe(0);
  });

  it("sums holdings for investment accounts", () => {
    const result = calculateAccountValue({
      type: "investment",
      holdings: [
        { ticker: "AAPL", quantity: 10, pricePerUnit: 190 },
        { ticker: "GOOG", quantity: 5, pricePerUnit: 100 },
      ],
    });
    expect(result).toBe(2400);
  });

  it("returns 0 for investment account with empty holdings", () => {
    expect(calculateAccountValue({ type: "investment", holdings: [] })).toBe(0);
  });

  it("handles holdings with 0 quantity", () => {
    expect(
      calculateAccountValue({
        type: "investment",
        holdings: [{ ticker: "AAPL", quantity: 0, pricePerUnit: 190 }],
      })
    ).toBe(0);
  });

  it("handles holdings with 0 price", () => {
    expect(
      calculateAccountValue({
        type: "investment",
        holdings: [{ ticker: "AAPL", quantity: 10, pricePerUnit: 0 }],
      })
    ).toBe(0);
  });

  it("handles multiple holdings", () => {
    const result = calculateAccountValue({
      type: "investment",
      holdings: [
        { ticker: "BTC", quantity: 1, pricePerUnit: 50000 },
        { ticker: "ETH", quantity: 10, pricePerUnit: 3000 },
        { ticker: "SOL", quantity: 100, pricePerUnit: 150 },
      ],
    });
    expect(result).toBe(95000);
  });
});

describe("formatUSD", () => {
  it("formats whole dollars", () => {
    expect(formatUSD(1000)).toBe("$1,000.00");
  });

  it("formats with cents", () => {
    expect(formatUSD(1234.56)).toBe("$1,234.56");
  });

  it("formats zero", () => {
    expect(formatUSD(0)).toBe("$0.00");
  });

  it("formats large numbers with commas", () => {
    expect(formatUSD(1234567.89)).toBe("$1,234,567.89");
  });

  it("formats negative values", () => {
    expect(formatUSD(-500)).toBe("-$500.00");
  });
});
