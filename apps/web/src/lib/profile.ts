import type { User } from "~/server/db/schema";

export function getPublicProfileId(user: User) {
	return (
		user.github_username ||
		user.gitlab_username ||
		user.discord_username ||
		user.mastodon_acct ||
		user.mastodon_username ||
		null
	);
}
