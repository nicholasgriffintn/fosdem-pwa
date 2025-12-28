ALTER TABLE `user` ADD `gitlab_username` text;--> statement-breakpoint
CREATE UNIQUE INDEX `gitlab_username_idx` ON `user` (`gitlab_username`);