CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`address` text,
	`note` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `vendor_name_idx` ON `vendors` (`name`);--> statement-breakpoint
CREATE TABLE `vendor_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`purchase_id` text,
	`amount` integer NOT NULL,
	`note` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "vendorPayment_amount_chk" CHECK("vendor_payments"."amount" > 0)
);
--> statement-breakpoint
CREATE INDEX `vendorPayment_vendorId_idx` ON `vendor_payments` (`vendor_id`);--> statement-breakpoint
CREATE INDEX `vendorPayment_createdAt_idx` ON `vendor_payments` (`created_at`);--> statement-breakpoint
CREATE INDEX `vendorPayment_createdBy_idx` ON `vendor_payments` (`created_by`);