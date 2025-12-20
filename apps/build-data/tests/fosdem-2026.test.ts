import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildData } from "../src/lib/fosdem";

describe("buildData - 2026 FOSDEM", () => {
	it("correctly identifies keynotes from hardcoded list", async () => {
		const xmlPath = join(__dirname, "fixtures", "fosdem-2026.xml");
		const xmlContent = readFileSync(xmlPath, "utf-8");

		global.fetch = async () => {
			return {
				ok: true,
				text: async () => xmlContent,
			} as Response;
		};

		const result = await buildData({ year: "2026" });

		const keynotes = [
			"8376", // Welcome to FOSDEM 2026
			"7886", // FOSS in times of war, scarcity and (adversarial) AI
			"6895", // Free as in Burned Out: Who Really Pays for Open Source?
			"7772", // Open Source Security in spite of AI
			"8377", // Closing FOSDEM 2026
		];

		for (const keynoteId of keynotes) {
			const event = result.events[keynoteId];
			expect(event, `Event ${keynoteId} should exist`).toBeDefined();
			expect(event?.type, `Event ${keynoteId} should be keynote type`).toBe("keynote");
			expect(event?.track, `Event ${keynoteId} should be in Main Track`).toBe("Main Track");
		}

		expect(result.types.keynote.eventCount).toBeGreaterThan(0);
		expect(result.types.keynote.trackCount).toBeGreaterThan(0);
	});

	it("correctly identifies dev-random track as lightning talks", async () => {
		const xmlPath = join(__dirname, "fixtures", "fosdem-2026.xml");
		const xmlContent = readFileSync(xmlPath, "utf-8");

		global.fetch = async () => {
			return {
				ok: true,
				text: async () => xmlContent,
			} as Response;
		};

		const result = await buildData({ year: "2026" });

		const devRandomTrack = Object.values(result.tracks).find(
			(track) =>
				track.id === "dev-random" ||
				track.name === "/dev/random" ||
				track.id.includes("dev-random") ||
				track.name.includes("dev/random"),
		);

		const devRandomEvents = Object.values(result.events).filter(
			(event) =>
				event.track === "/dev/random" ||
				event.trackKey === "dev-random" ||
				event.trackKey.includes("dev-random"),
		);

		if (devRandomTrack) {
			expect(devRandomTrack.type).toBe("lightningtalk");
		}

		if (devRandomEvents.length > 0) {
			for (const event of devRandomEvents) {
				expect(event.type).toBe("lightningtalk");
			}
			expect(result.types.lightningtalk.eventCount).toBeGreaterThan(0);
		}
	});

	it("parses and stores persons data", async () => {
		const xmlPath = join(__dirname, "fixtures", "fosdem-2026.xml");
		const xmlContent = readFileSync(xmlPath, "utf-8");

		global.fetch = async () => {
			return {
				ok: true,
				text: async () => xmlContent,
			} as Response;
		};

		const result = await buildData({ year: "2026" });

		expect(result.persons).toBeDefined();
		expect(Object.keys(result.persons || {}).length).toBeGreaterThan(0);

		const firstPersonId = Object.keys(result.persons || {})[0];
		const person = result.persons?.[firstPersonId];
		expect(person).toBeDefined();
		expect(person?.id).toBe(firstPersonId);
		expect(person?.name).toBeDefined();
		expect(person?.slug).toBeDefined();

		const eventWithPersons = Object.values(result.events).find(
			(event) => event.personIds && event.personIds.length > 0,
		);
		if (eventWithPersons && eventWithPersons.personIds) {
			for (const personId of eventWithPersons.personIds) {
				expect(result.persons?.[personId]).toBeDefined();
			}
		}
	});
});
