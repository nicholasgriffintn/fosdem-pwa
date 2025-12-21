import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	Outlet,
	ScriptOnce,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

// @ts-expect-error I don't know why this is erroring, but it is, seems correct...
import appCss from "~/styles/app.css?url";
import { cn } from "~/lib/utils";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { Toaster } from "~/components/ui/toaster";
import { OfflineIndicator } from "~/components/OfflineIndicator";
import { ServiceWorkerUpdater } from "~/components/ServiceWorkerUpdater";
import { GuestBanner } from "~/components/GuestBanner";
import { AppNotice } from "~/components/AppNotice";
import { siteMeta } from "~/constants/site";

const TanStackRouterDevtools =
	process.env.NODE_ENV !== "development"
		? () => null
		: lazy(() =>
				import("@tanstack/react-router-devtools").then((res) => ({
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
					title: siteMeta.title,
					description: siteMeta.description,
				},
				{
					name: "theme-color",
					content: siteMeta.themeColor,
				},
				{
					property: "og:title",
					content: siteMeta.title,
				},
				{
					property: "og:description",
					content: siteMeta.description,
				},
				{
					property: "og:locale",
					content: siteMeta.locale,
				},
			],
			links: [
				{ rel: "stylesheet", href: appCss },
				{ rel: "manifest", href: "/manifest.webmanifest" },
			],
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
		<html lang="en">
			<head>
				<HeadContent />
				<ScriptOnce>
					{`(() => {
            const root = document.documentElement;
            const stored = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const shouldUseDark = stored === 'dark' || (!stored && prefersDark);
            root.classList.toggle('dark', shouldUseDark);
          })();`}
				</ScriptOnce>
			</head>
			<body
				className={cn(
					"min-h-screen bg-background font-sans antialiased",
					"--font-sans",
					"--font-heading",
				)}
			>
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
				>
					Skip to main content
				</a>
				<main id="main-content" className="flex min-h-screen flex-col">
					<Header />
					<AppNotice />
					<GuestBanner />
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
