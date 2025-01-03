import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	Outlet,
	ScriptOnce,
	ScrollRestoration,
} from "@tanstack/react-router";
import { Meta, Scripts } from "@tanstack/start";
import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import appCss from "~/styles/app.css?url";
import { cn } from "~/lib/utils";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { Toaster } from "~/components/ui/toaster";
import { OfflineIndicator } from "~/components/OfflineIndicator";
import { ServiceWorkerUpdater } from "~/components/ServiceWorkerUpdater";

const TanStackRouterDevtools =
	process.env.NODE_ENV === "production"
		? () => null
		: lazy(() =>
				import("@tanstack/router-devtools").then((res) => ({
					default: res.TanStackRouterDevtools,
				})),
			);

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
	{
		head: () => ({
			meta: [
				{
					charSet: "utf-8",
				},
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				{
					title: "FOSDEM PWA",
					description: "A companion app for FOSDEM conference",
				},
			],
			links: [{ rel: "stylesheet", href: appCss }],
		}),
		component: RootComponent,
	},
);

function RootComponent() {
	const { queryClient } = Route.useRouteContext();

	return (
		<QueryClientProvider client={queryClient}>
			<RootDocument>
				<Outlet />
			</RootDocument>
		</QueryClientProvider>
	);
}

function RootDocument({ children }: { readonly children: React.ReactNode }) {
	return (
		<html className="dark" lang="en">
			<head>
				<Meta />
				<link rel="manifest" href="/manifest.webmanifest" />
			</head>
			<body
				className={cn(
					"min-h-screen bg-background font-sans antialiased",
					"--font-sans",
					"--font-heading",
				)}
			>
				<main className="flex min-h-screen flex-col">
					<Header />
					<div className="container flex-1">
						{children}
						<Toaster />
					</div>
					<Footer />
					<ReactQueryDevtools buttonPosition="bottom-left" />
					<Suspense>
						<TanStackRouterDevtools position="bottom-right" />
					</Suspense>
					<OfflineIndicator />
					<ServiceWorkerUpdater />
				</main>
				<ScrollRestoration />

				<ScriptOnce>
					{`document.documentElement.classList.toggle(
            'dark',
            localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
            )`}
				</ScriptOnce>

				<ScriptOnce>
					{`(async () => {
              if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/sw.js');
                
                registration.addEventListener('updatefound', () => {
                  const newWorker = registration.installing;
                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      dispatchEvent(new CustomEvent('swUpdated'));
                    }
                  });
                });
              }
            })();`}
				</ScriptOnce>

				<Scripts />
			</body>
		</html>
	);
}
