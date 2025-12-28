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

		enableSync();
		checkAndSyncOnOnline(user.id).catch((error) => {
			if (isMounted) {
				console.error("Initial sync failed:", error);
			}
		});

		if (typeof window === "undefined") {
			return;
		}

		const handleOnline = () => {
			if (isMounted) {
				checkAndSyncOnOnline(user.id).catch((error) => {
					console.error("Online sync failed:", error);
				});
			}
		};

		window.addEventListener("online", handleOnline);

		return () => {
			isMounted = false;
			window.removeEventListener("online", handleOnline);
		};
	}, [user?.id]);

	return {
		user,
		loading: isLoading,
		logout: logout.mutate,
	};
}
