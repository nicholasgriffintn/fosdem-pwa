import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { NotFound } from "./components/NotFound";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
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

	const router = createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreload: false,
		defaultErrorComponent: DefaultCatchBoundary,
		defaultNotFoundComponent: NotFound,
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient,
	});

	return router;
}
