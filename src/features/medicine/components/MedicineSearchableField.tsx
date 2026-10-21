import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import type { Control, FieldValues, Path } from "react-hook-form";

import { SearchableInputField } from "@/components/form-fields/SearchableInputField";
import { DEFAULT_PAGE_INDEX } from "@/constants";
import type { ListMedicineForSearchContractType } from "@/features/medicine/api/medicine.contract";
import { getMedicineTypeIcon } from "@/features/medicine/medicine.constants";
import { orpcTQClient } from "@/server/orpc";

type MedicineOption =
  ListMedicineForSearchContractType["output"]["data"][number];

interface MedicineSelectorFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label?: string;
  placeholder?: string;
  description?: string;
  isDescriptionInfoIconShow?: boolean;
  requiredField?: boolean;
  disabled?: boolean;
  vendorId?: string;
  onSelectMedicine?: (medicine: MedicineOption | undefined) => void;
  onValueChange?: (value: string) => void;
}

export const medicineNameSeparator = "-";

export function MedicineSearchableField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  placeholder = "Search medicine",
  description,
  isDescriptionInfoIconShow,
  requiredField,
  disabled = false,
  vendorId,
  onSelectMedicine,
  onValueChange,
}: MedicineSelectorFieldProps<TFieldValues>) {
  const [search, setSearch] = useState<string | undefined>(undefined);

  const { data } = useQuery(
    orpcTQClient.medicine.listForSearch.queryOptions({
      input: {
        search,
        searchFields: ["name", "genericName", "strength"],
        page: DEFAULT_PAGE_INDEX,
        limit: 5,
        filter: {
          vendorId,
        },
      },
      enabled: Boolean(search?.trim()),
      select: (result) => result.data,
    })
  );

  return (
    <SearchableInputField
      name={name}
      control={control}
      label={label}
      placeholder={placeholder}
      description={description}
      isDescriptionInfoIconShow={isDescriptionInfoIconShow}
      requiredField={requiredField}
      disabled={disabled}
      options={data}
      onSearch={setSearch}
      getOptionKey={(medicine) => medicine.id}
      getOptionLabel={(medicine) =>
        [medicine.name, medicine.genericName, medicine.strength]
          .filter(Boolean)
          .join(` ${medicineNameSeparator} `)
      }
      onOptionSelect={onSelectMedicine}
      onValueChange={onValueChange}
      renderOption={(medicine) => {
        const TypeIcon = getMedicineTypeIcon(medicine.type);

        return (
          <div className="flex w-full min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{medicine.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {[medicine.genericName, medicine.strength]
                  .filter(Boolean)
                  .join(` ${medicineNameSeparator} `)}
              </span>
            </div>
            <TypeIcon
              aria-hidden
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          </div>
        );
      }}
    />
  );
}
