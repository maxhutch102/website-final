CREATE TABLE `calendar_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`event_type` text DEFAULT 'appointment' NOT NULL,
	`start_at` text NOT NULL,
	`end_at` text,
	`all_day` integer DEFAULT false NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`lead_id` integer,
	`project_id` integer,
	`assigned_employee_id` integer,
	`visibility` text DEFAULT 'team' NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notification_states` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_email` text NOT NULL,
	`notification_key` text NOT NULL,
	`read_at` text,
	`dismissed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
