import { getDeployment } from "@roomisfull/conference/deployment";
import wrangler from "../wrangler.json" with { type: "json" };

export function getBuildDeployment() {
	const environment = process.env.CLOUDFLARE_ENV || null;
	if (environment && !Object.hasOwn(wrangler.env, environment)) {
		throw new Error(`Unknown Cloudflare environment: ${environment}`);
	}
	return getDeployment(environment);
}
