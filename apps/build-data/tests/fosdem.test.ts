import { afterEach, describe, expect, it, vi } from "vitest";

const mockXml2json = vi.fn();

vi.mock("xml-js", () => ({
	xml2json: mockXml2json,
}));

const { constants } = await import("../src/constants");
const { buildData } = await import("../src/lib/fosdem");

const schedulePayload = {
	schedule: {
		conference: {
			acronym: { _text: "FOSDEM" },
			title: { _text: "FOSDEM 2025" },
			subtitle: { _text: "Open Source" },
			venue: { _text: "ULB" },
			city: { _text: "Brussels" },
			start: { _text: "2025-02-01" },
			end: { _text: "2025-02-02" },
			day_change: { _text: "07:00" },
			timeslot_duration: { _text: "00:05" },
			time_zone_name: { _text: "Europe/Brussels" },
		},
		day: [
			{
				_attributes: {
					index: 1,
					date: "2025-02-01",
					start: "09:00",
					end: "18:00",
				},
				room: [
					{
						_attributes: { name: "H.1301", slug: "h-1301" },
						event: [
							{
								_attributes: { guid: "g1", id: "1" },
								title: { _text: "Keynote" },
								type: { _text: "lecture" },
								track: { _text: "Main Track" },
								persons: { person: { _text: "Alice" } },
								links: {
									link: {
										_attributes: { href: "https://video.webm" },
										_text: "Video",
									},
								},
								attachments: {
									attachment: {
										_attributes: {
											href: "https://slides.pdf",
											type: "slides",
										},
										_text: "Slides",
									},
								},
								url: { _text: "https://fosdem.org/keynote" },
								language: { _text: "en" },
								feedback_url: { _text: "https://feedback" },
								start: { _text: "10:00" },
								duration: { _text: "00:30" },
							},
							{
								_attributes: { guid: "g2", id: "2" },
								title: { _text: "Canceled: talk" },
								type: { _text: "lecture" },
								track: { _text: "Main Track" },
								start: { _text: "11:00" },
								duration: { _text: "00:30" },
							},
						],
					},
				],
			},
		],
	},
};

afterEach(() => {
	mockXml2json.mockReset();
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

describe("buildData", () => {
	it("parses schedule xml and builds aggregated data", async () => {
		mockXml2json.mockReturnValue(JSON.stringify(schedulePayload));

		const fetchMock = vi.fn(async () => ({
			ok: true,
			text: async () => "<xml />",
		}));
		vi.stubGlobal("fetch", fetchMock);

		const result = await buildData({ year: "2025" });

		expect(fetchMock).toHaveBeenCalledWith(
			"https://fosdem.org/2025/schedule/xml",
		);
		expect(mockXml2json).toHaveBeenCalledTimes(1);

		expect(result.conference).toMatchObject({
			title: "FOSDEM 2025",
			start: "2025-02-01",
			end: "2025-02-02",
			city: "Brussels",
		});

		const event = result.events["1"];
		expect(event).toMatchObject({
			id: "1",
			title: "Keynote",
			type: "keynote",
			track: "Main Track",
			trackKey: "maintrack",
			persons: ["Alice"],
			room: "H.1301",
			status: "running",
			isLive: true,
			url: "https://fosdem.org/keynote",
			language: "en",
			feedbackUrl: "https://feedback",
			startTime: "10:00",
			duration: "00:30",
		});

		expect(event?.streams).toEqual([
			{
				href: constants.STREAM_LINK.replace("${ROOM_ID}", "h1301"),
				title: "Stream",
				type: "application/vnd.apple.mpegurl",
			},
		]);
		expect(event?.chat).toBe(
			constants.CHAT_LINK.replace("${ROOM_ID}", "1301"),
		);
		expect(event?.links).toEqual([
			{
				href: "https://video.webm",
				title: "Video",
				type: "video/webm",
			},
		]);
		expect(event?.attachments).toEqual([
			{
				type: "slides",
				href: "https://slides.pdf",
				title: "Slides",
			},
		]);

		// canceled events are filtered out
		expect(result.events["2"]).toBeUndefined();

		// aggregated stats
		expect(result.days[1]).toMatchObject({
			id: 1,
			eventCount: 1,
			trackCount: 1,
			roomCount: 1,
			buildingCount: 1,
		});
		expect(result.rooms["H.1301"]).toMatchObject({
			name: "H.1301",
			slug: "h-1301",
			buildingId: "H",
			eventCount: 1,
		});
		expect(result.tracks["maintrack"]).toMatchObject({
			id: "maintrack",
			name: "Main Track",
			type: "keynote",
			room: "H.1301",
			day: [1],
			eventCount: 1,
		});
		expect(result.types["keynote"]).toMatchObject({
			eventCount: 1,
			roomCount: 1,
			buildingCount: 1,
			trackCount: 1,
		});
		expect(result.buildings["H"]).toMatchObject({
			name: "H",
			roomCount: 1,
			eventCount: 1,
		});
	});

	it("throws on invalid year format", async () => {
		await expect(buildData({ year: "20x5" })).rejects.toThrow(
			"Invalid year format. Expected YYYY",
		);
	});

	it("throws when schedule fetch fails", async () => {
		const fetchMock = vi.fn(async () => ({
			ok: false,
			statusText: "Not Found",
		}));
		vi.stubGlobal("fetch", fetchMock);

		await expect(buildData({ year: "2025" })).rejects.toThrow(
			"Failed to fetch schedule: Not Found",
		);
		expect(mockXml2json).not.toHaveBeenCalled();
	});
});
