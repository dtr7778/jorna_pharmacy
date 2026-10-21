import { describe, expect, test } from "vitest";

import {
  customerPaymentCreateFormSchema,
  customerPaymentCreateSchema,
} from "./customer.schema";

describe("customerPaymentCreateSchema", () => {
  test("accepts a customer payment with an optional sale and note", () => {
    const customerId = "11111111-1111-4111-8111-111111111111";
    const saleId = "22222222-2222-4222-8222-222222222222";

    expect(
      customerPaymentCreateSchema.safeParse({ customerId, amount: 500 }).success
    ).toBe(true);
    expect(
      customerPaymentCreateSchema.safeParse({
        customerId,
        saleId,
        amount: 500,
        note: "Partial payment",
      }).success
    ).toBe(true);
  });

  test("normalizes an empty note to undefined", () => {
    const result = customerPaymentCreateSchema.safeParse({
      customerId: "11111111-1111-4111-8111-111111111111",
      amount: 500,
      note: "",
    });

    expect(result.success).toBe(true);

    if (!result.success) return;

    expect(result.data.note).toBeUndefined();
  });

  test("rejects non-positive, fractional, and missing amounts", () => {
    const customerId = "11111111-1111-4111-8111-111111111111";

    expect(
      customerPaymentCreateSchema.safeParse({ customerId, amount: 0 }).success
    ).toBe(false);
    expect(
      customerPaymentCreateSchema.safeParse({ customerId, amount: -1 }).success
    ).toBe(false);
    expect(
      customerPaymentCreateSchema.safeParse({ customerId, amount: 10.5 })
        .success
    ).toBe(false);
    expect(customerPaymentCreateSchema.safeParse({ customerId }).success).toBe(
      false
    );
  });
});

describe("customerPaymentCreateFormSchema", () => {
  test("accepts a whole-number amount typed as a string", () => {
    expect(
      customerPaymentCreateFormSchema.safeParse({
        customerId: "11111111-1111-4111-8111-111111111111",
        amount: "500",
        note: "",
      }).success
    ).toBe(true);
  });

  test("rejects empty, zero, and fractional amounts", () => {
    const customerId = "11111111-1111-4111-8111-111111111111";

    expect(
      customerPaymentCreateFormSchema.safeParse({ customerId, amount: "" })
        .success
    ).toBe(false);
    expect(
      customerPaymentCreateFormSchema.safeParse({ customerId, amount: "0" })
        .success
    ).toBe(false);
    expect(
      customerPaymentCreateFormSchema.safeParse({ customerId, amount: "10.5" })
        .success
    ).toBe(false);
  });
});
