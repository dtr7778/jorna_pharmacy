import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { InputField } from "@/components/form-fields/InputField";
import { SelectField } from "@/components/form-fields/SelectField";
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
import { VendorSelectorField } from "@/features/vendors/components/VendorSelectorField";

import { useCreateMedicine } from "../api/medicine.api.hook";
import { MEDICINE_TYPE_OPTIONS } from "../medicine.constants";
import {
  medicineCreateSchema,
  type MedicineCreateInputType,
  type MedicineCreateType,
} from "../medicine.schema";
import { MedicineSearchableField } from "./MedicineSearchableField";

export function MedicineCreateDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  "use no memo";

  const form = useForm<MedicineCreateInputType, unknown, MedicineCreateType>({
    resolver: zodResolver(medicineCreateSchema),
    defaultValues: {
      name: "",
      genericName: "",
      strength: "",
      baseUnit: "",
      rackLocation: "",
      minimumStock: 0,
    },
  });

  const { mutate, isPending } = useCreateMedicine<keyof MedicineCreateType>({
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

  const handleSubmit = form.handleSubmit((values) => {
    mutate(values);
  });

  const formId = "medicine_create_form";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogResponsiveContent>
        <DialogStickyHeader>
          <DialogTitle>Create medicine</DialogTitle>
          <DialogDescription>
            Add a new medicine to your catalog
          </DialogDescription>
        </DialogStickyHeader>

        <DialogResponsiveBody>
          <form id={formId} onSubmit={handleSubmit}>
            <FieldGroup>
              <VendorSelectorField
                control={form.control}
                name="vendorId"
                label="Vendor"
                disabled={isPending}
                requiredField
              />
              <MedicineSearchableField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Search an existing medicine or type a new name"
                disabled={isPending}
                requiredField
                description="Pick an existing medicine to prefill its details, or type a new name to create one."
                onSelectMedicine={(medicine) => {
                  if (!medicine) return;

                  form.setValue("genericName", medicine.genericName ?? "", {
                    shouldDirty: true,
                  });
                  form.setValue("strength", medicine.strength ?? "", {
                    shouldDirty: true,
                  });
                  form.setValue("type", medicine.type, {
                    shouldDirty: true,
                  });
                  form.setValue("baseUnit", medicine.baseUnit, {
                    shouldDirty: true,
                  });
                }}
              />
              <InputField
                control={form.control}
                name="genericName"
                label="Generic name"
                placeholder="e.g. Paracetamol"
                disabled={isPending}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  control={form.control}
                  name="strength"
                  label="Strength"
                  placeholder="e.g. 500 mg"
                  disabled={isPending}
                />
                <SelectField
                  control={form.control}
                  name="type"
                  label="Type"
                  placeholder="Select type"
                  options={MEDICINE_TYPE_OPTIONS}
                  disabled={isPending}
                  requiredField
                />
              </div>
              <InputField
                control={form.control}
                name="baseUnit"
                label="Base unit"
                placeholder="e.g. tablet, bottle"
                disabled={isPending}
                requiredField
              />
              <InputField
                control={form.control}
                name="rackLocation"
                label="Rack location"
                placeholder="e.g. A-1"
                disabled={isPending}
              />
              <InputField
                control={form.control}
                name="minimumStock"
                label="Minimum stock"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                placeholder="0"
                description="Alerts you when the remaining stock reaches this level."
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
