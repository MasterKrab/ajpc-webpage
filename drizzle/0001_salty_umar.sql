CREATE TABLE `section_docentes` (
	`section_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	PRIMARY KEY(`section_id`, `teacher_id`),
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `sections` DROP COLUMN `teacher_id`;