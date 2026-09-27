import { brand } from "./brand.ts";
import { getConferenceConfig } from "./registry.ts";
import type { ConferenceConfig } from "./types.ts";

declare const __CONFERENCE_ID__: string | null | undefined;

export interface Deployment {
	origin: string;
	aliases: string[];
	conference: ConferenceConfig | null;
}

export function getDeployment(id: string | null): Deployment {
	const conference = id === null ? null : getConferenceConfig(id);
	return {
		origin: conference?.appUrl ?? brand.appUrl,
		aliases: conference?.aliases ?? (conference ? [] : brand.aliases),
		conference,
	};
}

export const deployment = getDeployment(
	typeof __CONFERENCE_ID__ === "undefined" ? null : __CONFERENCE_ID__,
);
