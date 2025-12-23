import { createFileRoute, Link, Navigate } from "@tanstack/react-router";

import { useAuth } from "~/hooks/use-auth";
import { PageHeader } from "~/components/shared/PageHeader";
import { SignInForm } from "~/components/Profile/SignInForm";
import { useIsClient } from "~/hooks/use-is-client";
import { buildHomeLink } from "~/lib/link-builder";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { PageShell } from "~/components/shared/PageShell";
import { RouteLoadingState } from "~/components/shared/RouteLoadingState";

export const Route = createFileRoute("/signin/")({
	component: SignInPage,
	head: () => ({
		meta: [
			...generateCommonSEOTags({
				title: "Sign In | FOSDEM PWA",
				description: "Sign in to FOSDEM PWA to sync bookmarks across devices and share your conference schedule.",
			})
		],
	}),
});

function SignInPage() {
	const { user, loading } = useAuth();
	const isClient = useIsClient();

	if (user?.id) {
		return (
			<Navigate
				{...buildHomeLink()}
			/>
		);
	}

	return (
		<PageShell maxWidth="2xl">
			<PageHeader heading="Sign in" className="mb-4" />
			{isClient && loading && (
				<RouteLoadingState message="Loading sign in..." />
			)}
			<div className="flex flex-col gap-8">
				<div className="space-y-6">
					<p className="text-lg text-muted-foreground">
						FOSDEM PWA works fully offline and locally. Signing in is optional
						and only enables syncing across devices and sharing your schedule.
					</p>
					<p className="text-sm text-muted-foreground">
						Continuing as a guest creates a device specific account that won't sync
						across devices, but it will still save bookmarks and notes if you
						need something more persistent or the device doesn't support
						JavaScript (although support for non JS interactions is limited).
					</p>
					<p className="text-sm text-muted-foreground">
						Read our{" "}
						<Link to="/privacy" className="font-medium text-foreground hover:underline">
							Privacy Policy
						</Link>{" "}
						and{" "}
						<Link to="/terms" className="font-medium text-foreground hover:underline">
							Terms of Service
						</Link>
						{' '}for more information.
					</p>
					<div className="space-y-3">
						<h2 className="text-lg font-semibold text-foreground">
							Signing in lets you:
						</h2>
						<ul className="space-y-2 text-muted-foreground">
							<li className="flex items-start gap-2">
								<span className="text-xl">🔖</span>
								<span>
									Create a personal schedule by bookmarking talks and events
									that you're interested in.
								</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-xl">📝</span>
								<span>
									Sync notes and bookmarks across multiple devices and store
									them for multiple years.
								</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-xl">🔗</span>
								<span>
									Share your schedule and discover others through profile
									pages.
								</span>
							</li>
						</ul>
					</div>
				</div>
				<div className="space-y-4">
					<SignInForm />
				</div>
			</div>
		</PageShell>
	);
}
