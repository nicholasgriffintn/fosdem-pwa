import { conferenceConfig } from "@roomisfull/conference";

export const constants = {
	TIME_ZONE: conferenceConfig.timeZone,
	TURNSTILE_SITE_KEY:
		process.env.NODE_ENV === "production"
			? conferenceConfig.integrations.turnstileSiteKey || ""
			: "1x00000000000000000000AA",
	VAPID_PUBLIC_KEY: conferenceConfig.integrations.vapidPublicKey || "",
	DEFAULT_YEAR: conferenceConfig.defaultYear,
	AVAILABLE_YEARS: conferenceConfig.years,
	DATA_LINK: `${conferenceConfig.dataUrl}/${conferenceConfig.dataPrefix}-\${YEAR}.json`,
	STREAM_LINK: conferenceConfig.integrations.stream || "",
	CHAT_LINK: conferenceConfig.integrations.chat || "",
	SCHEDULE_LINK: conferenceConfig.schedule.url,
	NAVIGATE_TO_LOCATION_LINK: conferenceConfig.integrations.navigation || "",
	ROOMS_API: conferenceConfig.integrations.roomStatus,
	FETCH: { TIMEOUT_MS: 8000 },
	TTL: { ROOM_STATUS_SECONDS: 60 },
};
