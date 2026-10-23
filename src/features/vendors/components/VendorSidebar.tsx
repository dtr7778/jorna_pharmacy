import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { BuildingComplex } from "lucide-react";

import { QueryStateBoundary } from "@/components/tanstack-query/query-state-boundary";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE_INDEX } from "@/constants";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { orpcTQClient } from "@/server/orpc";

export function VendorSidebar({
  value,
  onSelect,
}: {
  value: string | undefined;
  onSelect: (vendorId: string) => void;
}) {
  const [search, setSearch] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, error, refetch } = useQuery(
    orpcTQClient.vendor.listForSearch.queryOptions({
      input: {
        search,
        searchFields: ["name", "phone"],
        page: DEFAULT_PAGE_INDEX,
        limit: 5,
      },
      select: (result) => result.data,
    })
  );

  const debouncedSetSearch = useDebouncedCallback((searchValue: string) => {
    setSearch(searchValue.trim() || undefined);
  }, 500);

  return (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder="Search company..."
        onValueChange={debouncedSetSearch}
        inputMode="search"
        autoCapitalize="none"
      />
      <CommandList
        style={{ "--cmdk-list-height": "auto" } as React.CSSProperties}
        className="lg:max-h-auto"
      >
        <QueryStateBoundary
          data={data}
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={(d) => d.length === 0}
          loadingFallback={
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-8" />
              ))}
            </div>
          }
          emptyFallback={
            <CommandEmpty className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
              <BuildingComplex className="size-8 opacity-20" />
              <span>No company found</span>
            </CommandEmpty>
          }
          errorFallback={() => (
            <div
              role="alert"
              className="p-6 text-center text-sm text-muted-foreground"
            >
              <p className="mb-3">Couldn’t load company.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          )}
        >
          {(vendors) => (
            <CommandGroup>
              {vendors.map((vendor) => (
                <CommandItem
                  key={vendor.id}
                  value={vendor.id}
                  onSelect={() => onSelect(vendor.id)}
                  data-checked={vendor.id === value}
                  className="cursor-pointer"
                >
                  <div className="flex w-full flex-col">
                    <span className="truncate font-medium">{vendor.name}</span>
                    {vendor.phone && (
                      <span className="truncate text-xs text-muted-foreground">
                        {vendor.phone}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </QueryStateBoundary>
      </CommandList>
    </Command>
  );
}
