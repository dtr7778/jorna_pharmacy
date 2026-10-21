import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { InputField } from "@/components/form-fields/InputField";
import { PhoneInputField } from "@/components/form-fields/PhoneInputField";
import { TextareaField } from "@/components/form-fields/TextareaField";
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

import { useCreateVendor } from "../api/vendor.api.hook";
import { vendorCreateSchema, type VendorCreateType } from "../vendor.schema";

export function VendorCreateDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  "use no memo";

  const form = useForm<VendorCreateType>({
    resolver: zodResolver(vendorCreateSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      note: "",
    },
  });

  const { mutate, isPending } = useCreateVendor<keyof VendorCreateType>({
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

  const formId = "vendor_create_form";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogResponsiveContent>
        <DialogStickyHeader>
          <DialogTitle>Create vendor</DialogTitle>
          <DialogDescription>
            Add a new vendor to your directory
          </DialogDescription>
        </DialogStickyHeader>

        <DialogResponsiveBody>
          <form id={formId} onSubmit={handleSubmit}>
            <FieldGroup>
              <InputField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Vendor name"
                disabled={isPending}
                requiredField
              />
              <PhoneInputField
                control={form.control}
                name="phone"
                label="Number"
                placeholder="Vendor phone number"
                defaultCountry="BD"
                disabled={isPending}
              />
              <InputField
                control={form.control}
                name="address"
                label="Address"
                placeholder="Vendor address"
                disabled={isPending}
              />
              <TextareaField
                control={form.control}
                name="note"
                label="Note"
                placeholder="Notes"
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
