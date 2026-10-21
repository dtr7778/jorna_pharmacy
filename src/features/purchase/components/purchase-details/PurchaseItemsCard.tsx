import { FormatDateCell } from "@/components/FormatDateCell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VendorPurchaseDetailsContractType } from "@/features/purchase/api/purchase.contract";
import { formatCurrency } from "@/utils/formatCurrency";

type PurchaseDetails = VendorPurchaseDetailsContractType["output"]["data"];
type PurchaseItem = PurchaseDetails["items"][number];

export function PurchaseItemsCard({ purchase }: { purchase: PurchaseDetails }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Line items</CardTitle>
        <CardDescription>
          Medicines received against this purchase
        </CardDescription>
      </CardHeader>
      <CardContent>
        {purchase.items.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            No line items recorded for this purchase.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-right">Cost / unit</TableHead>
                <TableHead className="text-right">Line total</TableHead>
                <TableHead>Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchase.items.map((item) => (
                <PurchaseItemRow key={item.id} item={item} />
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="text-right">
                  Subtotal
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(purchase.subtotal)}
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow>
                <TableCell colSpan={5} className="text-right">
                  Discount
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(purchase.discount)}
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow>
                <TableCell colSpan={5} className="text-right font-semibold">
                  Total
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(purchase.totalAmount)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function PurchaseItemRow({ item }: { item: PurchaseItem }) {
  const lineTotal = item.qtyPurchased * item.costPerUnit;
  const isLowStock = item.qtyRemaining === 0;

  return (
    <TableRow>
      <TableCell className="whitespace-normal">
        <div className="flex min-w-0 flex-col">
          <span className="font-medium">{item.medicineName}</span>
          <span className="text-xs text-muted-foreground">
            {[item.genericName, item.strength].filter(Boolean).join(" · ") ||
              item.baseUnit}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        <span className="font-medium">{item.qtyPurchased}</span>
        <span className="ml-1 text-xs text-muted-foreground">
          {item.baseUnit}
        </span>
        {item.tabletsPerStrip && item.stripsPerBox ? (
          <div className="text-xs text-muted-foreground">
            {item.tabletsPerStrip}/strip · {item.stripsPerBox}/box
          </div>
        ) : null}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        <span className={isLowStock ? "text-muted-foreground" : undefined}>
          {item.qtyRemaining}
        </span>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCurrency(item.costPerUnit)}
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatCurrency(lineTotal)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {item.expiryDate ? (
          <FormatDateCell format="dd MMM, yyyy" value={item.expiryDate} />
        ) : (
          "—"
        )}
      </TableCell>
    </TableRow>
  );
}
