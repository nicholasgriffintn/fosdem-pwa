import type { Env } from "../types";

function parseBooleanFlag(value: string | boolean | undefined): boolean {
	if (value === undefined) return true;
	if (typeof value === "boolean") return value;
	return value.toString().toLowerCase() === "true";
}

export function bookmarkNotificationsEnabled(env: Env): boolean {
	return parseBooleanFlag(env.BOOKMARK_NOTIFICATIONS_ENABLED);
}

export function scheduleChangeNotificationsEnabled(env: Env): boolean {
	return parseBooleanFlag(env.SCHEDULE_CHANGE_NOTIFICATIONS_ENABLED);
}
