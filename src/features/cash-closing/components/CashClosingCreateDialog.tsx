import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";

import { InputAddonField } from "@/components/form-fields/InputAddonField";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";

import { useCreateCashClosing } from "../api/cashClosing.api.hook";
import {
  cashClosingCreateSchema,
  type CashClosingCreateInputType,
  type CashClosingCreateType,
} from "../cash-closing.schema";

export function CashClosingCreateDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<
    CashClosingCreateType,
    unknown,
    CashClosingCreateInputType
  >({
    resolver: zodResolver(cashClosingCreateSchema),
    defaultValues: {
      totalSalary: "0",
      totalSales: "0",
    },
  });

  const { mutate, isPending } = useCreateCashClosing<
    keyof CashClosingCreateType
  >({
    onSuccess: () => {
      setOpen(false);
    },
    onValidationErrors: (fields) => {
      fields.forEach(({ fieldName, message }) => {
        form.setError(fieldName, { message });
      });
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    mutate(values);
  });

  const formId = "cash_closing_create_form";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Add Daily sale</DialogTrigger>
      <DialogResponsiveContent>
        <DialogStickyHeader>
          <DialogTitle>Daily sale</DialogTitle>
          <DialogDescription>Add a daily sale and salary</DialogDescription>
        </DialogStickyHeader>

        <DialogResponsiveBody>
          <form id={formId} onSubmit={handleSubmit}>
            <FieldGroup>
              <InputAddonField
                control={form.control}
                name="totalSales"
                label="Total sales"
                firstAddon={<DollarSign />}
                requiredField
                disabled={isPending}
              />
              <InputAddonField
                control={form.control}
                name="totalSalary"
                label="Total salary"
                firstAddon={<DollarSign />}
                requiredField
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
            Create
          </ButtonSpinner>
        </DialogStickyFooter>
      </DialogResponsiveContent>
    </Dialog>
  );
}
