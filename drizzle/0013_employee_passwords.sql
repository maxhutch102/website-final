CREATE TABLE `employee_passwords` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL,
  `password_hash` text NOT NULL,
  `password_salt` text NOT NULL,
  `iterations` integer DEFAULT 210000 NOT NULL,
  `updated_at` text NOT NULL,
  `created_at` text NOT NULL
);

CREATE UNIQUE INDEX `employee_passwords_email_unique`
ON `employee_passwords` (`email`);
