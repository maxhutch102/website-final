CREATE TABLE `billing_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text DEFAULT 'estimate' NOT NULL,
	`number` text NOT NULL,
	`lead_id` integer,
	`customer_name` text NOT NULL,
	`customer_business` text DEFAULT '' NOT NULL,
	`customer_email` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`issue_date` text NOT NULL,
	`due_date` text,
	`line_items_json` text DEFAULT '[]' NOT NULL,
	`subtotal_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`tax_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`paid_cents` integer DEFAULT 0 NOT NULL,
	`recurring` integer DEFAULT false NOT NULL,
	`recurrence` text DEFAULT 'monthly' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_documents_number_unique` ON `billing_documents` (`number`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`billing_document_id` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	`method` text DEFAULT 'other' NOT NULL,
	`reference` text DEFAULT '' NOT NULL,
	`paid_at` text NOT NULL,
	`recorded_by` text NOT NULL,
	`created_at` text NOT NULL
);
