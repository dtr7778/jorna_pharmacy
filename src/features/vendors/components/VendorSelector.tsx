import { useId, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { BuildingComplex } from "lucide-react";

import {
  SearchableSelector,
  SearchableSelectorContent,
  SearchableSelectorEmpty,
  SearchableSelectorItem,
  SearchableSelectorLoadingSkeleton,
  SearchableSelectorTrigger,
} from "@/components/SearchableSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE_INDEX } from "@/constants";
import { orpcTQClient } from "@/server/orpc";

interface VendorSelectorFieldProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  fetchApi?: boolean;
}

export function VendorSelector({
  value,
  onChange,
  placeholder = "Select a Company",
  disabled = false,
  fetchApi = false,
}: VendorSelectorFieldProps) {
  const id = useId();
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

  const selectedVendor = value
    ? data?.find((vendorData) => vendorData.id === value)
    : undefined;

  return (
    <SearchableSelector
      value={value}
      onChange={onChange}
      onSearch={setSearch}
      disabled={disabled}
    >
      <SearchableSelectorTrigger id={id}>
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
        description="Select a Company"
        loadingFallback={
          <SearchableSelectorLoadingSkeleton>
            <Skeleton className="h-8" />
          </SearchableSelectorLoadingSkeleton>
        }
        emptyFallback={
          <SearchableSelectorEmpty
            message="No company found"
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
