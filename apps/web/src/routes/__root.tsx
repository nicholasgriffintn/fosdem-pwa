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
import { AuthSnapshotProvider } from "~/contexts/AuthSnapshotContext";
// import { AppNotice } from "~/components/AppNotice";
import { siteMeta } from "~/constants/site";
import { PlayerProvider } from "~/contexts/PlayerContext";
import { FloatingPlayer } from "~/components/FloatingPlayer";
import { VideoPortal } from "~/components/VideoPlayer/VideoPortal";
import { getSession } from "~/server/functions/session";
import { generateCommonSEOTags } from "~/utils/seo-generator";

const TanStackRouterDevtools =
	process.env.NODE_ENV !== "development"
		? () => null
		: lazy(() =>
			import("@tanstack/react-router-devtools").then((res) => ({
				default: res.TanStackRouterDevtools,
			}))
		);

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			...generateCommonSEOTags({
				title: siteMeta.title,
				description: siteMeta.description,
			}),
			{
				name: "theme-color",
				content: siteMeta.themeColor,
			},
			{
				property: "og:locale",
				content: siteMeta.locale,
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:site_name",
				content: siteMeta.title,
			},
			{
				property: "og:image",
				content: "/og-image.png",
			},
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "manifest", href: "/manifest.webmanifest" },
			{ rel: "icon", href: "/favicon.ico" },
			{ rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
		],
	}),
	loader: async () => {
		const user = await getSession();
		return { user };
	},
	component: RootComponent,
});

function RootComponent() {
	const { queryClient } = Route.useRouteContext();
	const { user } = Route.useLoaderData();

	return (
		<QueryClientProvider client={queryClient}>
			<PlayerProvider>
				<AuthSnapshotProvider user={user ?? null}>
					<RootDocument>
						<Outlet />
					</RootDocument>
				</AuthSnapshotProvider>
			</PlayerProvider>
		</QueryClientProvider>
	);
}

function RootDocument({ children }: { readonly children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
				<ScriptOnce>
					{`(() => {
            const root = document.documentElement;
            const stored = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const shouldUseDark = stored === 'dark' || (!stored && prefersDark);
            root.classList.toggle('dark', shouldUseDark);
            root.classList.add('js-enabled');
          })();`}
				</ScriptOnce>
			</head>
			<body
				className={cn(
					"min-h-screen bg-background font-sans antialiased",
					"--font-sans",
					"--font-heading"
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
					{/* <AppNotice /> */}
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
					<FloatingPlayer />
					<VideoPortal />
				</main>

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
