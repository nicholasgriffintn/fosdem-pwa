import { describe, expect, it } from "vitest";

import { getBookmarksByUserIds } from "../src/lib/bookmarks";
import type { Env } from "../src/types";

type Prepared = {
	query: string;
	bind: (...args: unknown[]) => Prepared;
	run: () => Promise<{ success: boolean; results?: unknown[] }>;
};

function createEnv(results: unknown[], queries: string[]): Env {
	return {
		DB: {
			prepare: (query: string): Prepared => {
				const stmt: Prepared = {
					query,
					bind: () => stmt,
					run: async () => {
						queries.push(query);
						return { success: true, results };
					},
				};
				return stmt;
			},
		} as Env["DB"],
		DB_PREVIEW: {} as Env["DB_PREVIEW"],
		ANALYTICS: {} as Env["ANALYTICS"],
		NOTIFICATION_QUEUE: {} as Env["NOTIFICATION_QUEUE"],
		VAPID_EMAIL: "",
		VAPID_PUBLIC_KEY: "",
		VAPID_PRIVATE_KEY: "",
	};
}

describe("getBookmarksByUserIds", () => {
	it("groups results by user id", async () => {
		const queries: string[] = [];
		const env = createEnv(
			[
				{
					id: "b1",
					user_id: "1",
					type: "bookmark_event",
					status: "favourited",
					year: 2025,
					slug: "talk-a",
					priority: 1,
				},
				{
					id: "b2",
					user_id: "2",
					type: "bookmark_event",
					status: "favourited",
					year: 2025,
					slug: "talk-b",
					priority: 2,
				},
			],
			queries,
		);

		const result = await getBookmarksByUserIds(["1", "2"], env);

		expect(result.get("1")).toHaveLength(1);
		expect(result.get("2")).toHaveLength(1);
		expect(queries).toHaveLength(1);
	});

	it("adds the unsent filter when includeSent is false", async () => {
		const queries: string[] = [];
		const env = createEnv([], queries);

		await getBookmarksByUserIds(["1"], env);

		expect(queries[0]).toContain("last_notification_sent_at IS NULL");
	});

	it("omits the unsent filter when includeSent is true", async () => {
		const queries: string[] = [];
		const env = createEnv([], queries);

		await getBookmarksByUserIds(["1"], env, { includeSent: true });

		expect(queries[0]).not.toContain("last_notification_sent_at IS NULL");
	});

	it("filters by slug when provided", async () => {
		const queries: string[] = [];
		const env = createEnv([], queries);

		await getBookmarksByUserIds(["1"], env, { slugs: ["talk-a", "talk-b"] });

		expect(queries[0]).toContain("slug IN");
	});

	it("skips querying when no user ids are provided", async () => {
		const queries: string[] = [];
		const env = createEnv([], queries);

		const result = await getBookmarksByUserIds([], env);

		expect(result.size).toBe(0);
		expect(queries).toHaveLength(0);
	});
});
