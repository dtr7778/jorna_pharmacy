import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { orpcTQClient } from "@/server/orpc";
import type { IApiHookInput } from "@/types";
import { formatOrpcError } from "@/utils/formatOrpcError";

export function useCreateVendor<TFieldNames>({
  onRequestStart,
  onSuccess,
  onError,
  onValidationErrors,
}: IApiHookInput<TFieldNames> = {}) {
  const toastId = "create_vendor_toast_message";
  const queryClient = useQueryClient();

  return useMutation(
    orpcTQClient.vendor.create.mutationOptions({
      onMutate: () => {
        toast.loading("Creating...", { id: toastId });
        onRequestStart?.();
      },
      onSuccess: async ({ message }) => {
        toast.success(message, { id: toastId });
        await queryClient.invalidateQueries({
          queryKey: orpcTQClient.vendor.list.queryKey({
            input: {},
          }),
          exact: false,
        });
        onSuccess?.(message);
      },
      onError: (error) => {
        const { message, type, fieldErrors } =
          formatOrpcError<TFieldNames>(error);

        if (type === "validation" && fieldErrors) {
          onValidationErrors?.(fieldErrors);
        }

        toast.error(message, { id: toastId });

        onError?.(message);
      },
    })
  );
}

export function useUpdateVendor<TFieldNames>({
  onRequestStart,
  onSuccess,
  onError,
  onValidationErrors,
}: IApiHookInput<TFieldNames> = {}) {
  const toastId = "update_vendor_toast_message";
  const queryClient = useQueryClient();

  return useMutation(
    orpcTQClient.vendor.update.mutationOptions({
      onMutate: () => {
        toast.loading("Updating...", { id: toastId });
        onRequestStart?.();
      },
      onSuccess: async ({ message }, { vendorId }) => {
        toast.success(message, { id: toastId });
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: orpcTQClient.vendor.list.queryKey({
              input: {},
            }),
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: orpcTQClient.vendor.details.queryKey({
              input: { vendorId },
            }),
            exact: true,
          }),
        ]);
        onSuccess?.(message);
      },
      onError: (error) => {
        const { message, type, fieldErrors } =
          formatOrpcError<TFieldNames>(error);

        if (type === "validation" && fieldErrors) {
          onValidationErrors?.(fieldErrors);
        }

        toast.error(message, { id: toastId });

        onError?.(message);
      },
    })
  );
}
