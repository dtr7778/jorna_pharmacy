import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { orpcTQClient } from "@/server/orpc";
import type { IApiHookInput } from "@/types";
import { formatOrpcError } from "@/utils/formatOrpcError";

export function useCreateCashClosing<TFieldNames>({
  onRequestStart,
  onSuccess,
  onRequestEnd,
  onError,
  onValidationErrors,
}: IApiHookInput<TFieldNames>) {
  const toastId = "cash_closing_create_toast_message";
  const queryClient = useQueryClient();

  return useMutation(
    orpcTQClient.cashClosing.create.mutationOptions({
      onMutate: () => {
        toast.loading("Creating...", { id: toastId });
        onRequestStart?.();
      },
      onSuccess: async ({ message }) => {
        toast.success(message, { id: toastId });
        await queryClient.invalidateQueries({
          queryKey: orpcTQClient.cashClosing.list.queryKey({
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
      onSettled: () => {
        onRequestEnd?.();
      },
    })
  );
}
