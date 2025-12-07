export interface FosdemEvent {
	day: string;
	title: string;
	type: string;
	track: string;
	persons: string[];
	room: string;
	startTime: string;
	duration: string;
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
}

export interface EnrichedBookmark extends Bookmark, FosdemEvent {}

export interface NotificationPayload {
	title: string;
	body: string;
	url: string;
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
}

export interface Env {
	DB: D1Database;
	DB_PREVIEW: D1Database;
	ANALYTICS: AnalyticsEngineDataset;
	NOTIFICATION_QUEUE: Queue<QueueMessage>;
	VAPID_EMAIL: string;
	VAPID_PUBLIC_KEY: string;
	VAPID_PRIVATE_KEY: string;
}
