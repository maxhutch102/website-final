CREATE TABLE `form_templates` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `slug` text NOT NULL,
  `name` text NOT NULL,
  `description` text DEFAULT '' NOT NULL,
  `category` text DEFAULT 'client' NOT NULL,
  `schema_json` text DEFAULT '[]' NOT NULL,
  `customer_facing` integer DEFAULT true NOT NULL,
  `requires_signature` integer DEFAULT false NOT NULL,
  `active` integer DEFAULT true NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
CREATE UNIQUE INDEX `form_templates_slug_unique` ON `form_templates` (`slug`);

CREATE TABLE `client_forms` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `template_id` integer NOT NULL,
  `lead_id` integer NOT NULL,
  `project_id` integer,
  `title` text NOT NULL,
  `status` text DEFAULT 'draft' NOT NULL,
  `values_json` text DEFAULT '{}' NOT NULL,
  `revision` integer DEFAULT 1 NOT NULL,
  `due_date` text,
  `customer_can_edit` integer DEFAULT true NOT NULL,
  `customer_visible` integer DEFAULT false NOT NULL,
  `signature_name` text,
  `signed_at` text,
  `approved_at` text,
  `created_by` text NOT NULL,
  `updated_by` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  `last_notified_at` text
);

CREATE TABLE `form_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `form_id` integer NOT NULL,
  `event_type` text NOT NULL,
  `actor_email` text NOT NULL,
  `actor_name` text NOT NULL,
  `note` text DEFAULT '' NOT NULL,
  `created_at` text NOT NULL
);

CREATE TABLE `client_accounts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `lead_id` integer NOT NULL,
  `email` text NOT NULL,
  `status` text DEFAULT 'invited' NOT NULL,
  `invited_at` text,
  `first_login_at` text,
  `last_login_at` text,
  `created_by` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
CREATE UNIQUE INDEX `client_accounts_lead_id_unique` ON `client_accounts` (`lead_id`);

ALTER TABLE `client_projects` ADD `preview_url` text DEFAULT '' NOT NULL;
ALTER TABLE `client_projects` ADD `preview_visible` integer DEFAULT false NOT NULL;
