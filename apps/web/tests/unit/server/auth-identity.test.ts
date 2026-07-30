import type { ExternalIdentity } from "@ngriffin_uk/auth-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { User } from "~/server/db/schema";

const database = vi.hoisted(() => {
	const userFindFirst = vi.fn();
	const identityFindFirst = vi.fn();
	const updateWhere = vi.fn();
	const updateSet = vi.fn(() => ({ where: updateWhere }));
	const update = vi.fn(() => ({ set: updateSet }));
	const insertValues = vi.fn();
	const insert = vi.fn(() => ({ values: insertValues }));
	return {
		db: {
			insert,
			query: {
				oauthAccount: { findFirst: identityFindFirst },
				user: { findFirst: userFindFirst },
			},
			update,
		},
		identityFindFirst,
		insert,
		insertValues,
		update,
		updateSet,
		updateWhere,
		userFindFirst,
	};
});

vi.mock("~/server/db", () => ({ db: database.db }));

import { resolveIdentity } from "~/server/auth";

describe("resolveIdentity", () => {
	beforeEach(() => {
		database.identityFindFirst.mockReset();
		database.insert.mockClear();
		database.insertValues.mockReset();
		database.update.mockClear();
		database.updateSet.mockClear();
		database.updateWhere.mockReset();
		database.userFindFirst.mockReset();
	});

	it("links a verified existing account before attempting to mutate a guest", async () => {
		const account = user(12, "me@example.test", false);
		database.identityFindFirst.mockResolvedValue(null);
		database.userFindFirst.mockResolvedValue(account);
		database.insertValues.mockResolvedValue(undefined);

		const resolved = await resolveIdentity(githubIdentity(65));

		expect(resolved.record).toEqual(account);
		expect(database.insertValues).toHaveBeenCalledWith({
			provider_id: "github",
			provider_user_id: "12116098",
			user_id: account.id,
		});
		expect(database.update).not.toHaveBeenCalled();
	});

	it("repairs a provider identity left on a guest when its verified account already exists", async () => {
		const guest = user(65, "guest@example.test", true);
		const account = user(12, "me@example.test", false);
		database.identityFindFirst.mockResolvedValue({ user_id: guest.id });
		database.userFindFirst
			.mockResolvedValueOnce(guest)
			.mockResolvedValueOnce(account);
		database.updateWhere.mockResolvedValue(undefined);

		const resolved = await resolveIdentity(githubIdentity(guest.id));

		expect(resolved.record).toEqual(account);
		expect(database.updateSet).toHaveBeenCalledWith({ user_id: account.id });
	});
});

function githubIdentity(upgradeUserId: number): ExternalIdentity {
	return {
		provider: "github",
		providerSubject: "12116098",
		email: "me@example.test",
		emailVerified: true,
		claims: {
			profile: {
				id: "12116098",
				email: "me@example.test",
				emailVerified: true,
				upgradeUserId,
				name: "Nicholas Griffin",
				login: "nicholasgriffintn",
				twitter_username: "ngriffin_uk",
			},
		},
	};
}

function user(id: number, email: string, isGuest: boolean): User {
	return {
		id,
		name: isGuest ? "guest" : "Nicholas Griffin",
		avatar_url: null,
		email,
		github_username: isGuest ? null : "nicholasgriffintn",
		discord_username: null,
		mastodon_username: null,
		mastodon_acct: null,
		mastodon_url: null,
		gitlab_username: null,
		company: null,
		site: null,
		location: null,
		bio: null,
		twitter_username: isGuest ? null : "ngriffin_uk",
		created_at: "2026-07-30T00:00:00.000Z",
		updated_at: "2026-07-30T00:00:00.000Z",
		setup_at: null,
		terms_accepted_at: null,
		bookmarks_visibility: "private",
		is_guest: isGuest,
	};
}
