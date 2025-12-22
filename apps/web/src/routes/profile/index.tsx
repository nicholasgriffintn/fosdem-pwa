import { createFileRoute, Navigate } from "@tanstack/react-router";

import { useProfile } from "~/hooks/use-user-me";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { PageHeader } from "~/components/PageHeader";
import { ConferenceBadge } from "~/components/ConferenceBadge";
import { Spinner } from "~/components/Spinner";
import { constants } from "~/constants";
import { useFosdemData } from "~/hooks/use-fosdem-data";
import { BookmarksList } from "~/components/Bookmarks/BookmarksList";
import { SetBookmarksVisability } from "~/components/SetBookmarksVisability";
import { PushNotifications } from "~/components/PushNotifications";
import { buildHomeLink } from "~/lib/link-builder";

export const Route = createFileRoute("/profile/")({
	component: ProfilePage,
	head: () => ({
		meta: [
			{
				title: "Profile | FOSDEM PWA",
				description: "Profile page",
			},
		],
	}),
	validateSearch: ({ year }: { year: number }) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
	}),
	loaderDeps: ({ search: { year } }) => ({ year }),
	loader: async ({ deps: { year } }) => {
		return {
			year,
		};
	},
});

function ProfilePage() {
	const { year } = Route.useLoaderData();
	const { user, loading } = useProfile();
	const { bookmarks, loading: bookmarksLoading } = useBookmarks({ year });
	const { create: createBookmark } = useMutateBookmark({ year });
	const { fosdemData } = useFosdemData({ year });

	const onCreateBookmark = async (bookmark: any) => {
		await createBookmark(bookmark);
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (!user) {
		return (
			<Navigate
				{...buildHomeLink()}
			/>
		);
	}

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader heading="Profile" displayHeading={false} year={year} />
				<noscript>
					<div className="container py-6">
						<div className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-950 p-6 rounded-lg mb-6">
							<h2 className="font-semibold text-lg mb-3">JavaScript Required for Profile</h2>
							<p className="text-sm mb-3">
								Your profile page requires JavaScript to display your conference badge, bookmarks, and settings.
							</p>
							<p className="text-sm text-muted-foreground mb-3">
								Profile features that require JavaScript:
							</p>
							<ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside mb-3">
								<li>Conference badge display</li>
								<li>Viewing and managing bookmarks</li>
								<li>Push notification settings</li>
								<li>Profile visibility settings</li>
							</ul>
							<p className="text-sm">
								Please enable JavaScript or <a href="/" className="text-primary hover:underline font-medium">return to the homepage</a>.
							</p>
						</div>
					</div>
				</noscript>
				<div className="space-y-8">
					<div className="flex flex-col lg:flex-row items-start gap-8">
						<div className="w-full lg:w-auto lg:max-w-md">
							<ConferenceBadge user={user} conferenceYear={year} />
						</div>

						<div className="w-full lg:flex-1 space-y-8">
							<PushNotifications />
							<div className="space-y-4">
								<h2 className="text-2xl font-bold text-foreground">
									Your Bookmarks
								</h2>
								{user?.github_username && (
									<SetBookmarksVisability
										userId={user.github_username}
										bookmarksVisibility={user.bookmarks_visibility}
									/>
								)}
								<BookmarksList
									bookmarks={bookmarks}
									fosdemData={fosdemData}
									year={year}
									loading={bookmarksLoading}
									showConflicts={true}
									defaultViewMode="schedule"
									showViewMode={false}
									user={user}
									onCreateBookmark={onCreateBookmark}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
