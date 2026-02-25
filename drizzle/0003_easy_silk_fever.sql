DROP INDEX "users_discord_id_unique";--> statement-breakpoint
ALTER TABLE `invite_codes` ALTER COLUMN "max_uses" TO "max_uses" integer DEFAULT 1;--> statement-breakpoint
CREATE UNIQUE INDEX `users_discord_id_unique` ON `users` (`discord_id`);--> statement-breakpoint
ALTER TABLE `invite_codes` ALTER COLUMN "uses" TO "uses" integer;--> statement-breakpoint
ALTER TABLE `modules` ADD `description` text;