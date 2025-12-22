"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";

import { getSession } from "~/server/functions/session";
import { checkAndSyncOnOnline } from "~/lib/backgroundSync";
import { enableSync } from "~/lib/localStorage";
import { buildHomeLink } from "~/lib/link-builder";

export function useAuth() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const getSessionDataFromServer = useServerFn(getSession);

	const { data: user, isLoading } = useQuery({
		queryKey: ["auth"],
		queryFn: async () => {
			const user = await getSessionDataFromServer();

			if (!user) {
				return {};
			}

			return user;
		},
	});

	const logout = useMutation({
		mutationKey: ["logout"],
		mutationFn: async () => {
			await fetch("/api/auth/logout", { method: "POST" });
		},
		onSuccess: () => {
			queryClient.setQueryData(["auth"], null);
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
