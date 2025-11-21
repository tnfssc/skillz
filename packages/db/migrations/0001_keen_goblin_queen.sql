CREATE TABLE `account` (
	`access_token` text,
	`access_token_expires_at` integer,
	`account_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`id_token` text,
	`password` text,
	`provider_id` text NOT NULL,
	`refresh_token` text,
	`refresh_token_expires_at` integer,
	`scope` text,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_user_id_index` ON `account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `account_provider_account_unique_index` ON `account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE TABLE `apikey` (
	`created_at` integer NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`expires_at` integer,
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`last_used_at` integer,
	`name` text,
	`permissions` text,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `apikey_key_unique` ON `apikey` (`key`);--> statement-breakpoint
CREATE INDEX `apikey_user_id_index` ON `apikey` (`user_id`);--> statement-breakpoint
CREATE INDEX `apikey_key_index` ON `apikey` (`key`);--> statement-breakpoint
CREATE TABLE `session` (
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`ip_address` text,
	`token` text NOT NULL,
	`updated_at` integer NOT NULL,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_id_index` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_expires_at_index` ON `session` (`expires_at`);--> statement-breakpoint
CREATE TABLE `user` (
	`created_at` integer NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`image` text,
	`name` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `user_email_index` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`created_at` integer,
	`expires_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`updated_at` integer,
	`value` text NOT NULL
);
--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ratings` (
	`id` integer PRIMARY KEY NOT NULL,
	`skill_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`rating` integer NOT NULL,
	`review` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_ratings`("id", "skill_id", "user_id", "rating", "review", "created_at") SELECT "id", "skill_id", "user_id", "rating", "review", "created_at" FROM `ratings`;--> statement-breakpoint
DROP TABLE `ratings`;--> statement-breakpoint
ALTER TABLE `__new_ratings` RENAME TO `ratings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_skills` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`author` text NOT NULL,
	`author_id` text NOT NULL,
	`repository` text,
	`homepage` text,
	`license` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_skills`("id", "name", "description", "author", "author_id", "repository", "homepage", "license", "created_at", "updated_at") SELECT "id", "name", "description", "author", "author_id", "repository", "homepage", "license", "created_at", "updated_at" FROM `skills`;--> statement-breakpoint
DROP TABLE `skills`;--> statement-breakpoint
ALTER TABLE `__new_skills` RENAME TO `skills`;--> statement-breakpoint
CREATE UNIQUE INDEX `skills_name_unique` ON `skills` (`name`);