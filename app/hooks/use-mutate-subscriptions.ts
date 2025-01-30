"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/start";

import { createSubscription, deleteSubscription } from "~/server/functions/subscriptions";

export function useMutateSubscriptions() {
  const queryClient = useQueryClient();
  const useCreateSubscription = useServerFn(createSubscription);
  const useDeleteSubscription = useServerFn(deleteSubscription);

  const create = useMutation({
    mutationKey: ["createSubscription"],
    mutationFn: async ({
      endpoint,
      auth,
      p256dh,
    }: { endpoint: string; auth: string; p256dh: string }) => {
      const data = await useCreateSubscription({ data: { endpoint, auth, p256dh } });

      if (!data.success) {
        throw new Error("Failed to create subscription");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subscriptions"],
      });
    },
  });

  const handleDeleteSubscription = useMutation({
    mutationKey: ["deleteSubscription"],
    mutationFn: async ({ id }: { id: number }) => {
      const data = await useDeleteSubscription({ data: { id } });

      if (!data.success) {
        throw new Error("Failed to delete subscription");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subscriptions"],
      });
    },
  });

  return {
    create: create.mutate,
    createLoading: create.isPending,
    delete: handleDeleteSubscription.mutate,
    deleteLoading: handleDeleteSubscription.isPending,
  };
}
