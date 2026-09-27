import { resolve } from "node:path";
import { generateServiceWorker } from "../build/service-worker";

generateServiceWorker(resolve(process.argv[2] ?? "dist")).catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
