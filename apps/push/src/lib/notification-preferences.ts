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

const DEFAULT_PREFERENCES: NotificationPreference = {
	reminder_minutes_before: 15,
	event_reminders: true,
	schedule_changes: true,
	room_status_alerts: true,
	recording_available: false,
	daily_summary: true,
	notify_low_priority: false,
};

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

	if (!result) {
		return { ...DEFAULT_PREFERENCES };
	}

	return {
		reminder_minutes_before: Number.isFinite(
			Number(result.reminder_minutes_before),
		)
			? Number(result.reminder_minutes_before)
			: DEFAULT_PREFERENCES.reminder_minutes_before,
		event_reminders: Number(result.event_reminders) !== 0,
		schedule_changes: Number(result.schedule_changes) !== 0,
		room_status_alerts: Number(result.room_status_alerts) !== 0,
		recording_available: Number(result.recording_available) !== 0,
		daily_summary: Number(result.daily_summary) !== 0,
		notify_low_priority: Number(result.notify_low_priority) !== 0,
	};
}
