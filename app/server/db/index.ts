import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";
import { getCloudflareEnv } from "../config";

type D1ResponseInfo = {
	code: number;
	message: string;
};

type D1Response = {
	result: {
		meta: {
			changed_db: boolean;
			changes: number;
			duration: number;
			last_row_id: number;
			rows_read: number;
			rows_written: number;
			size_after: number;
		};
		results: Array<unknown>;
		success: boolean;
	}[];
	errors: D1ResponseInfo[];
	messages: D1ResponseInfo[];
	success: boolean;
};

const env = getCloudflareEnv();
const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, CLOUDFLARE_D1_TOKEN } = env;

export const db = drizzle(
	async (sql: string, params: any[], method: string) => {
		if (
			!CLOUDFLARE_ACCOUNT_ID ||
			!CLOUDFLARE_DATABASE_ID ||
			!CLOUDFLARE_D1_TOKEN
		) {
			throw new Error("Missing required Cloudflare D1 environment variables.");
		}

		const endpoint = method === "values" ? "raw" : "query";
		const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_DATABASE_ID}/${endpoint}`;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${CLOUDFLARE_D1_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ sql, params }),
		});

		if (response.status !== 200)
			throw new Error(
				`Error from sqlite proxy server: ${response.status} ${response.statusText
				}\n${JSON.stringify(await response.json())}`,
			);

		const responseJson = (await response.json()) as D1Response;

		if (!responseJson.success) {
			throw new Error(
				`Error from Cloudflare D1: ${response.status} ${response.statusText
				}\n${JSON.stringify(responseJson)}`,
			);
		}

		const qResult = responseJson.result[0];
		const rows = qResult.results.map((r: any) => Object.values(r));

		return { rows: method === "all" ? rows : rows[0] };
	},
	{ schema, logger: process.env.NODE_ENV === "development" },
);
