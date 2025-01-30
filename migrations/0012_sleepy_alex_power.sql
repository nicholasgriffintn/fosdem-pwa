DROP INDEX `slug_idx`;--> statement-breakpoint
CREATE INDEX `slug_idx` ON `bookmark` (`slug`);