import type { ConferenceConfig } from "./types.ts";

export function validateConferenceConfig(config: ConferenceConfig): void {
	if (
		!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.id) ||
		!/^[a-z0-9-]+$/.test(config.dataPrefix)
	) {
		throw new Error("Conference identifiers must be lowercase slugs");
	}
	if (!config.years.includes(config.defaultYear))
		throw new Error("Default year must be available");
	new Intl.DateTimeFormat("en", { timeZone: config.timeZone });
	for (const url of [
		config.appUrl,
		config.website,
		config.dataUrl,
		config.schedule.url,
		...(config.aliases ?? []),
	]) {
		const parsed = new URL(url);
		if (parsed.protocol !== "https:" || parsed.username || parsed.password)
			throw new Error("Conference URLs must use HTTPS without credentials");
	}
	for (const origin of [
		config.appUrl,
		config.dataUrl,
		...(config.aliases ?? []),
	]) {
		if (new URL(origin).origin !== origin)
			throw new Error(
				"App and data URLs must be origins without trailing slashes",
			);
	}
	if (config.schedule.provider === "fosdem" && config.id !== "fosdem")
		throw new Error("The FOSDEM provider is reserved for FOSDEM");
	const dates = config.editions[config.defaultYear]?.dates;
	if (!dates?.length)
		throw new Error("Configure dates for the default edition");
	for (const edition of Object.values(config.editions)) {
		if (new Set(edition.dates).size !== edition.dates.length)
			throw new Error("Conference dates must be unique");
		if (
			edition.dates.some(
				(date, index) =>
					!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
					Number.isNaN(Date.parse(date)) ||
					new Date(date).toISOString().slice(0, 10) !== date ||
					(index > 0 && date <= edition.dates[index - 1]),
			)
		) {
			throw new Error("Conference dates must be valid and ordered");
		}
	}
}
