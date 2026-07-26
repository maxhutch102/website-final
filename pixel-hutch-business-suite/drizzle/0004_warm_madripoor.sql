CREATE TABLE `client_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer NOT NULL,
	`status` text DEFAULT 'planning' NOT NULL,
	`progress` integer DEFAULT 10 NOT NULL,
	`current_phase` text DEFAULT 'Planning & discovery' NOT NULL,
	`next_step` text DEFAULT 'Confirm project requirements' NOT NULL,
	`target_date` text,
	`client_summary` text DEFAULT 'We are getting your project organized and ready to begin.' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `client_projects_lead_id_unique` ON `client_projects` (`lead_id`);--> statement-breakpoint
CREATE TABLE `file_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`required` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`due_date` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `project_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`request_id` integer,
	`uploaded_by_email` text NOT NULL,
	`uploaded_by_name` text NOT NULL,
	`filename` text NOT NULL,
	`storage_key` text NOT NULL,
	`content_type` text DEFAULT 'application/octet-stream' NOT NULL,
	`size_bytes` integer DEFAULT 0 NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`visible_to_client` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'uploaded' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_files_storage_key_unique` ON `project_files` (`storage_key`);--> statement-breakpoint
CREATE TABLE `project_updates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`visible_to_client` integer DEFAULT true NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
