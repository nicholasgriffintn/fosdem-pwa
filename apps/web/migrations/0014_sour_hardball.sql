ALTER TABLE `user` ADD `mastodon_username` text;--> statement-breakpoint
ALTER TABLE `user` ADD `mastodon_acct` text;--> statement-breakpoint
ALTER TABLE `user` ADD `mastodon_url` text;--> statement-breakpoint
CREATE UNIQUE INDEX `mastodon_username_idx` ON `user` (`mastodon_username`);