CREATE TABLE `test_access_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_hash` text NOT NULL,
	`owner_email` text NOT NULL,
	`mode` text NOT NULL,
	`role` text,
	`lead_id` integer,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `test_access_sessions_token_hash_unique` ON `test_access_sessions` (`token_hash`);