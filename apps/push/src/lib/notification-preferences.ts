import type { Env } from "../types";

export type NotificationPreference = {
	reminder_minutes_before: number;
	event_reminders: boolean;
	schedule_changes: boolean;
	room_status_alerts: boolean;
	recording_available: boolean;
	daily_summary: boolean;
	notify_low_priority: boolean;
};

export const DEFAULT_PREFERENCES: NotificationPreference = {
	reminder_minutes_before: 15,
	event_reminders: true,
	schedule_changes: true,
	room_status_alerts: true,
	recording_available: false,
	daily_summary: true,
	notify_low_priority: false,
};

const toNumber = (value: unknown, fallback: number) => {
	const numeric = Number(value);
	return Number.isFinite(numeric) ? numeric : fallback;
};

const toBoolean = (value: unknown, fallback: boolean) => {
	if (value === null || value === undefined) {
		return fallback;
	}
	return Number(value) !== 0;
};

export function resolveNotificationPreference(
	row: Partial<Record<keyof NotificationPreference, unknown>> | null | undefined,
): NotificationPreference {
	return {
		reminder_minutes_before: toNumber(
			row?.reminder_minutes_before,
			DEFAULT_PREFERENCES.reminder_minutes_before,
		),
		event_reminders: toBoolean(
			row?.event_reminders,
			DEFAULT_PREFERENCES.event_reminders,
		),
		schedule_changes: toBoolean(
			row?.schedule_changes,
			DEFAULT_PREFERENCES.schedule_changes,
		),
		room_status_alerts: toBoolean(
			row?.room_status_alerts,
			DEFAULT_PREFERENCES.room_status_alerts,
		),
		recording_available: toBoolean(
			row?.recording_available,
			DEFAULT_PREFERENCES.recording_available,
		),
		daily_summary: toBoolean(
			row?.daily_summary,
			DEFAULT_PREFERENCES.daily_summary,
		),
		notify_low_priority: toBoolean(
			row?.notify_low_priority,
			DEFAULT_PREFERENCES.notify_low_priority,
		),
	};
}

export async function getUserNotificationPreference(
	userId: string,
	env: Env,
): Promise<NotificationPreference> {
	const result = await env.DB.prepare(
		`SELECT reminder_minutes_before, event_reminders, schedule_changes, room_status_alerts,
      recording_available, daily_summary, notify_low_priority
     FROM notification_preference WHERE user_id = ?`,
	)
		.bind(userId)
		.first();

	return resolveNotificationPreference(
		result as Partial<Record<keyof NotificationPreference, unknown>> | null,
	);
}
