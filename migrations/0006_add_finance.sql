CREATE TABLE `daily_closings` (
	`id` text PRIMARY KEY NOT NULL,
	`opening_cash` integer DEFAULT 0,
	`total_sales` integer NOT NULL,
	`total_returns` integer DEFAULT 0 NOT NULL,
	`cash_received` integer NOT NULL,
	`vendor_paid` integer DEFAULT 0,
	`total_expenses` integer DEFAULT 0 NOT NULL,
	`total_salary` integer NOT NULL,
	`expected_cash` integer,
	`counted_cash` integer,
	`difference` integer,
	`closed_by` text,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`closed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `dailyClosing_closedBy_idx` ON `daily_closings` (`closed_by`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`amount` integer NOT NULL,
	`note` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `expense_categories`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "expense_amount_chk" CHECK("expenses"."amount" > 0)
);
--> statement-breakpoint
CREATE INDEX `expense_categoryId_idx` ON `expenses` (`category_id`);--> statement-breakpoint
CREATE INDEX `expense_createdBy_idx` ON `expenses` (`created_by`);--> statement-breakpoint
CREATE INDEX `expense_createdAt_idx` ON `expenses` (`created_at`);--> statement-breakpoint
CREATE TABLE `expense_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `expenseCategory_name_idx` ON `expense_categories` (`name`);--> statement-breakpoint
CREATE TABLE `salary_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`note` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "salaryPayment_amount_chk" CHECK("salary_payments"."amount" > 0)
);
--> statement-breakpoint
CREATE INDEX `salaryPayment_userId_idx` ON `salary_payments` (`user_id`);--> statement-breakpoint
CREATE INDEX `salaryPayment_createdBy_idx` ON `salary_payments` (`created_by`);--> statement-breakpoint
CREATE INDEX `salaryPayment_createdAt_idx` ON `salary_payments` (`created_at`);