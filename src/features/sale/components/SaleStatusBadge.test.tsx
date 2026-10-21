import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { SaleStatusBadge } from "./SaleStatusBadge";

describe("SaleStatusBadge", () => {
  test("shows Paid when nothing is due", () => {
    render(<SaleStatusBadge due={0} paidAmount={0} />);

    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  test("shows Partially paid when some money was paid", () => {
    render(<SaleStatusBadge due={40} paidAmount={60} />);

    expect(screen.getByText("Partially paid")).toBeInTheDocument();
  });

  test("shows Unpaid when nothing was paid", () => {
    render(<SaleStatusBadge due={100} paidAmount={0} />);

    expect(screen.getByText("Unpaid")).toBeInTheDocument();
  });
});
