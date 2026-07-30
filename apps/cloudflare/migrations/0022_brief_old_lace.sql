DROP INDEX `github_username_idx`;--> statement-breakpoint
DROP INDEX `discord_username_idx`;--> statement-breakpoint
DROP INDEX `twitter_username_idx`;--> statement-breakpoint
DROP INDEX `gitlab_username_idx`;--> statement-breakpoint
CREATE INDEX `github_username_idx` ON `user` (`github_username`);--> statement-breakpoint
CREATE INDEX `discord_username_idx` ON `user` (`discord_username`);--> statement-breakpoint
CREATE INDEX `twitter_username_idx` ON `user` (`twitter_username`);--> statement-breakpoint
CREATE INDEX `gitlab_username_idx` ON `user` (`gitlab_username`);