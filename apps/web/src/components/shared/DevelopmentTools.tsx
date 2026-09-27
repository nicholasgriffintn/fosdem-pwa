import { lazy, Suspense } from "react";

const ReactQueryDevtools =
	!import.meta.env.DEV || import.meta.env.MODE !== "development"
		? () => null
		: lazy(() =>
				import("@tanstack/react-query-devtools").then((res) => ({
					default: res.ReactQueryDevtools,
				})),
			);

const TanStackRouterDevtools =
	!import.meta.env.DEV || import.meta.env.MODE !== "development"
		? () => null
		: lazy(() =>
				import("@tanstack/react-router-devtools").then((res) => ({
					default: res.TanStackRouterDevtools,
				})),
			);

export function DevelopmentTools() {
	return (
		<Suspense fallback={null}>
			<ReactQueryDevtools buttonPosition="bottom-left" />
			<TanStackRouterDevtools position="bottom-right" />
		</Suspense>
	);
}
