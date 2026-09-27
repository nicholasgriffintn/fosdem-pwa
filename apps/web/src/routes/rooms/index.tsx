import { brand, conferenceConfig } from "@roomisfull/conference";
import { createFileRoute } from "@tanstack/react-router";

import { getAllData } from "~/server/functions/schedule";
import type { Conference } from "~/types/conference";
import { constants } from "~/constants";
import { PageHeader } from "~/components/shared/PageHeader";
import { RoomList } from "~/components/Room/RoomList";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { PageShell } from "~/components/shared/PageShell";

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

		return { schedule: { rooms }, year, day };
	},
	head: () => ({
		meta: [
			...generateCommonSEOTags({
				title: `Rooms | ${brand.name}`,
				description: `All rooms and venues at ${conferenceConfig.name} conference. Browse events by room and location.`,
			}),
		],
	}),
	staleTime: 1000 * 60 * 5, // 5 minutes
});

function RoomsPage() {
	const { schedule, year } = Route.useLoaderData();
	const roomKeys = schedule.rooms ? Object.keys(schedule.rooms) : [];
	const rooms = roomKeys.map((room) => ({
		...schedule.rooms[room],
		id: room,
	}));

	return (
		<PageShell>
			<PageHeader heading="Rooms" year={year} />
			<RoomList rooms={rooms} year={year} groupByBuilding />
		</PageShell>
	);
}
