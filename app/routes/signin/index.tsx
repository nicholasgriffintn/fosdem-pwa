import { createFileRoute, Navigate } from "@tanstack/react-router";

import { useAuth } from "~/hooks/use-auth";
import { PageHeader } from "~/components/PageHeader";
import { Spinner } from "~/components/Spinner";
import { SignInForm } from "~/components/SignInForm";

export const Route = createFileRoute("/signin/")({
	component: SignInPage,
	head: () => ({
		meta: [
			{
				title: "Sign In | FOSDEM PWA",
				description: "Sign in to FOSDEM PWA",
			},
		],
	}),
});

function SignInPage() {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (user?.id) {
		return (
			<Navigate
				to="/"
				search={{
					year: 2025,
				}}
			/>
		);
	}

	return (
		<div className="min-h-screen">
			<div className="container max-w-2xl mx-auto px-4 py-12 lg:py-20">
				<PageHeader heading="Sign in" className="mb-4" />
				<div className="flex flex-col gap-8">
					<div className="space-y-6">
						<p className="text-lg text-slate-200">
							Connect with your GitHub account to unlock personalized features
							that enhance your experience.
						</p>
						<div className="space-y-3">
							<h2 className="text-lg font-semibold text-slate-100">
								What you'll be able to do:
							</h2>
							<ul className="space-y-2 text-slate-200">
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
										Take notes during sessions to capture key insights and
										ideas.
									</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-xl">🔗</span>
									<span>
										Share your curated schedule and discover others through
										profile pages.
									</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="text-xl">🔍</span>
									<span>
										Get personalized recommendations based on your bookmarks
										(coming soon).
									</span>
								</li>
							</ul>
						</div>
					</div>
					<div className="space-y-4">
						<SignInForm />
						<p className="text-sm text-slate-400 text-center max-w-md mx-auto">
							This will request read only access to your GitHub profile and
							email only. We will use this to create your account and to send
							notifications (if you want them).
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
