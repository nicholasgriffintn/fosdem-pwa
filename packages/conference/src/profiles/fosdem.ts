import type { ConferenceConfig } from "../types.ts";

export const fosdem: ConferenceConfig = {
	id: "fosdem",
	name: "FOSDEM",
	"appName": "FOSDEM PWA",
	website: "https://fosdem.org",
	appUrl: "https://fosdempwa.com",
	aliases: ["https://fosdem.roomisfull.app", "https://www.fosdempwa.com"],
	dataUrl: "https://r2.fosdempwa.com",
	dataPrefix: "fosdem",
	defaultYear: 2027,
	years: Array.from({ length: 16 }, (_, index) => 2012 + index),
	timeZone: "Europe/Brussels",
	venue: "ULB (Université Libre de Bruxelles)",
	city: "Brussels, Belgium",
	editions: { "2027": { dates: ["2027-01-30", "2027-01-31"] } },
	schedule: {
		provider: "fosdem",
		url: "https://fosdem.org/${YEAR}/schedule/xml",
	},
	map: {
		image: "/fosdem/images/map.png",
		description: "Map of the ULB Solbosch Campus",
		directions:
			"https://www.openstreetmap.org/relation/13699100#map=17/50.812814/4.381442",
	},
	integrations: {
		sentryWebDsn:
			"https://52b654d9455a44b0b822cee104d62dd6@ingest.bitwobbly.com/9",
		sentryBuildDsn:
			"https://07aa95ea691d47e198b5c3b291501895@ingest.bitwobbly.com/7",
		sentryPushDsn:
			"https://2cbf756f8faa4cab906b2dc99df77f82@ingest.bitwobbly.com/8",
		roomStatus: "https://api.fosdem.org/roomstatus/v1/listrooms",
		navigation: "https://nav.fosdem.org/d/${LOCATION_ID}/",
		stream: "https://stream.fosdem.org/${ROOM_ID}.m3u8",
		chat: "https://chat.fosdem.org/#/room/#${ROOM_ID}:fosdem.org",
		subtitleHosts: [
			"fosdem.org",
			"stream.fosdem.org",
			"video.fosdem.org",
			"fosdempwa.com",
			"r2.fosdempwa.com",
			"dosowisko.net",
		],
		pushServiceUrl: "https://push.fosdempwa.com",
		vapidPublicKey:
			"BOyDFH_a2LKhi-g00jnVi4ZzkPWxC9mqJov7pyOX5Ka-2BWAHT8cioIcsgvD9Suj96NS9u8QpwrtNp5mdyeQ7gc",
		turnstileSiteKey: "0x4AAAAAAA4mg92kNkVgcTr6",
		statusUrl: "https://bitwobbly.com/status/fosdem-pwa",
	},
	storage: {
		offlineDatabase: "fosdem_offline",
		syncKey: "fosdem_sync_enabled",
		playerKey: "fosdem_player_state",
	},
};
