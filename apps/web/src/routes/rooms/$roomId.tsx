import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";

import { constants } from "~/constants";
import { EventList } from "~/components/Event/EventList";
import { RoomPlayer } from "~/components/Room/RoomPlayer";
import { RoomStatus } from "~/components/Room/RoomStatus";
import { getAllData } from "~/server/functions/fosdem";
import type { Conference, Event, RoomData } from "~/types/fosdem";
import { PageHeader } from "~/components/PageHeader";
import { createStandardDate } from "~/lib/dateTime";
import { useAuth } from "~/hooks/use-auth";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { EmptyStateCard } from "~/components/EmptyStateCard";

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
				(event: Event): event is Event => event.room === room.name,
			);
		}

		const days = Object.values(data.days);

		return {
			fosdem: { room, roomEvents, conference: data.conference, days },
			year,
			day,
		};
	},
	head: ({ loaderData }) => ({
		meta: [
			{
				title: `${loaderData?.fosdem.room?.name} | FOSDEM PWA`,
				description: `Events in ${loaderData?.fosdem.room?.name}`,
			},
		],
	}),
	staleTime: 10_000,
});

function RoomPage() {
	const { fosdem, day, year } = Route.useLoaderData();
	const { sortFavourites } = Route.useSearch();

	const { user } = useAuth();
	const { create: createBookmark } = useMutateBookmark({ year });
	const onCreateBookmark = async (bookmark: any) => {
		await createBookmark(bookmark);
	};

	const videoRef = useRef<HTMLVideoElement>(null);

	const roomEvents = fosdem.roomEvents;
	const roomInfo = fosdem.room;
	const conference = fosdem.conference;
	const days = fosdem.days;

	const now = createStandardDate(new Date());
	const isConferenceRunning =
		new Date(conference.start) < now && new Date(conference.end) > now;

	if (!roomInfo) {
		return (
			<div className="min-h-screen">
				<div className="relative py-6 lg:py-10">
					<EmptyStateCard
						title="Room not found"
						description="We couldn't find this room. It may have changed or the link is incorrect."
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
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
						{isConferenceRunning && (
							<div>
								<RoomStatus roomId={roomInfo.name} />
							</div>
						)}

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
						day={day}
						sortFavourites={sortFavourites}
						user={user}
						onCreateBookmark={onCreateBookmark}
						displaySortByFavourites={true}
					/>
				</div>
			</div>
		</div>
	);
}
