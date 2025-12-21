import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { PageHeader } from "~/components/PageHeader";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { constants } from "~/constants";
import { useFosdemData } from "~/hooks/use-fosdem-data";
import { BookmarksList } from "~/components/Bookmarks/BookmarksList";
import { useAuth } from "~/hooks/use-auth";
import { Spinner } from "~/components/Spinner";
import { EmptyStateCard } from "~/components/EmptyStateCard";

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
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

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
				<noscript>
					<div className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-950 p-6 rounded-lg mb-6">
						<h2 className="font-semibold text-lg mb-3">JavaScript Required for Bookmarks</h2>
						<p className="text-sm mb-3">
							The bookmarks feature requires JavaScript to function properly.
						</p>
						<p className="text-sm text-muted-foreground mb-3">
							To use bookmarks, you need to:
						</p>
						<ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside mb-3">
							<li>Enable JavaScript in your browser settings</li>
							<li><a href="/signin" className="text-primary hover:underline">Sign in</a> to sync bookmarks across devices</li>
						</ol>
						<p className="text-sm">
							Without JavaScript, you can still browse the <a href="/" className="text-primary hover:underline font-medium">FOSDEM schedule</a>.
						</p>
					</div>
				</noscript>
				{isClient && (authLoading || loading) && (
					<div className="flex justify-center items-center py-8">
						<Spinner className="h-8 w-8" />
					</div>
				)}
				{!authLoading && !loading && (!bookmarks || bookmarks.length === 0) ? (
					<EmptyStateCard
						title="No bookmarks yet"
						description={
							<div className="space-y-2">
								<p>Start bookmarking events to see them here.</p>
								{!user?.id && (
									<p className="text-sm">
										Your bookmarks are saved locally and will sync when you sign
										in.
									</p>
								)}
							</div>
						}
						actions={
							!user?.id ? (
								<Link to="/signin" className="text-primary hover:underline">
									Sign in to sync across devices
								</Link>
							) : undefined
						}
					/>
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
