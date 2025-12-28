"use client";

import { useSession } from "~/hooks/use-session";

export function useProfile() {
	const { data: user, isLoading } = useSession();

	return {
		user,
		loading: isLoading,
	};
}
