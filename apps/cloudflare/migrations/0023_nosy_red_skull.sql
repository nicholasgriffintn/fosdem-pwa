PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`avatar_url` text,
	`email` text,
	`github_username` text,
	`discord_username` text,
	`mastodon_username` text,
	`mastodon_acct` text,
	`mastodon_url` text,
	`gitlab_username` text,
	`company` text,
	`site` text,
	`location` text,
	`bio` text,
	`twitter_username` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	`setup_at` text,
	`terms_accepted_at` text,
	`bookmarks_visibility` text DEFAULT 'private',
	`is_guest` integer DEFAULT false
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "name", "avatar_url", "email", "github_username", "discord_username", "mastodon_username", "mastodon_acct", "mastodon_url", "gitlab_username", "company", "site", "location", "bio", "twitter_username", "created_at", "updated_at", "setup_at", "terms_accepted_at", "bookmarks_visibility", "is_guest") SELECT "id", "name", "avatar_url", "email", "github_username", "discord_username", "mastodon_username", "mastodon_acct", "mastodon_url", "gitlab_username", "company", "site", "location", "bio", "twitter_username", "created_at", "updated_at", "setup_at", "terms_accepted_at", "bookmarks_visibility", "is_guest" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `email_idx` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `github_username_idx` ON `user` (`github_username`);--> statement-breakpoint
CREATE INDEX `discord_username_idx` ON `user` (`discord_username`);--> statement-breakpoint
CREATE INDEX `twitter_username_idx` ON `user` (`twitter_username`);--> statement-breakpoint
CREATE INDEX `gitlab_username_idx` ON `user` (`gitlab_username`);
