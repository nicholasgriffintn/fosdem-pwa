import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader } from "~/components/PageHeader";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { constants } from "~/constants";
import { useFosdemData } from "~/hooks/use-fosdem-data";
import { BookmarksList } from "~/components/Bookmarks/BookmarksList";
import { useAuth } from "~/hooks/use-auth";
import { Spinner } from "~/components/Spinner";

export const Route = createFileRoute("/bookmarks/")({
	component: BookmarksHome,
	validateSearch: ({ year, day }: { year: number; day?: string }) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
		day: day || undefined,
	}),
	loaderDeps: ({ search: { year, day } }) => ({ year, day }),
	loader: async ({ deps: { year, day } }) => {
		return {
			year,
			day,
		};
	},
	head: () => ({
		meta: [
			{
				title: "Bookmarks | FOSDEM PWA",
				description: "Bookmarks from FOSDEM",
			},
		],
	}),
});

function BookmarksHome() {
	const { year, day } = Route.useLoaderData();
	const { bookmarks, loading } = useBookmarks({ year });
	const { create, update } = useMutateBookmark({ year });
	const { fosdemData } = useFosdemData({ year });
	const { user, loading: authLoading } = useAuth();

	const onCreateBookmark = (bookmark: any) => {
		create({
			year,
			slug: bookmark.slug,
			type: bookmark.type,
			status: bookmark.status,
		});
	};

	const onUpdateBookmark = (bookmark: any) => {
		update(bookmark.id, { status: bookmark.status });
	};

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader heading="Bookmarks" year={year} />
				{authLoading || loading ? (
					<div className="flex justify-center items-center">
						<Spinner className="h-8 w-8" />
					</div>
				) : !bookmarks || bookmarks.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12">
						<p className="text-muted-foreground mb-4">
							No bookmarks yet. Start bookmarking events to see them here!
						</p>
						{!user?.id && (
							<div className="text-sm text-muted-foreground text-center space-y-2">
								<p>Your bookmarks are saved locally and will sync when you sign in.</p>
								<Link to="/signin" className="text-primary hover:underline">
									Sign in to sync across devices
								</Link>
							</div>
						)}
					</div>
				) : (
					<BookmarksList
						bookmarks={bookmarks}
						fosdemData={fosdemData}
						year={year}
						loading={loading}
						day={day}
						onUpdateBookmark={onUpdateBookmark}
						user={user}
						onCreateBookmark={onCreateBookmark}
					/>
				)}
			</div>
		</div>
	);
}
