export interface FosdemEventLink {
	type?: string;
	href?: string;
	title?: string;
}

export interface FosdemEvent {
	day: string;
	title: string;
	type: string;
	track: string;
	persons: string[];
	room: string;
	startTime: string;
	duration: string;
	links?: FosdemEventLink[];
}

export interface FosdemData {
	events: {
		[key: string]: FosdemEvent;
	};
}

export interface Bookmark {
	id: string;
	user_id: string;
	type: string;
	status: string;
	year: number;
	slug: string;
	priority: number;
	attended?: number | boolean | null;
	watch_status?: string | null;
}

export interface EnrichedBookmark extends Bookmark, FosdemEvent {}

export interface NotificationPayload {
	title: string;
	body: string;
	url: string;
}

export interface ScheduleSnapshot {
	slug: string;
	start_time: string;
	duration: string;
	room: string;
}

export interface Subscription {
	user_id: string;
	endpoint: string;
	auth: string;
	p256dh: string;
}

export interface QueueMessage {
	subscription: Subscription;
	notification: NotificationPayload;
	bookmarkId: string;
	shouldMarkSent?: boolean;
}

export interface Env {
	DB: D1Database;
	ANALYTICS: AnalyticsEngineDataset;
	NOTIFICATION_QUEUE: Queue<QueueMessage>;
	VAPID_EMAIL: string;
	VAPID_PUBLIC_KEY: string;
	VAPID_PRIVATE_KEY: string;
	BOOKMARK_NOTIFICATIONS_ENABLED?: string | boolean;
	SCHEDULE_CHANGE_NOTIFICATIONS_ENABLED?: string | boolean;
	CRON_SECRET?: string;
}
