import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "~/components/shared/PageHeader";
import { FavouriteButton } from "~/components/shared/FavouriteButton";
import { ShareButton } from "~/components/shared/ShareButton";
import { testLiveEvent, testConferenceData } from "~/data/test-data";
import { getAllData } from "~/server/functions/fosdem";
import { EventMain } from "~/components/Event/EventMain";
import { constants } from "~/constants";
import { calculateEndTime } from "~/lib/dateTime";
import { useBookmark } from "~/hooks/use-bookmark";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { useIsClient } from "~/hooks/use-is-client";
import { getEventBookmark } from "~/server/functions/bookmarks";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { PageShell } from "~/components/shared/PageShell";

type BookmarkLike = {
	status?: string;
} | null;

export function resolveFavouriteStatus({
	bookmark,
	bookmarkLoading,
}: {
	bookmark: BookmarkLike;
	bookmarkLoading: boolean;
}) {
	const hasResolvedStatus = Boolean(bookmark?.status);

	if (bookmarkLoading && !hasResolvedStatus) {
		return "loading";
	}

	return bookmark?.status ?? "unfavourited";
}

export const Route = createFileRoute("/event/$slug")({
	component: EventPage,
	validateSearch: ({ test, year }: { test: boolean; year: string }) => ({
		test: test === true,
		year:
			(constants.AVAILABLE_YEARS.includes(Number(year)) && Number(year)) ||
			constants.DEFAULT_YEAR,
	}),
	loaderDeps: ({ search: { test, year } }) => ({ test, year }),
	loader: async ({ params, deps: { test, year } }) => {
		if (test) {
			return {
				fosdem: {
					event: testLiveEvent,
					conference: testConferenceData,
					track: {
						id: "radio",
						name: "Radio",
					},
					type: {
						id: "devroom",
						name: "Developer Room",
					},
				},
				year,
				isTest: true,
				serverBookmark: null,
			};
		}

		const fosdem = await getAllData({ data: { year } });

		let serverBookmark = null;
		try {
			serverBookmark = await getEventBookmark({
				data: { year, slug: params.slug },
			});
		} catch (error) {
			console.warn('Failed to load bookmark:', error);
		}

		return {
			fosdem: {
				event: fosdem.events[params.slug],
				conference: fosdem.conference,
				track: fosdem.tracks[fosdem.events[params.slug]?.trackKey],
				type: fosdem.types[
					fosdem.tracks[fosdem.events[params.slug]?.trackKey]?.type
				],
				persons: fosdem.persons,
			},
			year,
			isTest: false,
			serverBookmark,
		};
	},
	head: ({ loaderData }) => ({
		meta: [
			...generateCommonSEOTags({
				title: loaderData?.fosdem.event?.title || "Event at FOSDEM",
				description: loaderData?.fosdem.event?.description || loaderData?.fosdem.event?.abstract || `Event at FOSDEM ${loaderData?.year} in ${loaderData?.fosdem.event?.room}`,
			}),
			{
				property: "og:type",
				content: "article",
			},
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
		],
		scripts: loaderData?.fosdem.event ? [
			{
				type: "application/ld+json",
				children: JSON.stringify({
					"@context": "https://schema.org",
					"@type": "Event",
					"name": loaderData.fosdem.event.title,
					"description": loaderData.fosdem.event.description || loaderData.fosdem.event.abstract || "",
					"startDate": `${loaderData.fosdem.conference?.start}T${loaderData.fosdem.event.startTime}:00`,
					"endDate": `${loaderData.fosdem.conference?.start}T${loaderData.fosdem.event.startTime}:00`,
					"location": {
						"@type": "Place",
						"name": loaderData.fosdem.event.room,
					},
					"organizer": {
						"@type": "Organization",
						"name": "FOSDEM",
						"url": "https://fosdem.org",
					},
					"url": `https://fosdempwa.com/event/${loaderData.fosdem.event.id}?year=${loaderData.year}`,
					"attendee": loaderData.fosdem.event.persons?.map((person: string) => ({
						"@type": "Person",
						"name": person,
					})),
				}),
			},
		] : [],
	}),
	staleTime: 10_000,
});

function EventPage() {
	const { fosdem, year, isTest, serverBookmark } = Route.useLoaderData();
	const isClient = useIsClient();

	const { bookmark, loading: bookmarkLoading } = useBookmark({
		year,
		slug: fosdem?.event?.id,
	});
	const { create: createBookmark } = useMutateBookmark({ year });
	const onCreateBookmark = async (bookmark: any) => {
		await createBookmark(bookmark);
	};
	const favouriteStatus = isClient
		? resolveFavouriteStatus({
				bookmark,
				bookmarkLoading,
			})
		: serverBookmark?.status ?? "unfavourited";

	if (!fosdem.event?.title || !fosdem.conference) {
		return (
			<PageShell maxWidth="none">
				<PageHeader heading="Event not found" />
				<EmptyStateCard
					title="Whoops!"
					description="We couldn't find this event. It may have been removed or the link is incorrect."
				/>
			</PageShell>
		);
	}

	return (
		<PageShell maxWidth="none">
			<PageHeader
				heading={fosdem.event.title}
				year={year}
				breadcrumbs={[
					{ title: fosdem.type?.name, href: `/type/${fosdem.type?.id}` },
					{
						title: fosdem.track?.name,
						href: fosdem.track?.id
							? `/track/${encodeURIComponent(fosdem.track.id)}`
							: "#",
					},
				]}
				subtitle={fosdem.event.subtitle}
				metadata={[
					{
						text: `${fosdem.event.room}`,
						href: `/rooms/${fosdem.event.room}`,
					},
					{
						text: `Day ${fosdem.event.day}`,
					},
					{
						text: `${fosdem.event.startTime} - ${calculateEndTime(fosdem.event.startTime, fosdem.event.duration)}`,
					},
					{
						text: `Speakers: ${fosdem.event.persons?.join(", ")}`,
					},
				]}
			>
				<div className="flex items-center md:pl-6 md:pr-3 gap-2">
					<FavouriteButton
						year={year}
						type="event"
						slug={fosdem?.event?.id}
						status={favouriteStatus}
						onCreateBookmark={onCreateBookmark}
					/>
					<ShareButton
						title={fosdem?.event?.title}
						text={`Check out ${fosdem?.event?.title} at FOSDEM`}
						url={`https://fosdempwa.com/event/${fosdem?.event?.id}?year=${year}`}
					/>
				</div>
			</PageHeader>
			<div className="w-full">
				<EventMain
					event={fosdem.event}
					conference={fosdem.conference}
					year={year}
					isTest={isTest}
					persons={fosdem.persons}
				/>
			</div>
		</PageShell>
	);
}
