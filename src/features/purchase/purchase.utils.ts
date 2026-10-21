interface PurchaseTotalsItem {
  qtyPurchased?: string;
  costPerUnit?: string;
  sellPerUnit?: string;
}

export interface PurchaseTotals {
  subtotal: number;
  revenue: number;
  profit: number;
}

const toAmount = (value: string | undefined) => Math.max(0, Number(value) || 0);

export function calculatePurchaseTotals(
  items: readonly PurchaseTotalsItem[]
): PurchaseTotals {
  return items.reduce<PurchaseTotals>(
    (totals, item) => {
      const qty = toAmount(item.qtyPurchased);
      const cost = toAmount(item.costPerUnit);
      const sell = toAmount(item.sellPerUnit);

      totals.subtotal += qty * cost;
      totals.revenue += qty * sell;
      totals.profit += qty * (sell - cost);

      return totals;
    },
    { subtotal: 0, revenue: 0, profit: 0 }
  );
}

export function calculateMargin(revenue: number, profit: number) {
  return revenue > 0 ? Math.round((profit / revenue) * 100 * 10) / 10 : 0;
}

/**
 * Formats a monetary amount for a money input, rounded to two decimal places
 * so floating point noise (for example `3 * 0.1`) is not sent to the form.
 */
export function toMoneyInputValue(amount: number): string {
  return String(Math.round(amount * 100) / 100);
}
