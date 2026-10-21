import { useCallback, useId, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Asterisk, BuildingComplex, Info } from "lucide-react";
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
import { orpcTQClient } from "@/server/orpc";

interface VendorSelectorFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label?: string;
  description?: string;
  isDescriptionInfoIconShow?: boolean;
  requiredField?: boolean;
  disabled?: boolean;
  fetchApi?: boolean;
}

export function VendorSelectorField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  description,
  isDescriptionInfoIconShow,
  requiredField,
  disabled = false,
  fetchApi = false,
}: VendorSelectorFieldProps<TFieldValues>) {
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
          <VendorSelectorFieldRender
            field={field}
            fieldState={fieldState}
            id={fieldId}
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

interface VendorSelectorFieldRenderProps<TFieldValues extends FieldValues> {
  field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>;
  fieldState: ControllerFieldState;
  id: string;
  disabled?: boolean;
  placeholder?: string;
  fetchApi?: boolean;
}

function VendorSelectorFieldRender<TFieldValues extends FieldValues>({
  field,
  fieldState,
  id,
  disabled = false,
  placeholder = "Select Vendor",
  fetchApi = false,
}: VendorSelectorFieldRenderProps<TFieldValues>) {
  const [search, setSearch] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, error } = useQuery(
    orpcTQClient.vendor.listForSearch.queryOptions({
      input: {
        search,
        searchFields: ["name", "phone"],
        page: DEFAULT_PAGE_INDEX,
        limit: 5,
      },
      enabled: fetchApi,
      select: (result) => result.data,
    })
  );

  const fieldValue = field.value as string | undefined;

  const selectedVendor = fieldValue
    ? data?.find((vendorData) => vendorData.id === fieldValue)
    : undefined;

  const handleOnChange = useCallback(
    (value: string | Array<string> | undefined) => {
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
        <BuildingComplex className="size-4" />
        {selectedVendor ? (
          <span className="truncate">{selectedVendor.name}</span>
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
        description={"Select a vendor"}
        loadingFallback={
          <SearchableSelectorLoadingSkeleton>
            <Skeleton className="h-8" />
          </SearchableSelectorLoadingSkeleton>
        }
        emptyFallback={
          <SearchableSelectorEmpty
            message="No vendors found"
            icon={<BuildingComplex className="size-8 opacity-20" />}
          />
        }
      >
        {(item) => (
          <SearchableSelectorItem item={item} getItemId={(vendor) => vendor.id}>
            <div className="flex w-full flex-col">
              <span className="truncate font-medium">{item.name}</span>
              {item.phone && (
                <span className="truncate text-xs text-muted-foreground">
                  {item.phone}
                </span>
              )}
            </div>
          </SearchableSelectorItem>
        )}
      </SearchableSelectorContent>
    </SearchableSelector>
  );
}
