CREATE TABLE `activity_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_email` text NOT NULL,
	`actor_name` text NOT NULL,
	`actor_role` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text DEFAULT '' NOT NULL,
	`summary` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pto_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`type` text DEFAULT 'pto' NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`minutes` integer DEFAULT 0 NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`shift_date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`location` text DEFAULT 'Remote' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `time_entries` ADD `break_started_at` text;--> statement-breakpoint
ALTER TABLE `time_entries` ADD `correction_clock_in` text;--> statement-breakpoint
ALTER TABLE `time_entries` ADD `correction_clock_out` text;--> statement-breakpoint
ALTER TABLE `time_entries` ADD `correction_reason` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `time_entries` ADD `correction_status` text DEFAULT 'none' NOT NULL;