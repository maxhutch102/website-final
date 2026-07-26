CREATE TABLE `project_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`sender_email` text NOT NULL,
	`sender_name` text NOT NULL,
	`sender_type` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL
);
