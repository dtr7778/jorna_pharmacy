import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { CheckboxField } from "@/components/form-fields/CheckboxField";
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

import { useUpdateMedicine } from "../api/medicine.api.hook";
import type { ListMedicineContractType } from "../api/medicine.contract";
import { MEDICINE_TYPE_OPTIONS } from "../medicine.constants";
import {
  medicineUpdateSchema,
  type MedicineUpdateInputType,
  type MedicineUpdateType,
} from "../medicine.schema";

export function MedicineUpdateDialog({
  open,
  setOpen,
  medicineId,
  medicineData,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  medicineId: string;
  medicineData: ListMedicineContractType["output"]["data"]["data"][number];
}) {
  "use no memo";

  const form = useForm<MedicineUpdateInputType, unknown, MedicineUpdateType>({
    resolver: zodResolver(medicineUpdateSchema),
    defaultValues: {
      name: medicineData.name,
      genericName: medicineData.genericName ?? "",
      strength: medicineData.strength ?? "",
      type: medicineData.type,
      baseUnit: medicineData.baseUnit,
      rackLocation: medicineData.rackLocation ?? "",
      minimumStock: medicineData.minimumStock,
      isActive: medicineData.isActive,
    },
  });

  const { mutate, isPending } = useUpdateMedicine<keyof MedicineUpdateType>({
    onSuccess: () => {
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
    mutate({ ...values, medicineId });
  });

  const formId = "medicine_update_form";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogResponsiveContent>
        <DialogStickyHeader>
          <DialogTitle>Update &quot;{medicineData.name}&quot;</DialogTitle>
          <DialogDescription>Carefully update medicine data</DialogDescription>
        </DialogStickyHeader>

        <DialogResponsiveBody>
          <form id={formId} onSubmit={handleSubmit}>
            <FieldGroup>
              <InputField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Medicine name"
                disabled={isPending}
                requiredField
              />
              <CheckboxField
                control={form.control}
                name="isActive"
                label="Is medicine active"
                disabled={isPending}
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
            Update
          </ButtonSpinner>
        </DialogStickyFooter>
      </DialogResponsiveContent>
    </Dialog>
  );
}
