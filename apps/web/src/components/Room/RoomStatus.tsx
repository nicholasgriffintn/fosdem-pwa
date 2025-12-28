"use client";

import clsx from "clsx";

import { useRoomStatus } from "~/hooks/use-room-status";
import { LoadingState } from "~/components/shared/LoadingState";
import { RoomStatusTrend } from "./RoomStatusTrend";

type RoomStatusProps = {
	roomId: string;
	isRunning: boolean;
	className?: string;
};

export function RoomStatus({ roomId, isRunning, className }: RoomStatusProps) {
	const { data: status, isLoading } = useRoomStatus(roomId);

	const statusClassName = clsx(
		"inline-flex items-center px-4 py-2 rounded-full",
		{
			"bg-green-100 text-green-800": status?.state === "available",
			"bg-red-100 text-red-800": status?.state === "full",
			"bg-gray-100 text-gray-800": status?.state === "unknown" || isLoading,
		},
		className,
	);

	const isHallwayTrack =
		status?.state === "full" || status?.state === "unknown";

	return (
		<div>
			<h2 className="text-xl font-semibold mb-2 text-foreground">
				Room Status
			</h2>
			<div className="flex items-center gap-3">
				<div className={statusClassName}>
					<span className="capitalize">
						{isLoading ? (
							<LoadingState type="spinner" size="sm" variant="inline" />
						) : (
							status?.state || "Unknown"
						)}
					</span>
				</div>
				<RoomStatusTrend roomId={roomId} />
			</div>
			{!isRunning ? (
				<p className="text-sm text-muted-foreground mt-4">
					This room is not running right now. Please check back later.
				</p>
			) : isHallwayTrack ? (
				<p className="text-sm text-muted-foreground mt-4">
					Looks like this room likely doesn't have space right now. You can
					watch the stream as part of the hallway track instead. It's actually a
					really great place to have a few conversations.
				</p>
			) : null}
			{status?.lastUpdate && (
				<p className="text-sm text-muted-foreground mt-1">
					Last updated: {new Date(status.lastUpdate).toLocaleTimeString()}
				</p>
			)}
		</div>
	);
}
