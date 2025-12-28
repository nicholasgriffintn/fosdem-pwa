"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  getUserStats,
  refreshUserStats,
  getUserStatsHistory,
} from "~/server/functions/user-stats";

export function useUserStats({ year }: { year: number }) {
  const queryClient = useQueryClient();
  const fetchStats = useServerFn(getUserStats);
  const refreshStatsFn = useServerFn(refreshUserStats);

  const queryKey = ["userStats", year];

  const { data: stats, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchStats({ data: { year } }),
  });

  const refreshMutation = useMutation({
    mutationFn: () => refreshStatsFn({ data: { year } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    stats,
    loading: isLoading,
    refresh: refreshMutation.mutateAsync,
    refreshing: refreshMutation.isPending,
  };
}

export function useUserStatsHistory() {
  const fetchHistory = useServerFn(getUserStatsHistory);

  const { data: history, isLoading } = useQuery({
    queryKey: ["userStatsHistory"],
    queryFn: () => fetchHistory(),
  });

  return {
    history: history ?? [],
    loading: isLoading,
  };
}
