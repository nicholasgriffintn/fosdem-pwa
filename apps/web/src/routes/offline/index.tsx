import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";

import { PageHeader } from "~/components/PageHeader";
import { TypesList } from "~/components/Type/TypesList";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { useFosdemData } from "~/hooks/use-fosdem-data";
import { useAuth } from "~/hooks/use-auth";
import { BookmarksList } from "~/components/Bookmarks/BookmarksList";
import { Button } from "~/components/ui/button";
import type { Event, Track } from "~/types/fosdem";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { constants } from "~/constants";

export const Route = createFileRoute("/offline/")({
	component: OfflinePage,
	validateSearch: ({ year }: { year: number }) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
	}),
	head: () => ({
		meta: [
			{
				title: "Offline | FOSDEM PWA",
				description:
					"You're currently offline. Browse cached content and your local bookmarks.",
			},
		],
	}),
});

function OfflinePage() {
	const { year } = Route.useSearch();
	const [isOnline, setIsOnline] = useState(() => {
		if (typeof window === "undefined") {
			return true;
		}
		return window.navigator.onLine;
	});
	const { bookmarks, loading: bookmarksLoading } = useBookmarks({
		year,
		localOnly: !isOnline,
	});
	const { user } = useAuth();

	const currentPathname = typeof window !== "undefined" ? window.location.pathname : "";

	const cachedData = useFosdemData({ year });

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		setIsOnline(window.navigator.onLine);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	const handleRetry = useCallback(() => {
		if (typeof window !== "undefined") {
			window.location.reload();
		}
	}, []);

	const handleGoHome = useCallback(() => {
		if (typeof window !== "undefined") {
			window.location.href = `/?year=${year}`;
		}
	}, [year]);

	const getBookmarkDisplay = (bookmark: (typeof bookmarks)[number]) => {
		const isEvent =
			bookmark.type === "bookmark_event" || bookmark.type === "event";
		const cachedItem = isEvent
			? cachedData.fosdemData?.events?.[bookmark.slug]
			: cachedData.fosdemData?.tracks?.[bookmark.slug];

		let title: string;
		if (cachedItem) {
			if (isEvent) {
				title = (cachedItem as Event).title;
			} else {
				title = (cachedItem as Track).name;
			}
		} else {
			title = bookmark.slug;
		}

		const detail = cachedItem?.room
			? cachedItem.room
			: cachedData.fosdemData
				? "Not found in cached schedule"
				: `Slug: ${bookmark.slug}`;

		return {
			kindLabel: isEvent ? "Event" : "Track",
			title,
			detail,
			isEvent,
		};
	};

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader
					heading={isOnline ? "Connection Restored" : "You're Offline"}
					text={
						isOnline
							? "You're back online! Click below to refresh the page."
							: "Don't worry! You can still browse cached content and your local bookmarks."
					}
					year={year}
				/>

				<Card className="mb-6">
					<CardHeader>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<CardTitle className="flex items-center gap-2">
								Connection Status
								<Badge variant={isOnline ? "default" : "secondary"}>
									{isOnline ? "Online" : "Offline"}
								</Badge>
							</CardTitle>
							<div className="flex flex-col sm:flex-row gap-2">
								{currentPathname !== "/offline" && (
									<Button size="sm" onClick={handleRetry}>
										{isOnline ? "Refresh Page" : "Try Again"}
									</Button>
								)}
								<Button variant="outline" size="sm" onClick={handleGoHome}>
									Go to Homepage
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">
							{isOnline
								? "You're connected to the internet. Refresh the page to load the latest data."
								: "You're currently offline. The content below is from your browser's cache."}
						</p>
					</CardContent>
				</Card>

				{cachedData.fosdemData && (
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>FOSDEM {year} Schedule</CardTitle>
							<CardDescription>
								Browse the cached conference schedule
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{cachedData.fosdemData.types && (
									<TypesList types={cachedData.fosdemData.types} />
								)}
							</div>
						</CardContent>
					</Card>
				)}

				{!cachedData.fosdemData && (
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>No cached schedule yet</CardTitle>
							<CardDescription>
								Open the schedule while online to keep it available offline.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-sm text-muted-foreground">
								We couldn't find locally cached conference data for this year.
								Once you're online, visit the schedule to save it for offline
								use.
							</p>
							<Button variant="outline" size="sm" onClick={handleRetry}>
								Retry now
							</Button>
						</CardContent>
					</Card>
				)}

				<Card className="mb-6">
					<CardHeader>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="space-y-2">
								<CardTitle className="flex items-center gap-2">
									Your Bookmarks
									{!user?.id && <Badge variant="outline">Local Only</Badge>}
								</CardTitle>
								<CardDescription>
									{!user?.id
										? "Your bookmarks are saved locally on this device"
										: "Your bookmarked events and tracks"}
								</CardDescription>
							</div>
							<Button asChild variant="outline" size="sm">
								<Link
									to="/bookmarks"
									search={{ year, day: undefined, view: undefined }}
								>
									View all bookmarks
								</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{bookmarksLoading ? (
							<p className="text-muted-foreground">Loading bookmarks...</p>
						) : bookmarks && bookmarks.length > 0 ? (
							cachedData.fosdemData ? (
								<BookmarksList
									bookmarks={bookmarks}
									fosdemData={cachedData.fosdemData}
									year={year}
									loading={bookmarksLoading}
									defaultViewMode="list"
									showViewMode={false}
									showConflicts={false}
									user={user}
									emptyStateTitle="No cached bookmark details"
									emptyStateMessage="These bookmarks are saved, but their details are not in the cached schedule yet."
								/>
							) : (
								<div className="space-y-3">
									<p className="text-sm text-muted-foreground">
										Bookmark details are not in the cached schedule yet.
									</p>
									<div className="space-y-2">
										{bookmarks.map((bookmark) => {
											const display = getBookmarkDisplay(bookmark);
											return (
												<div
													key={bookmark.id}
													className="p-3 border rounded-lg bg-muted/50"
												>
													<div className="flex justify-between items-start gap-3">
														<div className="space-y-1">
															<p className="text-xs uppercase tracking-wide text-muted-foreground">
																{display.kindLabel}
															</p>
															<Link
																to={
																	display.isEvent
																		? "/event/$slug"
																		: "/track/$slug"
																}
																params={{ slug: bookmark.slug }}
																search={
																	display.isEvent
																		? { year, test: false }
																		: {
																				year,
																				day: undefined,
																				view: undefined,
																				sortFavourites: undefined,
																			}
																}
																className="font-medium no-underline hover:underline"
															>
																{display.title}
															</Link>
															<p className="text-sm text-muted-foreground">
																{display.detail}
															</p>
														</div>
														<Badge variant="outline">
															{bookmark.status}
														</Badge>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)
						) : (
							<div className="text-center py-8">
								<p className="text-muted-foreground mb-4">
									{!user?.id
										? "No bookmarks yet. When you're back online, you can bookmark events and tracks!"
										: "No bookmarks found"}
								</p>
								{!user?.id && (
									<Button
										variant="outline"
										onClick={() => {
											window.location.href = "/signin";
										}}
									>
										Sign in to sync bookmarks
									</Button>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
