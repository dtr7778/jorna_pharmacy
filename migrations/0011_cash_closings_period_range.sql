ALTER TABLE `daily_closings` RENAME TO `cash_closings`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cash_closings` (
	`id` text PRIMARY KEY NOT NULL,
	`period_start` integer NOT NULL,
	`period_end` integer NOT NULL,
	`opening_cash` real DEFAULT 0,
	`total_sales` real NOT NULL,
	`total_returns` real DEFAULT 0 NOT NULL,
	`cash_received` real NOT NULL,
	`vendor_paid` real DEFAULT 0,
	`total_expenses` real DEFAULT 0 NOT NULL,
	`total_salary` real NOT NULL,
	`expected_cash` real,
	`counted_cash` real,
	`difference` real,
	`closed_by` text,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`closed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "cashClosing_period_chk" CHECK("__new_cash_closings"."period_end" > "__new_cash_closings"."period_start")
);
--> statement-breakpoint
INSERT INTO `__new_cash_closings`("id", "period_start", "period_end", "opening_cash", "total_sales", "total_returns", "cash_received", "vendor_paid", "total_expenses", "total_salary", "expected_cash", "counted_cash", "difference", "closed_by", "note", "created_at", "updated_at") SELECT "id", "created_at" - 86400000, "created_at", "opening_cash", "total_sales", "total_returns", "cash_received", "vendor_paid", "total_expenses", "total_salary", "expected_cash", "counted_cash", "difference", "closed_by", "note", "created_at", "updated_at" FROM `cash_closings`;--> statement-breakpoint
DROP TABLE `cash_closings`;--> statement-breakpoint
ALTER TABLE `__new_cash_closings` RENAME TO `cash_closings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `cashClosing_closedBy_idx` ON `cash_closings` (`closed_by`);--> statement-breakpoint
CREATE INDEX `cashClosing_periodStart_idx` ON `cash_closings` (`period_start`);