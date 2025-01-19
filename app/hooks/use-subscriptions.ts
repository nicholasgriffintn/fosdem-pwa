"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/start";

import { getSubscriptions } from "~/server/functions/subscriptions";

export function useSubscriptions() {
  const useGetSubscriptions = useServerFn(getSubscriptions);

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const data = await useGetSubscriptions();

      return data;
    },
  });

  return {
    subscriptions,
    loading: isLoading,
  };
}
