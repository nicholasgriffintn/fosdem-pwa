CREATE INDEX `year_idx` ON `bookmark` (`year`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `bookmark` (`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `slug_idx` ON `bookmark` (`slug`);--> statement-breakpoint
CREATE INDEX `expires_at_idx` ON `session` (`expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `email_idx` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `github_username_idx` ON `user` (`github_username`);--> statement-breakpoint
CREATE UNIQUE INDEX `twitter_username_idx` ON `user` (`twitter_username`);