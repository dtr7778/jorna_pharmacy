import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { InputAddonField } from "@/components/form-fields/InputAddonField";
import { TextareaField } from "@/components/form-fields/TextareaField";
import { Button } from "@/components/ui/button";
import { ButtonSpinner } from "@/components/ui/button-spinner";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogResponsiveBody,
  DialogResponsiveContent,
  DialogStickyFooter,
  DialogStickyHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { VendorPurchaseSelectorField } from "@/features/purchase/components/VendorPurchaseSelectorField";
import { VendorSelectorField } from "@/features/vendors/components/VendorSelectorField";

import { useCreateVendorPayment } from "../api/vendorPayment.api.hook";
import {
  vendorPaymentCreateFormSchema,
  type VendorPaymentCreateFormType,
} from "../vendor.schema";

export function VendorPaymentCreateDialog({
  vendorId,
  purchaseId,
  open,
  setOpen,
}: {
  vendorId?: string;
  purchaseId?: string;
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  "use no memo";

  const form = useForm<VendorPaymentCreateFormType>({
    resolver: zodResolver(vendorPaymentCreateFormSchema),
    defaultValues: {
      vendorId: vendorId ?? undefined,
      purchaseId: purchaseId ?? undefined,
      amount: "",
      note: "",
    },
  });

  const formVendorId = useWatch({ control: form.control, name: "vendorId" });

  const { mutate, isPending } = useCreateVendorPayment<
    keyof VendorPaymentCreateFormType
  >({
    onSuccess: () => {
      form.reset();
      setOpen(false);
    },
    onValidationErrors: (fields) => {
      fields.forEach(({ fieldName, message }) => {
        form.setError(fieldName, {
          message,
        });
      });
    },
  });

  const handleSubmit = form.handleSubmit(({ amount, ...rest }) => {
    mutate({
      ...rest,
      amount: Number(amount),
    });
  });

  const formId = "vendor_payment_create_form";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogResponsiveContent>
        <DialogStickyHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Record a payment made against a purchase
          </DialogDescription>
        </DialogStickyHeader>

        <DialogResponsiveBody>
          <form id={formId} onSubmit={handleSubmit}>
            <FieldGroup>
              {!vendorId && (
                <VendorSelectorField
                  control={form.control}
                  name="vendorId"
                  label="Vendor"
                  fetchApi={open}
                  disabled={isPending}
                />
              )}
              {!purchaseId && (
                <VendorPurchaseSelectorField
                  control={form.control}
                  name="purchaseId"
                  vendorId={formVendorId}
                  label="Purchase"
                  fetchApi={open}
                  description="The vendor is taken from the selected purchase"
                  disabled={!formVendorId || isPending}
                />
              )}
              <InputAddonField
                control={form.control}
                name="amount"
                label="Amount"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                firstAddon={<DollarSign className="size-4" />}
                placeholder="0"
                disabled={isPending}
                requiredField
              />
              <TextareaField
                control={form.control}
                name="note"
                label="Note"
                placeholder="Notes"
                disabled={isPending}
              />
            </FieldGroup>
          </form>
        </DialogResponsiveBody>

        <DialogStickyFooter>
          <DialogClose
            render={
              <Button type="button" variant="outline" disabled={isPending} />
            }
          >
            Cancel
          </DialogClose>
          <ButtonSpinner form={formId} type="submit" isLoading={isPending}>
            Record
          </ButtonSpinner>
        </DialogStickyFooter>
      </DialogResponsiveContent>
    </Dialog>
  );
}
