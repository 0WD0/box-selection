CREATE TABLE `annotations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`region_id` integer NOT NULL,
	`content` text NOT NULL,
	`type` text DEFAULT 'text',
	`position` text,
	`is_visible` integer DEFAULT 1,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `region_blocks` (
	`region_id` integer NOT NULL,
	`block_id` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `regions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`root_block_id` integer NOT NULL,
	`bbox` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visual_blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_index` integer NOT NULL,
	`block_index` integer NOT NULL,
	`type` text NOT NULL,
	`bbox` text NOT NULL,
	`content` text,
	`level` integer DEFAULT 1,
	`parent_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
