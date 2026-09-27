import { createHash } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getDeployment } from "@roomisfull/conference/deployment";
import { isRecord } from "@roomisfull/conference/utils/guards";
import { glob } from "glob";
import { getSchedulePrecacheUrl } from "./schedule-precache";

const workerSource = join(
	import.meta.dirname,
	"../src/service-worker/worker.js",
);

export async function generateServiceWorker(outputDir: string): Promise<void> {
	const clientDir = join(outputDir, "client");
	const marker: unknown = JSON.parse(
		await readFile(join(clientDir, "conference-build.json"), "utf8"),
	);
	if (
		!isRecord(marker) ||
		(marker.id !== null && typeof marker.id !== "string")
	) {
		throw new Error(
			"Invalid conference build metadata; build the web app first",
		);
	}
	const { conference } = getDeployment(marker.id);
	if (!conference) {
		await rm(join(clientDir, "sw.js"), { force: true });
		return;
	}
	const [source, paths, scheduleUrl] = await Promise.all([
		readFile(workerSource, "utf8"),
		glob(
			[
				"assets/**/*.{js,css,woff,woff2}",
				"brand/*.{svg,png}",
				`${conference.id}/**/*.{png,jpg,svg}`,
			],
			{
				cwd: clientDir,
				nodir: true,
			},
		),
		getSchedulePrecacheUrl(join(outputDir, "server"), conference.defaultYear),
	]);
	const urls = [
		...new Set([
			scheduleUrl,
			"/offline",
			...paths.sort().map((path) => `/${path}`),
		]),
	];
	const revision = createHash("sha256")
		.update(source)
		.update(JSON.stringify(urls));
	for (const path of paths)
		revision.update(await readFile(join(clientDir, path)));
	const config = {
		cachePrefix: `roomisfull-${conference.id}`,
		revision: revision.digest("hex"),
		schedulePath: new URL(scheduleUrl, conference.appUrl).pathname,
		urls,
	};
	await writeFile(
		join(clientDir, "sw.js"),
		`self.__SERVICE_WORKER_CONFIG__ = ${JSON.stringify(config, null, 2)};\n\n${source}`,
	);
}
