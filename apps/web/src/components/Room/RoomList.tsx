import { Link } from "@tanstack/react-router";

import type { RoomData } from "~/types/fosdem";
import { sortRooms } from "~/lib/sorting";
import { constants } from "~/constants";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";

type RoomListProps = {
	rooms: RoomData[];
	year: number;
	title?: string;
	groupByBuilding?: boolean;
};

type RoomListItemProps = {
	year: number;
	room: RoomData;
	index: number;
	isLast: boolean;
};

function RoomListItem({ year, room, index, isLast }: RoomListItemProps) {
	return (
		<div className="flex flex-col md:flex-row md:justify-between w-full py-3 px-2 sm:px-3">
			<div className="flex flex-col space-y-1.5">
				<Link
					to="/rooms/$roomId"
					params={{ roomId: room.slug }}
					search={{
						year: Number.isFinite(year) ? year : constants.DEFAULT_YEAR,
						day: undefined,
						sortFavourites: undefined,
					}}
					className="no-underline"
				>
					<div className="font-semibold leading-none tracking-tight">
						{room.name}
					</div>
				</Link>
				<p className="text-muted-foreground">
					Building {room.buildingId || room.building?.id} | {room.eventCount}{" "}
					events
				</p>
			</div>
		</div>
	);
}

export function RoomList({
	rooms,
	year,
	title,
	groupByBuilding = false,
}: RoomListProps) {
	if (groupByBuilding) {
		const roomsByBuilding = rooms.reduce(
			(acc, room) => {
				const buildingId = room.buildingId || room.building?.id || "Other";
				if (!acc[buildingId]) {
					acc[buildingId] = [];
				}
				acc[buildingId].push(room);
				return acc;
			},
			{} as Record<string, RoomData[]>,
		);

		const sortedBuildings = Object.keys(roomsByBuilding).sort((a, b) => {
			if (a === "Other") return 1;
			if (b === "Other") return -1;
			return a.localeCompare(b);
		});

		return (
			<section>
				{title && (
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold text-foreground">{title}</h2>
					</div>
				)}
				<div className="space-y-8">
					{sortedBuildings.map((buildingId) => {
						const buildingRooms = roomsByBuilding[buildingId].sort((a, b) =>
							a.name.localeCompare(b.name),
						);

						return (
							<div key={buildingId} className="space-y-2">
								<div className="text-2xl font-bold text-foreground">
									Building {buildingId}
									<span className="text-sm font-normal text-muted-foreground ml-2">
										({buildingRooms.length} rooms)
									</span>
								</div>
								<ul className="room-list w-full divide-y divide-border rounded-lg border border-border bg-card/40">
									{buildingRooms.map((room, index) => (
										<li key={room.slug}>
											<RoomListItem
												year={year}
												room={room}
												index={index}
												isLast={buildingRooms.length === index + 1}
											/>
										</li>
									))}
								</ul>
							</div>
						);
					})}
				</div>
			</section>
		);
	}

	const sortedRooms = rooms.sort(sortRooms);

	return (
		<section>
			{title && (
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold text-foreground">{title}</h2>
				</div>
			)}
			{sortedRooms?.length > 0 ? (
				<ul className="room-list w-full divide-y divide-border rounded-lg border border-border bg-card/40">
					{sortedRooms.map((room, index) => (
						<li key={room.slug}>
							<RoomListItem
								year={year}
								room={room}
								index={index}
								isLast={rooms.length === index + 1}
							/>
						</li>
					))}
				</ul>
			) : (
					<EmptyStateCard
						title="No rooms found"
						description="Try adjusting your filters or check back later for room updates."
						className="my-4"
					/>
			)}
		</section>
	);
}
