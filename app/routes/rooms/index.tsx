import { createFileRoute } from "@tanstack/react-router";

import { getAllData } from "~/server/functions/fosdem";
import type { Conference } from "~/types/fosdem";
import { constants } from "~/constants";
import { PageHeader } from "~/components/PageHeader";
import { RoomList } from "~/components/Room/RoomList";

export const Route = createFileRoute("/rooms/")({
	component: RoomsPage,
	validateSearch: ({ year, day }: { year: number; day: string }) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
		day: day || null,
	}),
	loaderDeps: ({ search: { year, day } }) => ({ year, day }),
	loader: async ({ deps: { year, day } }) => {
		const data = (await getAllData({ data: { year } })) as Conference;
		const rooms = data.rooms;

		return { fosdem: { rooms }, year, day };
	},
	head: () => ({
		meta: [
			{
				title: "Rooms | FOSDEM PWA",
				description: "All rooms at FOSDEM",
			},
		],
	}),
	staleTime: 10_000,
});

function RoomsPage() {
	const { fosdem, year } = Route.useLoaderData();
	const roomKeys = fosdem.rooms ? Object.keys(fosdem.rooms) : [];
	const rooms = roomKeys.map((room) => ({
		...fosdem.rooms[room],
		id: room,
	}));

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader heading="Rooms" year={year} />
				<div className="mt-6">
					<RoomList rooms={rooms} year={year} groupByBuilding />
				</div>
			</div>
		</div>
	);
}
