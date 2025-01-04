DROP INDEX `note_slug_idx`;--> statement-breakpoint
CREATE INDEX `note_slug_idx` ON `note` (`slug`);