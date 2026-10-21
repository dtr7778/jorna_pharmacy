import { useCallback, useEffect, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useForm, useWatch, type Path } from "react-hook-form";

import { InputField } from "@/components/form-fields/InputField";
import { TextareaField } from "@/components/form-fields/TextareaField";
import { QueryStateBoundary } from "@/components/tanstack-query/query-state-boundary";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import {
  useCreatePurchase,
  useNextPurchaseInvoiceNo,
} from "@/features/purchase/api/purchase.api.hook";
import {
  emptyPurchaseItemFormValues,
  purchaseCreateFormSchema,
  type PurchaseCreateFormInputType,
  type PurchaseCreateFormType,
} from "@/features/purchase/purchase.schema";
import {
  calculateMargin,
  calculatePurchaseTotals,
  toMoneyInputValue,
} from "@/features/purchase/purchase.utils";
import { VendorSelectorField } from "@/features/vendors/components/VendorSelectorField";

import { PurchaseLine } from "./PurchaseLine";
import { PurchaseSummaryCard } from "./PurchaseSummaryCard";

const FORM_ID = "purchase_create_form";

export function PurchaseCreateForm() {
  const nextInvoiceNo = useNextPurchaseInvoiceNo();

  return (
    <QueryStateBoundary
      isLoading={nextInvoiceNo.isLoading}
      isError={nextInvoiceNo.isError}
      error={nextInvoiceNo.error}
      data={nextInvoiceNo.data?.data}
      isEmpty={() => false}
    >
      {(data) => (
        <PurchaseCreateFormContent
          invoiceId={data.invoiceId}
          invoiceNo={data.invoiceNo}
        />
      )}
    </QueryStateBoundary>
  );
}

function PurchaseCreateFormContent({
  invoiceId,
  invoiceNo,
}: {
  invoiceId: string;
  invoiceNo: string;
}) {
  "use no memo";

  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const form = useForm<
    PurchaseCreateFormInputType,
    unknown,
    PurchaseCreateFormType
  >({
    resolver: zodResolver(purchaseCreateFormSchema),
    mode: "onBlur",
    shouldFocusError: false,
    defaultValues: {
      invoiceId,
      invoiceNo,
      paidAmount: "0",
      paidInFull: false,
      note: "",
      items: [emptyPurchaseItemFormValues],
    },
  });

  const watchedItems = useWatch({ control: form.control, name: "items" });

  const watchedPaidAmount = useWatch({
    control: form.control,
    name: "paidAmount",
  });

  const watchedPaidInFull = useWatch({
    control: form.control,
    name: "paidInFull",
  });

  const totals = calculatePurchaseTotals(watchedItems);
  const subtotal = totals.subtotal;
  const totalRevenue = totals.revenue;
  const totalProfit = totals.profit;
  const totalMargin = calculateMargin(totalRevenue, totalProfit);

  const paidAmount = Number(watchedPaidAmount || 0);
  const total = subtotal;
  const due = Math.max(total - paidAmount, 0);

  useEffect(() => {
    if (watchedPaidInFull) {
      form.setValue("paidAmount", toMoneyInputValue(total), {
        shouldValidate: true,
      });
    }
  }, [form, total, watchedPaidInFull]);

  const handlePaidInFullChange = useCallback(
    (checked: boolean) => {
      form.setValue("paidAmount", checked ? toMoneyInputValue(total) : "0", {
        shouldValidate: true,
      });
    },
    [form, total]
  );

  const showFormError = useCallback((message: string) => {
    setFormError(message);
    requestAnimationFrame(() => errorSummaryRef.current?.focus());
  }, []);

  const { mutate, isPending } = useCreatePurchase<PurchaseCreateFormType>({
    onSuccess: (_message, purchase) => {
      navigate({
        to: "/dashboard/purchases/$purchaseId",
        params: { purchaseId: purchase.id },
      });
    },
    onValidationErrors: (fields) => {
      fields.forEach(({ fieldName, message }) => {
        form.setError(
          fieldName as unknown as Path<PurchaseCreateFormInputType>,
          {
            message,
            type: "server",
          }
        );
      });
    },
    onError: showFormError,
  });

  const handleSubmit = form.handleSubmit(
    (values) => {
      setFormError(null);

      mutate({
        invoiceId: values.invoiceId,
        vendorId: values.vendorId,
        vendorInvoiceNo: values.vendorInvoiceNo,
        paidAmount: Number(values.paidAmount || 0),
        note: values.note,
        items: values.items.map((item) => ({
          medicineName: item.medicineName,
          genericName: item.genericName,
          strength: item.strength,
          medicineType: item.isNewMedicine ? item.medicineType : undefined,
          baseUnit: item.isNewMedicine ? item.baseUnit : undefined,
          tabletsPerStrip: item.tabletsPerStrip
            ? Number(item.tabletsPerStrip)
            : undefined,
          stripsPerBox: item.stripsPerBox
            ? Number(item.stripsPerBox)
            : undefined,
          qtyPurchased: Number(item.qtyPurchased),
          costPerUnit: Number(item.costPerUnit),
          sellPerUnit: Number(item.sellPerUnit),
          expiryDate: item.expiryDate,
        })),
      });
    },
    () => {
      showFormError("Please check the highlighted fields and try again.");
    }
  );

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          {formError && (
            <div
              ref={errorSummaryRef}
              role="alert"
              tabIndex={-1}
              className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
            >
              <AlertCircle
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-destructive"
              />
              <div className="min-w-0 space-y-1">
                <p className="font-medium text-destructive">
                  There&apos;s a problem with this purchase
                </p>
                <p className="text-muted-foreground">{formError}</p>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Purchase details</CardTitle>
              <CardDescription>
                Choose the vendor and add the reference details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="w-full max-w-30">
                  <InputField
                    control={form.control}
                    name="invoiceNo"
                    label="Invoice #NO"
                    readOnly
                    disabled={isPending}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <VendorSelectorField
                      control={form.control}
                      name="vendorId"
                      label="Vendor"
                      description="The supplier this stock was purchased from."
                      requiredField
                      fetchApi
                      disabled={isPending}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <InputField
                      control={form.control}
                      name="vendorInvoiceNo"
                      label="Vendor invoice no."
                      placeholder="Optional reference"
                      description="The vendor's own invoice number, if provided."
                      disabled={isPending}
                    />
                  </div>
                </div>

                <TextareaField
                  control={form.control}
                  name="note"
                  label="Note"
                  placeholder="Delivery notes, payment terms, or other remarks"
                  disabled={isPending}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          <PurchaseLine form={form} isPending={isPending} />
        </div>

        <PurchaseSummaryCard
          control={form.control}
          formId={FORM_ID}
          subtotal={subtotal}
          totalRevenue={totalRevenue}
          totalProfit={totalProfit}
          totalMargin={totalMargin}
          paidAmount={paidAmount}
          paidInFull={Boolean(watchedPaidInFull)}
          onPaidInFullChange={handlePaidInFullChange}
          total={total}
          due={due}
          isPending={isPending}
          onCancel={() => navigate({ to: "/dashboard/purchases" })}
        />
      </div>
    </form>
  );
}
