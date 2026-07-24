CREATE TABLE `auth_login_tokens` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL,
  `token_hash` text NOT NULL,
  `return_to` text DEFAULT '/' NOT NULL,
  `expires_at` text NOT NULL,
  `used_at` text,
  `created_at` text NOT NULL
);

CREATE UNIQUE INDEX `auth_login_tokens_token_hash_unique`
ON `auth_login_tokens` (`token_hash`);

CREATE TABLE `auth_sessions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL,
  `token_hash` text NOT NULL,
  `expires_at` text NOT NULL,
  `last_seen_at` text NOT NULL,
  `created_at` text NOT NULL
);

CREATE UNIQUE INDEX `auth_sessions_token_hash_unique`
ON `auth_sessions` (`token_hash`);