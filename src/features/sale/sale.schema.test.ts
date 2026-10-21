import { describe, expect, test } from "vitest";

import { saleListFilterSchema } from "./sale.schema";

describe("saleListFilterSchema", () => {
  test("allows an empty filter", () => {
    expect(saleListFilterSchema.safeParse({}).success).toBe(true);
    expect(saleListFilterSchema.safeParse({ createdAt: {} }).success).toBe(
      true
    );
  });

  test("coerces ISO date strings into dates", () => {
    const result = saleListFilterSchema.safeParse({
      createdAt: {
        from: "2026-01-01T00:00:00.000Z",
        to: "2026-01-31T23:59:59.000Z",
      },
    });

    expect(result.success).toBe(true);

    if (!result.success) return;

    expect(result.data.createdAt?.from).toBeInstanceOf(Date);
    expect(result.data.createdAt?.to).toBeInstanceOf(Date);
  });

  test("rejects invalid date strings", () => {
    const result = saleListFilterSchema.safeParse({
      createdAt: { from: "not-a-date" },
    });

    expect(result.success).toBe(false);
  });
});
