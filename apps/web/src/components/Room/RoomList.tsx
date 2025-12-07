import clsx from "clsx";
import { Link } from "@tanstack/react-router";

import type { RoomData } from "~/types/fosdem";
import { sortRooms } from "~/lib/sorting";
import { constants } from "../../constants";

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
	const className = clsx("flex justify-between", {
		"border-t-2 border-solid border-muted": index % 2 === 1,
		"border-b-2": index % 2 === 1 && !isLast,
	});

	return (
		<div className={className}>
			<div className="flex flex-col md:flex-row md:justify-between w-full">
				<div className="flex flex-col space-y-1.5 pt-3 pb-3 pl-1 pr-1">
					<Link
						to="/rooms/$roomId"
						params={{ roomId: room.slug }}
						search={(prev) => ({ year: prev.year || constants.DEFAULT_YEAR, day: undefined })}
					>
						<h3 className="font-semibold leading-none tracking-tight">
							{room.name}
						</h3>
					</Link>
					<p className="text-gray-500">
						Building {room.buildingId || room.building?.id} | {room.eventCount}{" "}
						events
					</p>
				</div>
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
								<h3 className="text-2xl font-bold text-foreground">
									Building {buildingId}
									<span className="text-sm font-normal text-muted-foreground ml-2">
										({buildingRooms.length} rooms)
									</span>
								</h3>
								<ul className="room-list w-full">
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
				<ul className="room-list w-full">
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
				<div className="text-muted-foreground">No rooms found</div>
			)}
		</section>
	);
}
