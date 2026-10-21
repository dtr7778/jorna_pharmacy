import { Plus } from "lucide-react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  emptyPurchaseItemFormValues,
  type PurchaseCreateFormInputType,
} from "../../purchase.schema";
import { PurchaseLineItem } from "./PurchaseLineItem";

export function PurchaseLine({
  form,
  isPending,
}: {
  form: UseFormReturn<PurchaseCreateFormInputType>;
  isPending: boolean;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Line items</CardTitle>
        <CardDescription>
          Medicines and pricing received from the vendor
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ ...emptyPurchaseItemFormValues })}
            disabled={isPending}
          >
            <Plus aria-hidden />
            <span>Add</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            No line items yet.
          </div>
        ) : (
          fields.map((field, index) => (
            <PurchaseLineItem
              key={field.id}
              index={index}
              form={form}
              disabled={isPending}
              onRemove={() => remove(index)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
