"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/start";

import { getSession } from "~/server/functions/session";

export function useAuth() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const useGetSessionData = useServerFn(getSession);

	const { data: user, isLoading } = useQuery({
		queryKey: ["auth"],
		queryFn: async () => {
			const user = await useGetSessionData();

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
			navigate({ to: "/", search: { year: 2025 } });
		},
	});

	return {
		user,
		loading: isLoading,
		logout: logout.mutate,
	};
}
