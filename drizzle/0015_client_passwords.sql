CREATE TABLE `client_passwords` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `client_account_id` integer NOT NULL,
  `password_hash` text NOT NULL,
  `password_salt` text NOT NULL,
  `iterations` integer DEFAULT 100000 NOT NULL,
  `updated_at` text NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `client_passwords_client_account_id_unique`
ON `client_passwords` (`client_account_id`);
