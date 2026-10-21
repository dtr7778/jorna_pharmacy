import { describe, expect, it } from "vitest";

import {
  calculateMargin,
  calculatePurchaseTotals,
  toMoneyInputValue,
} from "./purchase.utils";

describe("calculatePurchaseTotals", () => {
  it("sums subtotal, revenue, and profit across items", () => {
    const totals = calculatePurchaseTotals([
      { qtyPurchased: "10", costPerUnit: "5", sellPerUnit: "7" },
      { qtyPurchased: "2", costPerUnit: "1.5", sellPerUnit: "2.25" },
    ]);

    expect(totals).toEqual({ subtotal: 53, revenue: 74.5, profit: 21.5 });
  });

  it("returns zeros when there are no items", () => {
    expect(calculatePurchaseTotals([])).toEqual({
      subtotal: 0,
      revenue: 0,
      profit: 0,
    });
  });

  it("treats missing or invalid values as zero", () => {
    const totals = calculatePurchaseTotals([
      { qtyPurchased: "", costPerUnit: "abc", sellPerUnit: undefined },
    ]);

    expect(totals).toEqual({ subtotal: 0, revenue: 0, profit: 0 });
  });
});

describe("calculateMargin", () => {
  it("returns profit as a percentage of revenue rounded to one decimal", () => {
    expect(calculateMargin(3, 1)).toBe(33.3);
  });

  it("returns zero when revenue is zero", () => {
    expect(calculateMargin(0, -5)).toBe(0);
  });
});

describe("toMoneyInputValue", () => {
  it("rounds floating point noise to two decimal places", () => {
    expect(toMoneyInputValue(0.1 * 3)).toBe("0.3");
    expect(toMoneyInputValue(12.345)).toBe("12.35");
  });

  it("keeps whole amounts and short decimals unchanged", () => {
    expect(toMoneyInputValue(0)).toBe("0");
    expect(toMoneyInputValue(53)).toBe("53");
    expect(toMoneyInputValue(12.5)).toBe("12.5");
  });
});
