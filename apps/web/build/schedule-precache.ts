import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { glob } from "glob";

export async function getSchedulePrecacheUrl(
	serverDir: string,
	year: number,
): Promise<string> {
	const files = await glob(["*.js", "assets/*.js"], {
		cwd: serverDir,
		nodir: true,
	});
	const ids = new Set<string>();
	for (const file of files) {
		const source = await readFile(join(serverDir, file), "utf8");
		for (const match of source.matchAll(
			/"([a-f0-9]{60,})":\s*\{\s*functionName:\s*"getAllData_createServerFn_handler"/g,
		)) {
			ids.add(match[1]);
		}
	}
	if (ids.size !== 1) {
		throw new Error(
			`Expected one compiled schedule function, found ${ids.size}; cannot generate offline schedule cache`,
		);
	}
	const [id] = ids;
	const payload = {
		t: {
			t: 10,
			i: 0,
			p: {
				k: ["data"],
				v: [
					{
						t: 10,
						i: 1,
						p: { k: ["year"], v: [{ t: 0, s: year }], s: 1 },
						o: 0,
					},
				],
				s: 1,
			},
			o: 0,
		},
		f: 31,
		m: [],
	};
	return `/_serverFn/${id}?payload=${encodeURIComponent(JSON.stringify(payload))}&createServerFn`;
}
