import { constants } from "~/constants";
import { Icons } from "~/components/shared/Icons";
import {
	isEventFinished,
	createStandardDate,
	getEventDateTime,
} from "~/lib/dateTime";
import type { Event, ConferenceData } from "~/types/fosdem";

const startTimeFormatter = new Intl.DateTimeFormat("en-GB", {
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
	timeZone: constants.TIME_ZONE,
});

export function EventPlayerNotStarted({
	event,
	conference,
	referenceTime,
}: {
	event: Event;
	conference: ConferenceData;
	referenceTime?: Date;
}) {
	const eventIsInPast = referenceTime
		? isEventFinished(event, conference, referenceTime)
		: false;

	const eventStart = getEventDateTime(event, conference);
	const now = referenceTime
		? createStandardDate(referenceTime)
		: createStandardDate(new Date());

	const timeUntilStartMs =
		eventStart != null
			? Math.max(0, eventStart.getTime() - now.getTime())
			: null;

	const timeUntilStartLabel =
		timeUntilStartMs == null
			? null
			: (() => {
					const totalMinutes = Math.round(timeUntilStartMs / (1000 * 60));
					const minutesPerDay = 60 * 24;
					if (totalMinutes >= minutesPerDay) {
						const days = Math.floor(totalMinutes / minutesPerDay);
						const remainingHours = Math.round(
							(totalMinutes % minutesPerDay) / 60,
						);
						return remainingHours > 0
							? `${days} ${days === 1 ? "day" : "days"} ${remainingHours} ${
									remainingHours === 1 ? "hour" : "hours"
								}`
							: `${days} ${days === 1 ? "day" : "days"}`;
					}
					if (totalMinutes >= 60) {
						const hours = Math.floor(totalMinutes / 60);
						const minutes = totalMinutes % 60;
						return minutes > 0
							? `${hours} ${hours === 1 ? "hour" : "hours"} ${minutes} ${
									minutes === 1 ? "minute" : "minutes"
								}`
							: `${hours} ${hours === 1 ? "hour" : "hours"}`;
					}
					return `${totalMinutes} ${totalMinutes === 1 ? "minute" : "minutes"}`;
				})();
	const startTimeLabel = eventStart
		? startTimeFormatter.format(eventStart)
		: event.startTime;

	return (
		<div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 transition-colors">
			<div className="p-4 md:p-6 mx-2 relative bg-muted rounded-md shadow">
				{eventIsInPast ? (
					<span className="text-sm md:text-base">
						This event has ended and no recording is available yet. A recording
						may appear here if/once it is published.
					</span>
				) : (
					<div className="flex items-start gap-3 max-w-sm">
						<Icons.clock className="h-5 w-5 text-muted-foreground mt-0.5" />
						<div className="space-y-1">
							<p className="text-sm md:text-base font-medium text-foreground">
								Stream opens at {startTimeLabel} ({constants.TIME_ZONE})
							</p>
							{timeUntilStartLabel && (
									<p className="text-xs md:text-sm text-foreground">
									Starts in about {timeUntilStartLabel}. Come back later to
									watch the stream.
								</p>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
