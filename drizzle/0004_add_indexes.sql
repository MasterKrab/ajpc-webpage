PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`module_id` text NOT NULL,
	`student_id` text NOT NULL,
	`section_id` text NOT NULL,
	`status` text DEFAULT 'present' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_attendance`("id", "module_id", "student_id", "section_id", "status", "created_at", "updated_at") SELECT "id", "module_id", "student_id", "section_id", "status", "created_at", "updated_at" FROM `attendance`;--> statement-breakpoint
DROP TABLE `attendance`;--> statement-breakpoint
ALTER TABLE `__new_attendance` RENAME TO `attendance`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `attendance_module_id_idx` ON `attendance` (`module_id`);--> statement-breakpoint
CREATE INDEX `attendance_student_id_idx` ON `attendance` (`student_id`);--> statement-breakpoint
CREATE INDEX `attendance_section_id_idx` ON `attendance` (`section_id`);--> statement-breakpoint
CREATE TABLE `__new_enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`section_id` text,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`age` integer NOT NULL,
	`gender` text NOT NULL,
	`school_year` text NOT NULL,
	`school_name` text,
	`school_type` text,
	`region` text,
	`commune` text,
	`previous_experience` text,
	`motivation` text,
	`selected_schedules` text DEFAULT '[]',
	`status` text DEFAULT 'pending' NOT NULL,
	`admin_notes` text,
	`feedback` text,
	`notified_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_enrollments`("id", "user_id", "course_id", "section_id", "full_name", "email", "age", "gender", "school_year", "school_name", "school_type", "region", "commune", "previous_experience", "motivation", "selected_schedules", "status", "admin_notes", "feedback", "notified_at", "created_at", "updated_at") SELECT "id", "user_id", "course_id", "section_id", "full_name", "email", "age", "gender", "school_year", "school_name", "school_type", "region", "commune", "previous_experience", "motivation", "selected_schedules", "status", "admin_notes", "feedback", "notified_at", "created_at", "updated_at" FROM `enrollments`;--> statement-breakpoint
DROP TABLE `enrollments`;--> statement-breakpoint
ALTER TABLE `__new_enrollments` RENAME TO `enrollments`;--> statement-breakpoint
CREATE INDEX `enrollments_user_id_idx` ON `enrollments` (`user_id`);--> statement-breakpoint
CREATE INDEX `enrollments_course_id_idx` ON `enrollments` (`course_id`);--> statement-breakpoint
CREATE INDEX `enrollments_section_id_idx` ON `enrollments` (`section_id`);--> statement-breakpoint
CREATE INDEX `enrollments_status_idx` ON `enrollments` (`status`);--> statement-breakpoint
CREATE TABLE `__new_invite_codes` (
	`code` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`created_by` text NOT NULL,
	`used_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`used_at` integer,
	`max_uses` integer DEFAULT 1,
	`uses` integer DEFAULT 0,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`used_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_invite_codes`("code", "role", "created_by", "used_by", "created_at", "used_at", "max_uses", "uses") SELECT "code", "role", "created_by", "used_by", "created_at", "used_at", "max_uses", "uses" FROM `invite_codes`;--> statement-breakpoint
DROP TABLE `invite_codes`;--> statement-breakpoint
ALTER TABLE `__new_invite_codes` RENAME TO `invite_codes`;--> statement-breakpoint
CREATE INDEX `invite_codes_created_by_idx` ON `invite_codes` (`created_by`);--> statement-breakpoint
CREATE INDEX `invite_codes_used_by_idx` ON `invite_codes` (`used_by`);--> statement-breakpoint
CREATE TABLE `__new_module_materials` (
	`id` text PRIMARY KEY NOT NULL,
	`module_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`type` text DEFAULT 'link' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_module_materials`("id", "module_id", "title", "url", "type", "created_at") SELECT "id", "module_id", "title", "url", "type", "created_at" FROM `module_materials`;--> statement-breakpoint
DROP TABLE `module_materials`;--> statement-breakpoint
ALTER TABLE `__new_module_materials` RENAME TO `module_materials`;--> statement-breakpoint
CREATE INDEX `module_materials_module_id_idx` ON `module_materials` (`module_id`);--> statement-breakpoint
CREATE TABLE `__new_modules` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_modules`("id", "course_id", "title", "description", "created_at", "updated_at") SELECT "id", "course_id", "title", "description", "created_at", "updated_at" FROM `modules`;--> statement-breakpoint
DROP TABLE `modules`;--> statement-breakpoint
ALTER TABLE `__new_modules` RENAME TO `modules`;--> statement-breakpoint
CREATE INDEX `modules_course_id_idx` ON `modules` (`course_id`);--> statement-breakpoint
CREATE TABLE `__new_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_sections`("id", "course_id", "name", "created_at", "updated_at") SELECT "id", "course_id", "name", "created_at", "updated_at" FROM `sections`;--> statement-breakpoint
DROP TABLE `sections`;--> statement-breakpoint
ALTER TABLE `__new_sections` RENAME TO `sections`;--> statement-breakpoint
CREATE INDEX `sections_course_id_idx` ON `sections` (`course_id`);--> statement-breakpoint
CREATE TABLE `__new_student_observations` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`course_id` text NOT NULL,
	`observation` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_student_observations`("id", "student_id", "teacher_id", "course_id", "observation", "created_at") SELECT "id", "student_id", "teacher_id", "course_id", "observation", "created_at" FROM `student_observations`;--> statement-breakpoint
DROP TABLE `student_observations`;--> statement-breakpoint
ALTER TABLE `__new_student_observations` RENAME TO `student_observations`;--> statement-breakpoint
CREATE INDEX `student_observations_student_id_idx` ON `student_observations` (`student_id`);--> statement-breakpoint
CREATE INDEX `student_observations_teacher_id_idx` ON `student_observations` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `student_observations_course_id_idx` ON `student_observations` (`course_id`);--> statement-breakpoint
ALTER TABLE `courses` ADD `available_schedules` text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `courses` ADD `discord_guild_id` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `discord_role_id` text;--> statement-breakpoint
CREATE INDEX `courses_year_idx` ON `courses` (`year`);--> statement-breakpoint
CREATE INDEX `courses_status_idx` ON `courses` (`status`);--> statement-breakpoint
CREATE INDEX `courses_created_at_idx` ON `courses` (`created_at`);--> statement-breakpoint
ALTER TABLE `courses` DROP COLUMN `enrollment_start_date`;--> statement-breakpoint
ALTER TABLE `courses` DROP COLUMN `enrollment_end_date`;--> statement-breakpoint
ALTER TABLE `users` ADD `discord_access_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `discord_refresh_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `discord_token_expires_at` integer;--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `invite_usages_invite_code_idx` ON `invite_usages` (`invite_code`);--> statement-breakpoint
CREATE INDEX `invite_usages_user_id_idx` ON `invite_usages` (`user_id`);--> statement-breakpoint
CREATE INDEX `section_docentes_teacher_id_idx` ON `section_docentes` (`teacher_id`);