import { brand } from "@roomisfull/conference/brand";
import { HeadContent, Outlet, Scripts } from "@tanstack/react-router";

import { CanonicalMetadata } from "~/components/shared/CanonicalMetadata";
import { Icons } from "~/components/shared/Icons";
import { ThemeScript } from "~/components/shared/ThemeScript";
import appCss from "~/styles/app.css?url";

export function DirectoryDocument() {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>{brand.name} · Conferences</title>
				<meta name="description" content={brand.description} />
				<meta name="theme-color" content={brand.themeColor} />
				<meta property="og:title" content={brand.name} />
				<meta property="og:description" content={brand.description} />
				<meta property="og:type" content="website" />
				<meta property="og:image" content={`${brand.appUrl}/og-image.png`} />
				<meta name="twitter:card" content="summary_large_image" />
				<link rel="icon" href="/favicon.ico" />
				<link rel="stylesheet" href={appCss} />
				<ThemeScript />
				<HeadContent />
				<CanonicalMetadata />
			</head>
			<body className="min-h-screen bg-background font-sans antialiased">
				<div className="flex min-h-screen flex-col">
					<header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
						<div className="container flex h-14 items-center justify-between gap-3">
							<a
								href="/"
								className="flex items-center gap-2 logo-link shrink-0"
							>
								<Icons.logo className="h-7 w-7" width="28" height="28" />
								<span className="font-bold leading-none">{brand.name}</span>
							</a>
						</div>
					</header>
					<main id="main-content" className="container flex-1">
						<Outlet />
					</main>
					<footer className="border-t">
						<div className="container py-6 text-sm text-muted-foreground">
							<a
								href={brand.repository}
								className="font-medium hover:underline"
							>
								Source Code
							</a>
						</div>
					</footer>
				</div>
				<Scripts />
			</body>
		</html>
	);
}
