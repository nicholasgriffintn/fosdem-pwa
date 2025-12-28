"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferenceUpdate,
} from "~/server/functions/notification-preferences";

export function useNotificationPreferences() {
  const queryClient = useQueryClient();
  const fetchPreferences = useServerFn(getNotificationPreferences);
  const savePreferences = useServerFn(updateNotificationPreferences);

  const queryKey = ["notificationPreferences"];

  const { data: preferences, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchPreferences(),
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: NotificationPreferenceUpdate) =>
      savePreferences({ data: updates }),
    onSuccess: (result) => {
      if (result && "data" in result) {
        queryClient.setQueryData(queryKey, result.data);
      }
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    preferences: preferences ?? null,
    loading: isLoading,
    update: updateMutation.mutateAsync,
    updating: updateMutation.isPending,
  };
}
