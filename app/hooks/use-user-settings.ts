"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUserSettings({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const setBookmarksVisibility = useMutation({
    mutationFn: async ({ visibility }: { visibility: string }) => {
      const response = await fetch("/api/user/bookmarks/visibility", {
        method: "POST",
        body: JSON.stringify({ visibility }),
      });
      if (!response.ok) throw new Error("Failed to set bookmarks visibility");
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      queryClient.invalidateQueries({ queryKey: ["userBookmarks", userId] });
    },
  });

  return {
    setBookmarksVisibility: setBookmarksVisibility.mutate,
  };
}
