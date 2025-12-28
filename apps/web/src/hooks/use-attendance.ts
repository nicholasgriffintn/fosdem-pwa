"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  markEventAttended,
  unmarkEventAttended,
} from "~/server/functions/user-stats";

export function useAttendance({ year }: { year: number }) {
  const queryClient = useQueryClient();
  const markAttendedFn = useServerFn(markEventAttended);
  const unmarkAttendedFn = useServerFn(unmarkEventAttended);

  const markAttendedMutation = useMutation({
    mutationFn: ({ bookmarkId, inPerson }: { bookmarkId: string; inPerson?: boolean }) =>
      markAttendedFn({ data: { bookmarkId, inPerson } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["local-bookmarks"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["bookmark"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["userStats"], exact: false });
    },
  });

  const unmarkAttendedMutation = useMutation({
    mutationFn: (bookmarkId: string) =>
      unmarkAttendedFn({ data: { bookmarkId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["local-bookmarks"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["bookmark"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["userStats"], exact: false });
    },
  });

  return {
    markAttended: markAttendedMutation.mutateAsync,
    markAttendedLoading: markAttendedMutation.isPending,
    unmarkAttended: unmarkAttendedMutation.mutateAsync,
    unmarkAttendedLoading: unmarkAttendedMutation.isPending,
  };
}
