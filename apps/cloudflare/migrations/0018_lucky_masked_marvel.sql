CREATE INDEX `bookmark_user_year_status_idx` ON `bookmark` (`user_id`,`year`,`status`);--> statement-breakpoint
CREATE INDEX `bookmark_user_year_slug_idx` ON `bookmark` (`user_id`,`year`,`slug`);