import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { orpcTQClient } from "@/server/orpc";
import type { IApiHookInput } from "@/types";
import { formatOrpcError } from "@/utils/formatOrpcError";

import type { CreateVendorPurchaseContractType } from "./purchase.contract";

type CreatedPurchase = CreateVendorPurchaseContractType["output"]["data"];

type CreatePurchaseHookOptions<TFieldNames> = Omit<
  IApiHookInput<TFieldNames>,
  "onSuccess"
> & {
  onSuccess?: (message: string, purchase: CreatedPurchase) => void;
};

export function useNextPurchaseInvoiceNo() {
  return useQuery(
    orpcTQClient.purchase.nextInvoiceNo.queryOptions({ gcTime: 0 })
  );
}

export function useCreatePurchase<TFieldNames = string>({
  onRequestStart,
  onSuccess,
  onError,
  onValidationErrors,
}: CreatePurchaseHookOptions<TFieldNames> = {}) {
  const toastId = "create_purchase_toast_message";
  const queryClient = useQueryClient();

  return useMutation(
    orpcTQClient.purchase.create.mutationOptions({
      onMutate: () => {
        toast.loading("Creating purchase...", { id: toastId });
        onRequestStart?.();
      },
      onSuccess: async ({ message, data }) => {
        toast.success(message, { id: toastId });

        await Promise.all([
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
            queryKey: orpcTQClient.purchase.details.queryKey({
              input: { purchaseId: data.id },
            }),
            exact: true,
          }),
          queryClient.invalidateQueries({
            queryKey: orpcTQClient.vendor.details.queryKey({
              input: { vendorId: data.vendorId },
            }),
            exact: true,
          }),
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
        ]);

        onSuccess?.(message, data);
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
