import { createFileRoute, Navigate } from "@tanstack/react-router";

import { useProfile } from "~/hooks/use-user-me";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { PageHeader } from "~/components/PageHeader";
import { ConferenceBadge } from "~/components/ConferenceBadge";
import { Spinner } from "~/components/Spinner";
import { constants } from "~/constants";
import { useFosdemData } from "~/hooks/use-fosdem-data";
import { BookmarksList } from "~/components/Bookmarks/BookmarksList";
import { SetBookmarksVisability } from "~/components/SetBookmarksVisability";

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
	const { fosdemData } = useFosdemData({ year });

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/" search={{ year }} />;
	}

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader heading="Profile" displayHeading={false} />
				<div className="space-y-8">
					<div className="flex flex-col lg:flex-row items-start gap-8">
						<div className="w-full lg:w-auto lg:max-w-md">
							<ConferenceBadge user={user} conferenceYear={year} />
						</div>

						<div className="w-full lg:flex-1 space-y-8">
							<div className="space-y-4">
								<h2 className="text-2xl font-bold">Your Bookmarks</h2>
								{user?.github_username && (
									<SetBookmarksVisability
										year={year}
										userId={user.github_username}
										bookmarksVisibility={user.bookmarks_visibility}
									/>
								)}
								<BookmarksList
									bookmarks={bookmarks}
									fosdemData={fosdemData}
									year={year}
									loading={bookmarksLoading}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
