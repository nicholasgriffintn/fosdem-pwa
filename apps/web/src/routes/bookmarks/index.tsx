import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader } from "~/components/PageHeader";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { constants } from "~/constants";
import { useFosdemData } from "~/hooks/use-fosdem-data";
import { BookmarksList } from "~/components/Bookmarks/BookmarksList";
import { useAuth } from "~/hooks/use-auth";
import { Spinner } from "~/components/Spinner";
import { EmptyStateCard } from "~/components/EmptyStateCard";
import { useIsClient } from "~/hooks/use-is-client";
import { getAllData } from "~/server/functions/fosdem";
import { useAuthSnapshot } from "~/contexts/AuthSnapshotContext";
import { getBookmarks } from "~/server/functions/bookmarks";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/bookmarks/")({
	component: BookmarksHome,
	validateSearch: ({
		year,
		day,
		view,
	}: {
		year: number;
		day?: string;
		view?: string;
	}) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
		day: day || undefined,
		view: view || undefined,
	}),
	loaderDeps: ({ search: { year, day } }) => ({ year, day }),
	loader: async ({ deps: { year, day } }) => {
		const fosdemData = await getAllData({ data: { year } });
		const serverBookmarks = await getBookmarks({
			data: { year, status: "favourited" },
		});
		return {
			year,
			day,
			serverBookmarks,
			fosdemData,
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
	const { year, day, serverBookmarks, fosdemData: serverFosdemData } =
		Route.useLoaderData();
	const { view } = Route.useSearch();
	const { bookmarks, loading } = useBookmarks({ year });
	const { create, update } = useMutateBookmark({ year });
	const { fosdemData } = useFosdemData({ year });
	const { user, loading: authLoading } = useAuth();
	const { user: serverUser } = useAuthSnapshot();
	const isClient = useIsClient();
	const hasServerSnapshot = Boolean(serverFosdemData);
	const useServerSnapshot =
		!isClient || loading || authLoading || !fosdemData || !bookmarks;
	const resolvedBookmarks = useServerSnapshot ? serverBookmarks : bookmarks;
	const resolvedLoading = useServerSnapshot ? false : loading;
	const resolvedAuthLoading = useServerSnapshot ? false : authLoading;
	const resolvedFosdemData = useServerSnapshot ? serverFosdemData : fosdemData;
	const resolvedUser = useServerSnapshot ? serverUser : user;

	const onCreateBookmark = async (bookmark: any) => {
		await create({
			year,
			slug: bookmark.slug,
			type: bookmark.type,
			status: bookmark.status,
		});
	};

	const onUpdateBookmark = (bookmark: any) => {
		update(bookmark.id, { status: bookmark.status }, bookmark.serverId);
	};

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader heading="Bookmarks" year={year} />
				{isClient && (authLoading || loading) && !hasServerSnapshot && (
					<div className="flex justify-center items-center py-8">
						<Spinner className="h-8 w-8" />
					</div>
				)}
				{!resolvedAuthLoading &&
				!resolvedLoading &&
				(!resolvedBookmarks || resolvedBookmarks.length === 0) ? (
					<EmptyStateCard
						title="No bookmarks yet"
						description={
							<div className="space-y-2">
								<p>Start bookmarking events to see them here.</p>
								{!resolvedUser?.id && (
									<p className="text-sm">
										If you have JavaScript enabled, your bookmarks will be
										saved locally in your browser.{" "} Sign in to sync across
										devices or to bookmark without JavaScript.
									</p>
								)}
							</div>
						}
						actions={
							!resolvedUser?.id ? (
								<Button asChild variant="secondary">
									<Link to="/signin" className="text-primary no-underline hover:underline cursor-pointer">
										Sign in
									</Link>
								</Button>
							) : undefined
						}
					/>
				) : (
					<BookmarksList
						bookmarks={resolvedBookmarks}
						fosdemData={resolvedFosdemData}
						year={year}
						loading={resolvedLoading}
						day={day}
						view={view}
						onUpdateBookmark={onUpdateBookmark}
						user={resolvedUser}
						onCreateBookmark={onCreateBookmark}
					/>
				)}
			</div>
		</div>
	);
}
