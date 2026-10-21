import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { orpcTQClient } from "@/server/orpc";
import type { IApiHookInput } from "@/types";
import { formatOrpcError } from "@/utils/formatOrpcError";

export function useCreateVendorPayment<TFieldNames>({
  onRequestStart,
  onSuccess,
  onError,
  onValidationErrors,
}: IApiHookInput<TFieldNames>) {
  const toastId = "create_vendor_payment_toast_message";
  const queryClient = useQueryClient();

  return useMutation(
    orpcTQClient.vendor.payment.create.mutationOptions({
      onMutate: () => {
        toast.loading("Recording...", { id: toastId });
        onRequestStart?.();
      },
      onSuccess: async ({ message, data }) => {
        toast.success(message, { id: toastId });
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: orpcTQClient.vendor.payment.list.queryKey({
              input: {},
            }),
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: orpcTQClient.vendor.payment.stats.queryKey({
              input: {},
            }),
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: orpcTQClient.purchase.list.queryKey({
              input: {},
            }),
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: orpcTQClient.purchase.stats.queryKey({
              input: {},
            }),
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: orpcTQClient.vendor.details.queryKey({
              input: { vendorId: data.vendorId },
            }),
            exact: true,
          }),
          ...(data.purchaseId
            ? [
                queryClient.invalidateQueries({
                  queryKey: orpcTQClient.purchase.details.queryKey({
                    input: { purchaseId: data.purchaseId },
                  }),
                  exact: true,
                }),
              ]
            : []),
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
