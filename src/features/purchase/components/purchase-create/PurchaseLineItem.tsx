import { Trash2 } from "lucide-react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import { DateTimePickerField } from "@/components/form-fields/DateTimePickerField";
import { InputAddonField } from "@/components/form-fields/InputAddonField";
import { InputField } from "@/components/form-fields/InputField";
import { SelectField } from "@/components/form-fields/SelectField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import type { MedicineTypeEnumType } from "@/db/schemas/enums/zod-db-enums";
import {
  medicineNameSeparator,
  MedicineSearchableField,
} from "@/features/medicine/components/MedicineSearchableField";
import type { PurchaseCreateFormInputType } from "@/features/purchase/purchase.schema";
import { calculateMargin } from "@/features/purchase/purchase.utils";
import { formatCurrency } from "@/utils/formatCurrency";

const MEDICINE_TYPE_OPTIONS: { value: MedicineTypeEnumType; label: string }[] =
  [
    { value: "tablet", label: "Tablet" },
    { value: "capsule", label: "Capsule" },
    { value: "liquid_bottle", label: "Liquid bottle" },
    { value: "liquid_drop", label: "Liquid drop" },
    { value: "injection", label: "Injection" },
    { value: "cream", label: "Cream" },
    { value: "other", label: "Other" },
  ];

interface PurchaseLineItemProps {
  index: number;
  form: UseFormReturn<PurchaseCreateFormInputType>;
  disabled: boolean;
  onRemove: () => void;
}

export function PurchaseLineItem({
  index,
  form,
  disabled,
  onRemove,
}: PurchaseLineItemProps) {
  const { control } = form;

  const medicineName = useWatch({
    control,
    name: `items.${index}.medicineName`,
  });
  const vendorId = useWatch({
    control,
    name: "vendorId",
  });
  const isNewMedicine = useWatch({
    control,
    name: `items.${index}.isNewMedicine`,
  });

  const baseUnit = useWatch({ control, name: `items.${index}.baseUnit` });
  const qty = useWatch({ control, name: `items.${index}.qtyPurchased` });
  const cost = useWatch({ control, name: `items.${index}.costPerUnit` });
  const sell = useWatch({ control, name: `items.${index}.sellPerUnit` });

  const qtyNum = Math.max(0, Number(qty) || 0);
  const costNum = Math.max(0, Number(cost) || 0);
  const sellNum = Math.max(0, Number(sell) || 0);

  const lineTotal = qtyNum * costNum;
  const lineRevenue = qtyNum * sellNum;
  const lineProfit = qtyNum * (sellNum - costNum);
  const lineMargin = calculateMargin(lineRevenue, lineProfit);

  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant="outline">{`Item ${index + 1}`}</Badge>
          <span className="truncate text-xs text-muted-foreground">
            {medicineName || "Choose a medicine to begin"}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove item ${index + 1}`}
          title={"Remove item"}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-12">
        <div className="col-span-2 lg:col-span-6">
          <div className="flex flex-col gap-2">
            <MedicineSearchableField
              control={control}
              name={`items.${index}.medicineName`}
              label="Medicine"
              requiredField
              disabled={disabled}
              vendorId={vendorId}
              onValueChange={(inputMedicineValue) => {
                form.setValue(`items.${index}.isNewMedicine`, true, {
                  shouldDirty: true,
                });
                const [_, genericNameValue, strengthValue] =
                  inputMedicineValue.split(medicineNameSeparator);

                if (genericNameValue) {
                  form.setValue(
                    `items.${index}.genericName`,
                    genericNameValue,
                    {
                      shouldDirty: true,
                    }
                  );
                }
                if (strengthValue) {
                  form.setValue(`items.${index}.strength`, strengthValue, {
                    shouldDirty: true,
                  });
                }
              }}
              onSelectMedicine={(medicine) => {
                if (medicine) {
                  form.setValue(`items.${index}.isNewMedicine`, false, {
                    shouldDirty: true,
                  });
                  form.setValue(`items.${index}.medicineType`, medicine.type, {
                    shouldDirty: true,
                  });
                  form.setValue(`items.${index}.baseUnit`, medicine.baseUnit, {
                    shouldDirty: true,
                  });
                  if (medicine.strength) {
                    form.setValue(
                      `items.${index}.strength`,
                      medicine.strength,
                      {
                        shouldDirty: true,
                      }
                    );
                  }
                  if (medicine.genericName) {
                    form.setValue(
                      `items.${index}.genericName`,
                      medicine.genericName,
                      {
                        shouldDirty: true,
                      }
                    );
                  }
                }
              }}
            />
            <div className="flex gap-2">
              <InputField
                control={control}
                name={`items.${index}.genericName`}
                label="Generic Name"
                disabled={disabled}
                readOnly
              />
              <InputField
                control={control}
                name={`items.${index}.strength`}
                label="Strength"
                disabled={disabled}
                readOnly
              />
            </div>
            <div className="flex gap-2">
              <InputAddonField
                control={control}
                name={`items.${index}.qtyPurchased`}
                label="Quantity"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                placeholder="0"
                secondAddon={
                  baseUnit ? (
                    <span className="text-xs">{baseUnit}</span>
                  ) : undefined
                }
                disabled={disabled}
                requiredField
              />
              <DateTimePickerField
                control={control}
                name={`items.${index}.expiryDate`}
                label="Expiry"
                placeholder="Select expiry"
                showTimeSelection={false}
                triggerClassName="w-full justify-start font-normal"
                disabled={disabled}
              />
            </div>
            {isNewMedicine && (
              <div className="flex gap-2">
                <SelectField
                  control={control}
                  name={`items.${index}.medicineType`}
                  label="Type"
                  placeholder="Select type"
                  options={MEDICINE_TYPE_OPTIONS}
                  disabled={disabled}
                  requiredField
                />
                <InputField
                  control={control}
                  name={`items.${index}.baseUnit`}
                  label="Base unit"
                  placeholder="e.g. tablet, bottle"
                  disabled={disabled}
                  requiredField
                />
              </div>
            )}
          </div>
        </div>

        <div className="col-span-1 lg:col-span-3">
          <div className="grid gap-2">
            <InputAddonField
              control={control}
              name={`items.${index}.costPerUnit`}
              label="Cost per item"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              placeholder="0.00"
              firstAddon={<span aria-hidden>৳</span>}
              disabled={disabled}
              requiredField
            />
            <InputAddonField
              control={control}
              name={`items.${index}.sellPerUnit`}
              label="Sell per item"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              placeholder="0.00"
              firstAddon={<span aria-hidden>৳</span>}
              disabled={disabled}
              requiredField
            />
          </div>
        </div>

        <div className="col-span-1 lg:col-span-3">
          <div className="flex flex-col gap-2">
            <Field>
              <FieldLabel>Line total</FieldLabel>
              <div className="flex h-7 items-center rounded-md bg-background px-2 text-xs font-medium tabular-nums ring-1 ring-foreground/10">
                {formatCurrency(lineTotal)}
              </div>
            </Field>
            <Field>
              <FieldLabel>Revenue</FieldLabel>
              <div className="flex h-7 items-center rounded-md bg-background px-2 text-xs font-medium tabular-nums ring-1 ring-foreground/10">
                {formatCurrency(lineRevenue)}
              </div>
            </Field>
            <div className="flex gap-2">
              <Field>
                <FieldLabel>Profit</FieldLabel>
                <div className="flex h-7 items-center rounded-md bg-background px-2 text-xs font-medium tabular-nums ring-1 ring-foreground/10">
                  {formatCurrency(lineProfit)}
                </div>
              </Field>
              <Field>
                <FieldLabel>Margin</FieldLabel>
                <div className="flex h-7 items-center rounded-md bg-background px-2 text-xs font-medium tabular-nums ring-1 ring-foreground/10">
                  {`${lineMargin} %`}
                </div>
              </Field>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
