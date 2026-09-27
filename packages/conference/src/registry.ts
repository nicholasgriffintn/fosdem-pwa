import { fosdem } from "./profiles/fosdem.ts";
import type { ConferenceConfig } from "./types.ts";
import { validateConferenceConfig } from "./validation.ts";

const conferences: Record<string, ConferenceConfig> = { fosdem };

export function getConferences(): ConferenceConfig[] {
	return Object.keys(conferences).map(getConferenceConfig);
}

export function getConferenceConfig(id: string): ConferenceConfig {
	const config = Object.hasOwn(conferences, id) ? conferences[id] : undefined;
	if (!config) throw new Error(`Unknown conference: ${id}`);
	validateConferenceConfig(config);
	return config;
}
