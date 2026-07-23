CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`preferred_name` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`job_title` text DEFAULT '' NOT NULL,
	`department` text DEFAULT 'General' NOT NULL,
	`role` text DEFAULT 'employee' NOT NULL,
	`employment_type` text DEFAULT 'hourly' NOT NULL,
	`pay_rate_cents` integer DEFAULT 0 NOT NULL,
	`pay_frequency` text DEFAULT 'biweekly' NOT NULL,
	`start_date` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`manager_id` integer,
	`emergency_name` text DEFAULT '' NOT NULL,
	`emergency_phone` text DEFAULT '' NOT NULL,
	`emergency_relation` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`tax_forms_complete` integer DEFAULT false NOT NULL,
	`direct_deposit_complete` integer DEFAULT false NOT NULL,
	`handbook_complete` integer DEFAULT false NOT NULL,
	`pto_minutes` integer DEFAULT 0 NOT NULL,
	`sick_minutes` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_email_unique` ON `employees` (`email`);--> statement-breakpoint
CREATE TABLE `time_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`clock_in` text NOT NULL,
	`clock_out` text,
	`break_minutes` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`approved_by` text,
	`approved_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
