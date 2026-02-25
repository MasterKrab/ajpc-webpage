CREATE TABLE `invite_usages` (
	`id` text PRIMARY KEY NOT NULL,
	`invite_code` text NOT NULL,
	`user_id` text NOT NULL,
	`used_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`invite_code`) REFERENCES `invite_codes`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_section_docentes` (
	`section_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	PRIMARY KEY(`section_id`, `teacher_id`),
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_section_docentes`("section_id", "teacher_id") SELECT "section_id", "teacher_id" FROM `section_docentes`;--> statement-breakpoint
DROP TABLE `section_docentes`;--> statement-breakpoint
ALTER TABLE `__new_section_docentes` RENAME TO `section_docentes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `invite_codes` ADD `max_uses` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `invite_codes` ADD `uses` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `module_materials` ADD `type` text DEFAULT 'link' NOT NULL;