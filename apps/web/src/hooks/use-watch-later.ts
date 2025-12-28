"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  toggleWatchLater,
  updateWatchProgress,
  markAsWatched,
  setPlaybackSpeed,
} from "~/server/functions/watch-later";
import { bookmarkQueryKeys } from "~/lib/query-keys";

export function useWatchLater({ year }: { year: number }) {
  const queryClient = useQueryClient();
  const toggleWatchLaterFn = useServerFn(toggleWatchLater);
  const updateProgressFn = useServerFn(updateWatchProgress);
  const markWatchedFn = useServerFn(markAsWatched);
  const setSpeedFn = useServerFn(setPlaybackSpeed);

  const localBookmarksKey = bookmarkQueryKeys.local(year);

  const toggleMutation = useMutation({
    mutationFn: (bookmarkId: string) =>
      toggleWatchLaterFn({ data: { bookmarkId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "bookmarks" &&
          query.queryKey[1] === year,
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "bookmarks" &&
          query.queryKey[1] === year,
      });
      queryClient.invalidateQueries({ queryKey: localBookmarksKey });
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
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "bookmarks" &&
          query.queryKey[1] === year,
      });
    },
  });

  const markWatchedMutation = useMutation({
    mutationFn: (bookmarkId: string) =>
      markWatchedFn({ data: { bookmarkId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "bookmarks" &&
          query.queryKey[1] === year,
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "bookmarks" &&
          query.queryKey[1] === year,
      });
      queryClient.invalidateQueries({ queryKey: localBookmarksKey });
    },
  });

  const setSpeedMutation = useMutation({
    mutationFn: ({ bookmarkId, speed }: { bookmarkId: string; speed: string }) =>
      setSpeedFn({ data: { bookmarkId, speed } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "bookmarks" &&
          query.queryKey[1] === year,
      });
    },
  });

  return {
    toggle: toggleMutation.mutateAsync,
    toggleLoading: toggleMutation.isPending,
    updateProgress: updateProgressMutation.mutateAsync,
    markAsWatched: markWatchedMutation.mutateAsync,
    setPlaybackSpeed: setSpeedMutation.mutateAsync,
  };
}
