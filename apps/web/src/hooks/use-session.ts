"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getSession } from "~/server/functions/session";
import { sessionQueryKeys } from "~/lib/query-keys";

export function useSession() {
	const getSessionDataFromServer = useServerFn(getSession);

	return useQuery({
		queryKey: sessionQueryKeys.auth,
		queryFn: async () => {
			const user = await getSessionDataFromServer();
			return user ?? null;
		},
	});
}
