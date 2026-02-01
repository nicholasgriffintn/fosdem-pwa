import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";

import { constants } from "~/constants";
import { EventList } from "~/components/Event/EventList";
import { RoomPlayer } from "~/components/Room/RoomPlayer";
import { RoomStatus } from "~/components/Room/RoomStatus";
import { getAllData } from "~/server/functions/fosdem";
import type { Conference, Event, RoomData } from "~/types/fosdem";
import { PageHeader } from "~/components/shared/PageHeader";
import { createStandardDate } from "~/lib/dateTime";
import { useAuth } from "~/hooks/use-auth";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { getBookmarks } from "~/server/functions/bookmarks";
import { isEvent } from "~/lib/type-guards";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { PageShell } from "~/components/shared/PageShell";
import { resolveTodayDayId } from "~/lib/dateTime";

export const Route = createFileRoute("/rooms/$roomId")({
	component: RoomPage,
	validateSearch: ({ year, day, sortFavourites }: { year: number; day?: string; sortFavourites?: string }) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
		day: day || undefined,
		sortFavourites: sortFavourites || undefined,
	}),
	loaderDeps: ({ search: { year, day, sortFavourites } }) => ({ year, day, sortFavourites }),
	loader: async ({ params, deps: { year, day } }) => {
		const data = (await getAllData({ data: { year } })) as Conference;

		let room: RoomData | undefined;
		if (data.rooms[params.roomId]) {
			room = data.rooms[params.roomId];
		} else {
			const roomBySlug = Object.values(data.rooms).find(
				(room) => room.slug === params.roomId,
			);
			if (roomBySlug) {
				room = roomBySlug;
			}
		}

		let roomEvents: Event[] = [];
		if (room?.name) {
			roomEvents = Object.values(data.events).filter(
				(event): event is Event => isEvent(event) && event.room === room.name,
			);
		}

		const days = Object.values(data.days);

		const serverBookmarks = await getBookmarks({
			data: { year, status: "favourited" },
		});

		return {
			fosdem: { room, roomEvents, conference: data.conference, days },
			year,
			day,
			serverBookmarks,
		};
	},
	head: ({ loaderData }) => ({
		meta: [
			...generateCommonSEOTags({
				title: `${loaderData?.fosdem.room?.name} | Room | FOSDEM ${loaderData?.year}`,
				description: `Events in ${loaderData?.fosdem.room?.name} at FOSDEM ${loaderData?.year}. Building ${loaderData?.fosdem.room?.buildingId || loaderData?.fosdem.room?.building?.id}.`,
			})
		],
	}),
	staleTime: 1000 * 60 * 5, // 5 minutes
});

function RoomPage() {
	const { fosdem, day, year, serverBookmarks } = Route.useLoaderData();
	const { sortFavourites } = Route.useSearch();
	const navigate = Route.useNavigate();
	const resolvedDay = day ?? resolveTodayDayId(fosdem?.days);

	const { user } = useAuth();
	const { create: createBookmark } = useMutateBookmark({ year });
	const onCreateBookmark = async (bookmark: any) => {
		await createBookmark(bookmark);
	};
	const handleSortFavouritesChange = (checked: boolean) => {
		navigate({
			search: (prev) => ({
				...prev,
				sortFavourites: checked ? "true" : undefined,
			}),
		});
	};

	const videoRef = useRef<HTMLVideoElement>(null);

	const roomEvents = fosdem.roomEvents;
	const roomInfo = fosdem.room;
	const conference = fosdem.conference;
	const days = fosdem.days;

	const now = createStandardDate(new Date());
	const conferenceStart = createStandardDate(conference.start);
	const conferenceEnd = createStandardDate(conference.end);
	conferenceEnd.setHours(23, 59, 59, 999);
	const isConferenceRunning =
		now >= conferenceStart && now <= conferenceEnd;

	if (!roomInfo) {
		return (
			<PageShell>
				<PageHeader heading="Room not found" />
				<EmptyStateCard
					title="Whoops!"
					description="We couldn't find this room. It may have changed or the link is incorrect."
				/>
			</PageShell>
		);
	}

	return (
		<PageShell>
			<PageHeader
				heading={`Room ${roomInfo.name || roomInfo.slug}`}
				metadata={[
					{
						text: `Building ${roomInfo.buildingId || roomInfo.building?.id}`,
					},
					{
						text: `${roomInfo.eventCount} events`,
					},
				]}
				breadcrumbs={[{ title: "Rooms", href: "/rooms" }]}
				year={year}
			/>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<div className="md:col-span-2">
					<RoomPlayer roomId={roomInfo.slug} videoRef={videoRef} />
				</div>

				<div className="space-y-6">
					<div>
						<RoomStatus roomId={roomInfo.name} isRunning={isConferenceRunning} />
					</div>

					<div>
						<h2 className="text-xl font-semibold mb-2 text-foreground">
							Quick Links
						</h2>
						<div className="flex flex-col space-y-2">
							<a
								href={constants.CHAT_LINK.replace(
									"${ROOM_ID}",
									roomInfo.slug,
								)}
								target="_blank"
								rel="noopener noreferrer"
							>
								Join Chat
							</a>
							<a
								href={constants.NAVIGATE_TO_LOCATION_LINK.replace(
									"${LOCATION_ID}",
									roomInfo.slug,
								)}
								target="_blank"
								rel="noopener noreferrer"
							>
								Navigate to Room
							</a>
						</div>
					</div>
				</div>
			</div>

			<div>
				<EventList
					events={roomEvents}
					year={year}
					title={`Events in ${roomInfo?.name || roomInfo.slug}`}
					defaultViewMode="list"
					displayViewMode={false}
					groupByDay={true}
					days={days}
					day={resolvedDay}
					sortFavourites={sortFavourites}
					onSortFavouritesChange={handleSortFavouritesChange}
					user={user}
					onCreateBookmark={onCreateBookmark}
					displaySortByFavourites={true}
					serverBookmarks={serverBookmarks}
				/>
			</div>
		</PageShell>
	);
}
