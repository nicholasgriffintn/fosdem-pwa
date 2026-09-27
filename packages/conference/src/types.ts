export interface ConferenceConfig {
	id: string;
	name: string;
	appName: string;
	website: string;
	appUrl: string;
	aliases?: string[];
	dataUrl: string;
	dataPrefix: string;
	defaultYear: number;
	years: number[];
	timeZone: string;
	venue: string;
	city: string;
	editions: Record<string, { dates: string[] }>;
	schedule: { provider: "fosdem" | "json"; url: string };
	map?: { image: string; description: string; directions?: string };
	integrations: {
		roomStatus?: string;
		navigation?: string;
		stream?: string;
		chat?: string;
		subtitleHosts: string[];
		sentryWebDsn?: string;
		sentryBuildDsn?: string;
		sentryPushDsn?: string;
		pushServiceUrl?: string;
		vapidPublicKey?: string;
		turnstileSiteKey?: string;
		statusUrl?: string;
	};
	storage: { offlineDatabase: string; syncKey: string; playerKey: string };
}
