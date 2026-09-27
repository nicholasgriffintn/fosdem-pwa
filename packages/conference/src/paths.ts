import type { ConferenceConfig } from "./types.ts";

export function getDataKey(
	config: ConferenceConfig,
	year: number | string,
	section?: string,
): string {
	return `${config.dataPrefix}-${year}${section ? `-${section}` : ""}.json`;
}

export function getDataUrl(
	config: ConferenceConfig,
	year: number | string,
	section?: string,
): string {
	return `${config.dataUrl}/${getDataKey(config, year, section)}`;
}
