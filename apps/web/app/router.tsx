import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";

import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { NotFound } from "./components/NotFound";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			networkMode: "offlineFirst",
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: (failureCount, error) => {
				if (error instanceof Error && error.message === "Failed to fetch") {
					return false;
				}
				return failureCount < 1;
			},
		},
	},
});

const router = createTanStackRouter({
	routeTree,
	context: { queryClient },
	defaultPreload: false,
	defaultErrorComponent: DefaultCatchBoundary,
	defaultNotFoundComponent: NotFound,
});

export function createRouter() {
	return routerWithQueryClient(router, queryClient);
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createRouter>;
	}
}
