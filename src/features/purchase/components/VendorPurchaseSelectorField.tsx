import { useCallback, useId, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Asterisk, DollarSign, Info } from "lucide-react";
import type {
  Control,
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  Path,
} from "react-hook-form";
import { Controller } from "react-hook-form";

import {
  SearchableSelector,
  SearchableSelectorContent,
  SearchableSelectorEmpty,
  SearchableSelectorItem,
  SearchableSelectorLoadingSkeleton,
  SearchableSelectorTrigger,
} from "@/components/SearchableSelector";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE_INDEX } from "@/constants";
import type { ListPurchaseForSearchContractType } from "@/features/purchase/api/purchase.contract";
import { orpcTQClient } from "@/server/orpc";
import { formatCurrency } from "@/utils/formatCurrency";

type VendorPurchaseItem =
  ListPurchaseForSearchContractType["output"]["data"][number];

interface VendorPurchaseSelectorFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  vendorId?: string;
  label?: string;
  description?: string;
  isDescriptionInfoIconShow?: boolean;
  requiredField?: boolean;
  disabled?: boolean;
  fetchApi?: boolean;
}

export function VendorPurchaseSelectorField<TFieldValues extends FieldValues>({
  name,
  control,
  vendorId,
  label,
  description,
  isDescriptionInfoIconShow,
  requiredField = false,
  disabled = false,
  fetchApi = true,
}: VendorPurchaseSelectorFieldProps<TFieldValues>) {
  const fieldId = useId();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          {label && (
            <FieldLabel htmlFor={fieldId} aria-disabled={disabled}>
              {label}
              {requiredField && (
                <Asterisk className="-mt-2 size-3 text-destructive" />
              )}
            </FieldLabel>
          )}
          <VendorPurchaseSelectorFieldRender
            field={field}
            fieldState={fieldState}
            id={fieldId}
            vendorId={vendorId}
            disabled={disabled}
            fetchApi={fetchApi}
          />
          {description && (
            <FieldDescription
              className="flex items-start gap-1.5"
              aria-disabled={disabled}
            >
              {isDescriptionInfoIconShow && <Info className="mt-0.5 size-4" />}
              {description}
            </FieldDescription>
          )}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

interface VendorPurchaseSelectorFieldRenderProps<
  TFieldValues extends FieldValues,
> {
  field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>;
  fieldState: ControllerFieldState;
  id: string;
  vendorId?: string;
  disabled?: boolean;
  fetchApi?: boolean;
  placeholder?: string;
}

function VendorPurchaseSelectorFieldRender<TFieldValues extends FieldValues>({
  field,
  fieldState,
  id,
  vendorId,
  disabled = false,
  fetchApi = true,
  placeholder = "Select purchase",
}: VendorPurchaseSelectorFieldRenderProps<TFieldValues>) {
  const [search, setSearch] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, error } = useQuery(
    orpcTQClient.purchase.listForSearch.queryOptions({
      input: {
        unpaidOnly: true,
        search,
        searchFields: ["invoiceNo"],
        page: DEFAULT_PAGE_INDEX,
        limit: 5,
        ...(vendorId && { vendorId }),
      },
      enabled: fetchApi,
      select: (result) => result.data,
    })
  );

  const fieldValue = field.value as string | undefined;

  const selectedPurchase = fieldValue
    ? data?.find((purchaseData) => purchaseData.id === fieldValue)
    : undefined;

  const handleOnChange = useCallback(
    (value: string | undefined) => {
      field.onChange(value);
    },
    [field]
  );

  return (
    <SearchableSelector
      value={fieldValue}
      onChange={handleOnChange}
      onSearch={setSearch}
      disabled={disabled}
    >
      <SearchableSelectorTrigger id={id} aria-invalid={fieldState.invalid}>
        <DollarSign className="size-4" />
        {selectedPurchase ? (
          <span className="truncate">{purchaseLabel(selectedPurchase)}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </SearchableSelectorTrigger>
      <SearchableSelectorContent
        data={data}
        isLoading={isLoading}
        isError={isError}
        error={error}
        title={placeholder}
        description="Select an unpaid purchase"
        searchPlaceholder="Search invoice..."
        loadingFallback={
          <SearchableSelectorLoadingSkeleton>
            <Skeleton className="h-8" />
          </SearchableSelectorLoadingSkeleton>
        }
        emptyFallback={
          <SearchableSelectorEmpty
            message="No unpaid purchases found"
            icon={<DollarSign className="size-8 opacity-20" />}
          />
        }
      >
        {(purchase) => <PurchaseItem purchase={purchase} />}
      </SearchableSelectorContent>
    </SearchableSelector>
  );
}

function purchaseLabel(purchase: VendorPurchaseItem) {
  const due = purchase.totalAmount - purchase.paidAmount;
  return `${purchase.invoiceNo} · due ${formatCurrency(due)}`;
}

function PurchaseItem({ purchase }: { purchase: VendorPurchaseItem }) {
  const due = purchase.totalAmount - purchase.paidAmount;

  return (
    <SearchableSelectorItem item={purchase} getItemId={(item) => item.id}>
      <div className="flex w-full flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium">{purchase.invoiceNo}</span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {`Due ${formatCurrency(due)}`}
          </span>
        </div>
        <span className="truncate text-xs text-muted-foreground">
          {purchase.vendorName}
        </span>
      </div>
    </SearchableSelectorItem>
  );
}
