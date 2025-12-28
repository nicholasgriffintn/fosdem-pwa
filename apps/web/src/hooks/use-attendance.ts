"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  markEventAttended,
  unmarkEventAttended,
} from "~/server/functions/user-stats";
import { bookmarkQueryKeys, sessionQueryKeys } from "~/lib/query-keys";

export function useAttendance({ year }: { year: number }) {
  const queryClient = useQueryClient();
  const markAttendedFn = useServerFn(markEventAttended);
  const unmarkAttendedFn = useServerFn(unmarkEventAttended);

  const markAttendedMutation = useMutation({
    mutationFn: ({ bookmarkId, inPerson }: { bookmarkId: string; inPerson?: boolean }) =>
      markAttendedFn({ data: { bookmarkId, inPerson } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "bookmarks" &&
          query.queryKey[1] === year,
      });
      queryClient.invalidateQueries({ queryKey: bookmarkQueryKeys.local(year) });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "bookmarks" &&
          query.queryKey[1] === year,
      });
      queryClient.invalidateQueries({ queryKey: sessionQueryKeys.userStats, exact: false });
    },
  });

  const unmarkAttendedMutation = useMutation({
    mutationFn: (bookmarkId: string) =>
      unmarkAttendedFn({ data: { bookmarkId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "bookmarks" &&
          query.queryKey[1] === year,
      });
      queryClient.invalidateQueries({ queryKey: bookmarkQueryKeys.local(year) });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "bookmarks" &&
          query.queryKey[1] === year,
      });
      queryClient.invalidateQueries({ queryKey: sessionQueryKeys.userStats, exact: false });
    },
  });

  return {
    markAttended: markAttendedMutation.mutateAsync,
    markAttendedLoading: markAttendedMutation.isPending,
    unmarkAttended: unmarkAttendedMutation.mutateAsync,
    unmarkAttendedLoading: unmarkAttendedMutation.isPending,
  };
}
