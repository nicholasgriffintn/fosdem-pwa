import { describe, expect, it } from "vitest";

import { toPublicUser } from "~/server/lib/public-user";
import type { User } from "~/server/db/schema";

const fullUser: User = {
	id: 1,
	name: "Ada Lovelace",
	avatar_url: "https://example.com/a.png",
	email: "ada@example.com",
	github_username: "ada",
	discord_username: null,
	mastodon_username: null,
	mastodon_acct: null,
	mastodon_url: null,
	gitlab_username: null,
	company: "Analytical Engines",
	site: "https://example.com",
	location: "London",
	bio: "Notes on the engine",
	twitter_username: null,
	created_at: "2026-01-01T00:00:00Z",
	updated_at: "2026-01-02T00:00:00Z",
	setup_at: "2026-01-01T00:00:00Z",
	terms_accepted_at: "2026-01-01T00:00:00Z",
	bookmarks_visibility: "public",
	is_guest: false,
} as User;

describe("toPublicUser", () => {
	it("omits the email address", () => {
		const publicUser = toPublicUser(fullUser);

		expect(publicUser).not.toHaveProperty("email");
	});

	it("omits account-private fields", () => {
		const publicUser = toPublicUser(fullUser);

		for (const field of ["setup_at", "terms_accepted_at", "is_guest", "updated_at"]) {
			expect(publicUser).not.toHaveProperty(field);
		}
	});

	it("keeps the fields the public profile renders", () => {
		const publicUser = toPublicUser(fullUser);

		expect(publicUser).toEqual({
			id: 1,
			name: "Ada Lovelace",
			avatar_url: "https://example.com/a.png",
			github_username: "ada",
			discord_username: null,
			mastodon_username: null,
			mastodon_acct: null,
			mastodon_url: null,
			gitlab_username: null,
			company: "Analytical Engines",
			site: "https://example.com",
			location: "London",
			bio: "Notes on the engine",
			twitter_username: null,
			created_at: "2026-01-01T00:00:00Z",
			bookmarks_visibility: "public",
		});
	});

	it("does not leak newly added private columns by default", () => {
		const withNewColumn = { ...fullUser, secret_recovery_code: "hunter2" } as unknown as User;

		expect(toPublicUser(withNewColumn)).not.toHaveProperty("secret_recovery_code");
	});
});
