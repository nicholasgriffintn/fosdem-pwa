"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { checkAndSyncOnOnline } from "~/lib/backgroundSync";
import { enableSync } from "~/lib/localStorage";
import { buildHomeLink } from "~/lib/link-builder";
import { useSession } from "~/hooks/use-session";
import { sessionQueryKeys } from "~/lib/query-keys";

export function useAuth() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const { data: user, isLoading } = useSession();

	const logout = useMutation({
		mutationKey: ["logout"],
		mutationFn: async () => {
			await fetch("/api/auth/logout", { method: "POST" });
		},
		onSuccess: () => {
			queryClient.setQueryData(sessionQueryKeys.auth, null);
			navigate(buildHomeLink());
		},
	});

	useEffect(() => {
		if (!user?.id) return;

		let isMounted = true;
		let syncTimeout: NodeJS.Timeout | undefined;

		const invalidateBookmarkQueries = () => {
			queryClient.invalidateQueries({
				predicate: (query) => query.queryKey[0] === "bookmarks",
			});
			queryClient.invalidateQueries({
				predicate: (query) => query.queryKey[0] === "local-bookmarks",
			});
		};

		enableSync();
		checkAndSyncOnOnline(user.id).catch((error) => {
			if (isMounted) {
				console.error("Initial sync failed:", error);
			}
		}).then(() => {
			if (isMounted) {
				invalidateBookmarkQueries();
			}
		});

		if (typeof window === "undefined") {
			return;
		}

		const handleOnline = () => {
			if (syncTimeout) {
				clearTimeout(syncTimeout);
			}
			syncTimeout = setTimeout(() => {
				if (isMounted) {
					checkAndSyncOnOnline(user.id).catch((error) => {
						console.error("Online sync failed:", error);
					}).then(() => {
						if (isMounted) {
							invalidateBookmarkQueries();
						}
					});
				}
			}, 1000);
		};

		window.addEventListener("online", handleOnline);

		return () => {
			isMounted = false;
			if (syncTimeout) {
				clearTimeout(syncTimeout);
			}
			window.removeEventListener("online", handleOnline);
		};
	}, [user?.id, queryClient, navigate]);

	return {
		user,
		loading: isLoading,
		logout: logout.mutate,
	};
}
