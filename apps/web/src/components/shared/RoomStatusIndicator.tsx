import clsx from "clsx";
import type { RoomStatusBatchResult } from "~/server/functions/room-status";

type RoomStatusIndicatorProps = {
	state: RoomStatusBatchResult["state"];
	className?: string;
};

const roomStatusStyles: Record<RoomStatusBatchResult["state"], string> = {
	available: "bg-green-500",
	full: "bg-red-500",
	unknown: "bg-gray-400",
};

export function RoomStatusIndicator({
	state,
	className,
}: RoomStatusIndicatorProps) {
	return (
		<span
			className={clsx(
				"inline-flex h-2 w-2 rounded-full",
				roomStatusStyles[state],
				className,
			)}
			aria-label={`Room status: ${state}`}
			title={`Room status: ${state}`}
		/>
	);
}
