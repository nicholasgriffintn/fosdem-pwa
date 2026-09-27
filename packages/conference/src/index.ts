import { deployment } from "./deployment.ts";

export { brand } from "./brand.ts";

function requireConference() {
	if (!deployment.conference) {
		throw new Error(
			"Select a conference environment before using conference services",
		);
	}
	return deployment.conference;
}

export const conferenceConfig = requireConference();
