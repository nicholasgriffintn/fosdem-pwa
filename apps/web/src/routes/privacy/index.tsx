import { createFileRoute, Link } from "@tanstack/react-router";

import { generateCommonSEOTags } from "~/utils/seo-generator";
import { PageHeader } from "~/components/shared/PageHeader";
import { PageShell } from "~/components/shared/PageShell";
import { SectionStack } from "~/components/shared/SectionStack";

export const Route = createFileRoute("/privacy/")({
	component: PrivacyPolicyPage,
	head: () => ({
		meta: [
			...generateCommonSEOTags({
				title: "Privacy Policy | FOSDEM PWA",
				description:
					"Learn how FOSDEM PWA stores data locally, syncs signed-in content, and handles error reporting.",
			}),
		],
	}),
});

function PrivacyPolicyPage() {
	return (
		<PageShell maxWidth="3xl">
			<PageHeader
				heading="Privacy Policy"
				text="This policy explains what FOSDEM PWA stores locally in your browser, what is stored on our servers when you sign in, and how we handle error reporting."
				className="mb-6"
			/>

			<SectionStack className="space-y-10">
				<section className="space-y-3">
					<h2 className="text-2xl font-semibold text-foreground">Summary</h2>
					<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
						<li>
							No third party analytics or advertising trackers are used, we
							do track some usage to provide better push notifications and
							the year in review feature.
						</li>
						<li>
							We store some data locally in your browser to make the app work
							offline and remember preferences.
						</li>
						<li>
							If you sign in, we store your account details, bookmarks, notes,
							and push notification subscriptions to sync across devices.
						</li>
						<li>
							We use the Sentry SDK (but with my own backend [Bit Wobbly](https://bitwobbly.com))
							for error reporting across services.
						</li>
					</ul>
				</section>

				<section className="space-y-3">
					<h2 className="text-2xl font-semibold text-foreground">
						Data stored in your browser
					</h2>
					<p className="text-muted-foreground">
						FOSDEM PWA uses cookies, localStorage and IndexedDB for sessions, offline features
						and faster access:
					</p>
					<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
						<li>
							Session data to keep you signed in if you choose to sign in
							(cookies), these include:
							<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
								<li>
									"[provider]_oauth_state" - The state used for OAuth authentication (only when used), replace [provider] with the provider name (e.g. github, discord, mastodon)
									<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
										<li>Note: For Mastodon, we also store "mastodon_code_verifier" and "mastodon_instance" cookies</li>
									</ul>
								</li>
								<li>"session" - An identifier to hold your signed in session</li>
							</ul>
						</li>
						<li>
							Our service provider, Cloudflare may also set cookies.{' '}
							<a href="https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/" target="_blank" rel="noreferrer" className="font-medium text-foreground hover:underline">Learn more about those here</a>.
							{' '}Note: We may not use any of these and will never use all of them.
						</li>
						<li>
							Theme preference, player state, and install prompt state
							(localStorage).
						</li>
						<li>
							Local bookmarks, notes, and the offline sync queue (IndexedDB).
						</li>
						<li>
							A service worker is registered to support offline behavior and
							updates. You can remove stored data by clearing site data in your
							browser.
						</li>
					</ul>
				</section>

				<section className="space-y-3">
					<h2 className="text-2xl font-semibold text-foreground">
						Data stored when you sign in
					</h2>
					<p className="text-muted-foreground">
						Signing in with GitHub enables sync across devices. We store:
					</p>
					<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
						<li>
							Account profile information from the provider you use to sign in (name, email,
							username, avatar, and optional profile fields).
						</li>
						<li>Your bookmarks, notes, and sync status.</li>
						<li>
							Push notification subscriptions (endpoint and keys) if you opt
							in.
						</li>
						<li>
							Session data in an HTTP-only cookie to keep you signed in.
						</li>
					</ul>
				</section>

				<section className="space-y-3">
					<h2 className="text-2xl font-semibold text-foreground">
						Push notifications
					</h2>
					<p className="text-muted-foreground">
						Push notifications are optional. If you subscribe, we store your
						subscription endpoint and keys and use them to deliver schedule
						notifications. You can unsubscribe at any time from your profile.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className="text-2xl font-semibold text-foreground">
						Error reporting (Sentry)
					</h2>
					<p className="text-muted-foreground">
						We use Sentry for error reporting in the data sync and push
						notification services. Sentry receives error logs and technical
						metadata such as request details, device/browser information, and
						IP address, which helps us diagnose issues. We do not use Sentry
						for analytics.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className="text-2xl font-semibold text-foreground">
						External services and proxies
					</h2>
					<p className="text-muted-foreground">
						FOSDEM PWA fetches schedule data from FOSDEM sources and may proxy
						some requests through our API for compatibility. This includes
						subtitle files for talks and room status data. Requests routed
						through these proxies may include your IP address and standard
						request metadata in server logs for security and reliability.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className="text-2xl font-semibold text-foreground">
						Your choices
					</h2>
					<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
						<li>Clear site data in your browser to remove local data.</li>
						<li>
							Disable push notifications by unsubscribing in your profile.
						</li>
						<li>
							Sign out to stop syncing data across devices. You can also delete
							bookmarks and notes from within the app.
						</li>
					</ul>
				</section>

				<section className="space-y-3">
					<h2 className="text-2xl font-semibold text-foreground">Contact</h2>
					<p className="text-muted-foreground">
						Questions? Open an issue on{" "}
						<a
							href="https://github.com/nicholasgriffintn/fosdem-pwa"
							target="_blank"
							rel="noreferrer"
							className="font-medium text-foreground hover:underline"
						>
							GitHub
						</a>
						{" "}or review the{" "}
						<Link to="/terms" className="font-medium text-foreground hover:underline">
							Terms of Service
						</Link>
						.
					</p>
				</section>
			</SectionStack>
		</PageShell>
	);
}
