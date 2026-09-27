import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@roomisfull/conference", async (importOriginal) => {
	const original =
		await importOriginal<typeof import("@roomisfull/conference")>();
	const { testConference: example } = await import(
		"@roomisfull/conference/testing"
	);
	return { ...original, conferenceConfig: example };
});

import { constants } from "~/constants";
import { siteMeta } from "~/constants/site";
import { ConferenceMap } from "~/components/Room/ConferenceMap";
import { FeaturedConferenceImage } from "~/components/shared/FeaturedConferenceImage";
import {
	imageDetailsByType,
	specialRooms,
	typeDescriptions,
} from "~/conferences/presentation";
import { getResizedImageSrc } from "~/utils/image-resize";

describe("a non-FOSDEM web deployment", () => {
	it("uses its own schedule, timezone and public identity", () => {
		expect(constants.DATA_LINK).toBe(
			"https://data.example.org/example-${YEAR}.json",
		);
		expect(constants.TIME_ZONE).toBe("America/New_York");
		expect(siteMeta.title).toBe("Example Conference");
		expect(siteMeta.description).toContain("Example Conference");
		expect(constants.ROOMS_API).toBeUndefined();
		expect(constants.STREAM_LINK).toBe("");
	});

	it("does not display FOSDEM venue details or photographs", () => {
		render(
			<>
				<ConferenceMap />
				<FeaturedConferenceImage type="keynote" size="full" />
			</>,
		);
		expect(
			screen.getByText("A venue map is not available for this conference."),
		).toBeInTheDocument();
		expect(screen.queryByRole("img")).not.toBeInTheDocument();
		expect(imageDetailsByType).toEqual({});
		expect(typeDescriptions).toEqual({});
		expect(specialRooms).toEqual({});
		expect(getResizedImageSrc("/brand/icon.svg", 64, 64)).toBe(
			"/brand/icon.svg",
		);
		expect(getResizedImageSrc("/venue.jpg", 1200, 800)).toBe("/venue.jpg");
	});
});
