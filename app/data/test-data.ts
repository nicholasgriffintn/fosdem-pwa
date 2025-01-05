export const testLiveEvent = {
	day: ["1"],
	isLive: true,
	slug: "test-live",
	subtitle: "testing 123",
	description: "This is a test of the live player - ignore",
	status: "running",
	type: "devroom",
	track: "Radio",
	trackKey: "radio",
	title: "THIS IS A TEST OF THE LIVE PLAYER - IGNORE",
	persons: ["Nicholas Griffin"],
	links: [
		{
			href: "https://rdmedia.bbc.co.uk/testcard/simulcast/",
			title: "BBC R&D Test Cards",
			type: "external",
		},
	],
	streams: [
		{
			href: "https://rdmedia.bbc.co.uk/testcard/simulcast/manifests/avc-full.m3u8",
			title: "AVC (All representations in all languages)",
			type: "application/vnd.apple.mpegurl",
		},
		{
			href: "https://rdmedia.bbc.co.uk/testcard/simulcast/manifests/radio-en.m3u8",
			title: "Audio Only (HE and LC AAC Stereo in English)",
			type: "application/vnd.apple.mpegurl",
		},
	],
	chat: "https://fosdem.org/2025/schedule/event/test-live/chat",
	room: "UB2.147",
	id: "test-live",
	startTime: "15:30",
	duration: "01:00",
	abstract: "<p>This is just a test to confirm things work before FOSDOM</p>",
	language: "dalek",
	url: "https://fosdem.org/2025/schedule/event/test-live",
	feedbackUrl: "https://fosdem.org/2025/schedule/event/test-live/feedback",
	attachments: [
		{
			type: "test",
			href: "https://fosdem.org/2025/schedule/event/test-live/attachments/test-live.pdf",
			title: "Test Live Attachment",
		},
	],
};

export const testConference = {
	acronym: "fosdem-2025",
	title: "FOSDEM 2025",
	subtitle: "FOSDEM 2025",
	venue: "ULB (Université Libre de Bruxelles)",
	city: "Brussels",
	start: "2025-02-01",
	end: "2025-02-02",
	days: "2",
	day_change: "09:00:00",
	timeslot_duration: "00:05:00",
	base_url: "https://fosdem.org/2025/schedule/",
	time_zone_name: "Europe/Brussels",
};
