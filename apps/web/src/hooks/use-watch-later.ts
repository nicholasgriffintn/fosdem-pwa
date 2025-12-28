"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  getWatchLaterList,
  toggleWatchLater,
  updateWatchProgress,
  markAsWatched,
  setPlaybackSpeed,
} from "~/server/functions/watch-later";

export function useWatchLater({ year }: { year: number }) {
  const queryClient = useQueryClient();
  const fetchWatchLater = useServerFn(getWatchLaterList);
  const toggleWatchLaterFn = useServerFn(toggleWatchLater);
  const updateProgressFn = useServerFn(updateWatchProgress);
  const markWatchedFn = useServerFn(markAsWatched);
  const setSpeedFn = useServerFn(setPlaybackSpeed);

  const queryKey = ["watchLater", year];

  const { data: watchLaterList, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchWatchLater({ data: { year } }),
  });

  const toggleMutation = useMutation({
    mutationFn: (bookmarkId: string) =>
      toggleWatchLaterFn({ data: { bookmarkId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["local-bookmarks"], exact: false });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({
      bookmarkId,
      progressSeconds,
      playbackSpeed,
    }: {
      bookmarkId: string;
      progressSeconds: number;
      playbackSpeed?: string;
    }) =>
      updateProgressFn({ data: { bookmarkId, progressSeconds, playbackSpeed } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const markWatchedMutation = useMutation({
    mutationFn: (bookmarkId: string) =>
      markWatchedFn({ data: { bookmarkId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["local-bookmarks"], exact: false });
    },
  });

  const setSpeedMutation = useMutation({
    mutationFn: ({ bookmarkId, speed }: { bookmarkId: string; speed: string }) =>
      setSpeedFn({ data: { bookmarkId, speed } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    watchLaterList: watchLaterList ?? [],
    loading: isLoading,
    toggle: toggleMutation.mutateAsync,
    toggleLoading: toggleMutation.isPending,
    updateProgress: updateProgressMutation.mutateAsync,
    markAsWatched: markWatchedMutation.mutateAsync,
    setPlaybackSpeed: setSpeedMutation.mutateAsync,
  };
}
