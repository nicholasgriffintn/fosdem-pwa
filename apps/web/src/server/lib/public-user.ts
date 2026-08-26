import type { User } from "~/server/db/schema";

/**
 * The subset of a user record that is safe to expose on public profile pages.
 *
 * Anything omitted here (notably `email`, `setup_at`, `terms_accepted_at` and
 * `is_guest`) is account-private and must never be serialised into a response
 * that an unauthenticated visitor can read.
 */
export type PublicUser = Pick<
	User,
	| "id"
	| "name"
	| "avatar_url"
	| "github_username"
	| "discord_username"
	| "mastodon_username"
	| "mastodon_acct"
	| "mastodon_url"
	| "gitlab_username"
	| "company"
	| "site"
	| "location"
	| "bio"
	| "twitter_username"
	| "created_at"
	| "bookmarks_visibility"
>;

/**
 * Projects a full user row down to its publicly shareable fields.
 *
 * This is an allow-list on purpose: new private columns added to the `user`
 * table are excluded by default rather than leaking until someone notices.
 */
export function toPublicUser(user: User): PublicUser {
	return {
		id: user.id,
		name: user.name,
		avatar_url: user.avatar_url,
		github_username: user.github_username,
		discord_username: user.discord_username,
		mastodon_username: user.mastodon_username,
		mastodon_acct: user.mastodon_acct,
		mastodon_url: user.mastodon_url,
		gitlab_username: user.gitlab_username,
		company: user.company,
		site: user.site,
		location: user.location,
		bio: user.bio,
		twitter_username: user.twitter_username,
		created_at: user.created_at,
		bookmarks_visibility: user.bookmarks_visibility,
	};
}
