import { createFileRoute, Link } from "@tanstack/react-router";

import { generateCommonSEOTags } from "~/utils/seo-generator";
import { PageHeader } from "~/components/shared/PageHeader";

export const Route = createFileRoute("/terms/")({
	component: TermsPage,
	head: () => ({
		meta: [
			...generateCommonSEOTags({
				title: "Terms of Service | FOSDEM PWA",
				description:
					"Terms for using FOSDEM PWA, including account responsibilities and service limitations.",
			})
		],
	}),
});

function TermsPage() {
	return (
		<div className="min-h-screen">
			<div className="container max-w-3xl mx-auto px-4 py-12 lg:py-20">
				<PageHeader
					heading="Terms of Service"
					text="By using FOSDEM PWA, you agree to the terms below. If you do not agree, please do not use the app."
					className="mb-6"
				/>

				<div className="space-y-10">
					<section className="space-y-3">
						<h2 className="text-2xl font-semibold text-foreground">
							Service overview
						</h2>
						<p className="text-muted-foreground">
							FOSDEM PWA provides a schedule viewer, bookmarks, notes, and optional
							push notifications. The service uses publicly available FOSDEM data
							and is not affiliated with or endorsed by FOSDEM.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-2xl font-semibold text-foreground">
							Account and access
						</h2>
						<p className="text-muted-foreground">
							You can browse without signing in. If you sign in with GitHub, you
							are responsible for keeping your account access secure and for the
							content you store (such as bookmarks and notes).
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-2xl font-semibold text-foreground">
							User content
						</h2>
						<p className="text-muted-foreground">
							You retain ownership of your notes and bookmarks. You grant us a
							limited license to store and process that content solely to provide
							the sync and notification features.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-2xl font-semibold text-foreground">
							Acceptable use
						</h2>
						<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
							<li>Do not abuse the service or attempt to disrupt it.</li>
							<li>Do not attempt to access other users' data.</li>
							<li>Use the app in compliance with applicable laws.</li>
						</ul>
					</section>

					<section className="space-y-3">
						<h2 className="text-2xl font-semibold text-foreground">
							External links
						</h2>
						<p className="text-muted-foreground">
							The app may include links to third-party sites and resources. We do
							not control those sites and are not responsible for their content,
							policies, or availability. Access them at your own risk.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-2xl font-semibold text-foreground">
							Availability and changes
						</h2>
						<p className="text-muted-foreground">
							We may update or discontinue features at any time. Schedule data may
							be incomplete or outdated, and notifications are best-effort.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-2xl font-semibold text-foreground">
							Disclaimer
						</h2>
						<p className="text-muted-foreground">
							The service is provided "as is" without warranties of any kind. We
							are not liable for any damages arising from use of the app.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-2xl font-semibold text-foreground">
							Privacy
						</h2>
						<p className="text-muted-foreground">
							Please review the{" "}
							<Link to="/privacy" className="font-medium text-foreground hover:underline">
								Privacy Policy
							</Link>{" "}
							for details on how data is handled.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-2xl font-semibold text-foreground">Contact</h2>
						<p className="text-muted-foreground">
							For questions about these terms, open an issue on{" "}
							<a
								href="https://github.com/nicholasgriffintn/fosdem-pwa"
								target="_blank"
								rel="noreferrer"
								className="font-medium text-foreground hover:underline"
							>
								GitHub
							</a>
							.
						</p>
					</section>
				</div>
			</div>
		</div>
	);
}
