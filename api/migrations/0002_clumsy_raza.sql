ALTER TABLE `posts` RENAME TO `purchases`;--> statement-breakpoint
ALTER TABLE `purchases` RENAME COLUMN "title" TO "items";--> statement-breakpoint
ALTER TABLE `purchases` RENAME COLUMN "content" TO "payment_method";--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_purchases` (
	`id` integer PRIMARY KEY NOT NULL,
	`items` text NOT NULL,
	`payment_method` text NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`update_at` integer,
	`total_amount` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_purchases`("id", "items", "payment_method", "user_id", "created_at", "update_at", "total_amount") SELECT "id", "items", "payment_method", "user_id", "created_at", "update_at", "total_amount" FROM `purchases`;--> statement-breakpoint
DROP TABLE `purchases`;--> statement-breakpoint
ALTER TABLE `__new_purchases` RENAME TO `purchases`;--> statement-breakpoint
PRAGMA foreign_keys=ON;