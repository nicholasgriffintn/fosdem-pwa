import { conferenceConfig } from "@roomisfull/conference";
import { getDataUrl } from "@roomisfull/conference/paths";

export const constants = {
	DATA_LINK: getDataUrl(
		conferenceConfig,
		conferenceConfig.defaultYear,
		"events",
	),
	YEAR: conferenceConfig.defaultYear,
	DAYS_MAP: Object.fromEntries(
		conferenceConfig.editions[conferenceConfig.defaultYear].dates.map(
			(date, index) => [`${date}T00:00:00.000Z`, String(index + 1)],
		),
	),
};
