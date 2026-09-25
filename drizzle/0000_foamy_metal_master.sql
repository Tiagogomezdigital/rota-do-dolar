CREATE TABLE `answers` (
	`session_id` text NOT NULL,
	`question_id` text NOT NULL,
	`option_id` text NOT NULL,
	`answered_at` integer NOT NULL,
	PRIMARY KEY(`session_id`, `question_id`),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`content_version` text NOT NULL,
	`created_at` integer NOT NULL,
	`started_at` integer,
	`last_seen` integer NOT NULL,
	`current_step` integer DEFAULT 0 NOT NULL,
	`furthest_step` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	`cta_clicked_at` integer,
	`source` text DEFAULT 'direto' NOT NULL,
	`device` text DEFAULT 'desktop' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_created_at` ON `sessions` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_sessions_last_seen` ON `sessions` (`last_seen`);--> statement-breakpoint
CREATE TABLE `step_views` (
	`session_id` text NOT NULL,
	`step` integer NOT NULL,
	`first_seen` integer NOT NULL,
	PRIMARY KEY(`session_id`, `step`),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
