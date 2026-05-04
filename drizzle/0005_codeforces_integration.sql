CREATE TABLE `codeforces_contests` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`start_time_seconds` integer NOT NULL,
	`duration_seconds` integer NOT NULL,
	`points_per_problem` text DEFAULT '{}',
	`score_accepted` integer DEFAULT 100 NOT NULL,
	`counted_for_global` integer DEFAULT false NOT NULL,
	`last_sync` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `codeforces_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`contest_id` text NOT NULL,
	`user_id` text NOT NULL,
	`problem_id` text NOT NULL,
	`verdict` text NOT NULL,
	`passed_test_count` integer DEFAULT 0 NOT NULL,
	`time_consumed_millis` integer NOT NULL,
	`creation_time_seconds` integer NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`contest_id`) REFERENCES `codeforces_contests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP INDEX `attendance_module_id_idx`;--> statement-breakpoint
DROP INDEX `attendance_student_id_idx`;--> statement-breakpoint
DROP INDEX `attendance_section_id_idx`;--> statement-breakpoint
DROP INDEX `courses_year_idx`;--> statement-breakpoint
DROP INDEX `courses_status_idx`;--> statement-breakpoint
DROP INDEX `courses_created_at_idx`;--> statement-breakpoint
ALTER TABLE `courses` ADD `codeforces_group_id` text;--> statement-breakpoint
DROP INDEX `enrollments_user_id_idx`;--> statement-breakpoint
DROP INDEX `enrollments_course_id_idx`;--> statement-breakpoint
DROP INDEX `enrollments_section_id_idx`;--> statement-breakpoint
DROP INDEX `enrollments_status_idx`;--> statement-breakpoint
DROP INDEX `invite_codes_created_by_idx`;--> statement-breakpoint
DROP INDEX `invite_codes_used_by_idx`;--> statement-breakpoint
DROP INDEX `invite_usages_invite_code_idx`;--> statement-breakpoint
DROP INDEX `invite_usages_user_id_idx`;--> statement-breakpoint
DROP INDEX `module_materials_module_id_idx`;--> statement-breakpoint
DROP INDEX `modules_course_id_idx`;--> statement-breakpoint
DROP INDEX `section_docentes_teacher_id_idx`;--> statement-breakpoint
DROP INDEX `sections_course_id_idx`;--> statement-breakpoint
DROP INDEX `student_observations_student_id_idx`;--> statement-breakpoint
DROP INDEX `student_observations_teacher_id_idx`;--> statement-breakpoint
DROP INDEX `student_observations_course_id_idx`;--> statement-breakpoint
DROP INDEX `users_role_idx`;--> statement-breakpoint
DROP INDEX `users_email_idx`;--> statement-breakpoint
ALTER TABLE `users` ADD `codeforces_handle` text;--> statement-breakpoint
ALTER TABLE `users` ADD `codeforces_rating` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `codeforces_last_sync` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `users_codeforces_handle_unique` ON `users` (`codeforces_handle`);