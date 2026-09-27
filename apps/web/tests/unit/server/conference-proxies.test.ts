import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@roomisfull/conference", async (importOriginal) => {
	const original =
		await importOriginal<typeof import("@roomisfull/conference")>();
	const { testConference: example } = await import(
		"@roomisfull/conference/testing"
	);
	return {
		...original,
		conferenceConfig: {
			...example,
			integrations: { subtitleHosts: ["captions.example.org"] },
		},
	};
});

import { getRoomStatusResponse } from "~/server/lib/room-status-proxy";
import { getSubtitleResponse } from "~/server/lib/subtitle-proxy";

afterEach(() => vi.unstubAllGlobals());

describe("conference-specific proxies", () => {
	it("does not request room data when the integration is absent", async () => {
		const request = vi.fn();
		vi.stubGlobal("fetch", request);
		expect(await (await getRoomStatusResponse()).json()).toEqual([]);
		expect(request).not.toHaveBeenCalled();
	});

	it.each([
		"https://video.fosdem.org/captions.vtt",
		"https://untrusted.captions.example.org/captions.vtt",
		"https://captions.example.org.evil.test/captions.vtt",
	])("rejects hosts outside the conference allowlist", async (url) => {
		const request = vi.fn();
		vi.stubGlobal("fetch", request);
		const response = await getSubtitleResponse(
			new Request(
				`https://companion.example.org/api/proxy/subtitles?url=${encodeURIComponent(url)}`,
			),
		);
		expect(response.status).toBe(400);
		expect(request).not.toHaveBeenCalled();
	});

	it("fetches approved subtitles without following redirects", async () => {
		const request = vi
			.fn()
			.mockResolvedValue(
				new Response("WEBVTT", { headers: { "content-type": "text/vtt" } }),
			);
		vi.stubGlobal("fetch", request);
		const response = await getSubtitleResponse(
			new Request(
				"https://companion.example.org/api/proxy/subtitles?url=https%3A%2F%2Fcaptions.example.org%2Fcaptions.vtt",
			),
		);
		expect(await response.text()).toBe("WEBVTT");
		expect(request).toHaveBeenCalledWith(
			"https://captions.example.org/captions.vtt",
			expect.objectContaining({ redirect: "error" }),
		);
	});
});
