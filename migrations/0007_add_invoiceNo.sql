PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`vendor_invoice_no` text,
	`invoice_no` text NOT NULL,
	`subtotal` integer NOT NULL,
	`discount` integer DEFAULT 1 NOT NULL,
	`total_amount` integer NOT NULL,
	`paid_amount` integer DEFAULT 0 NOT NULL,
	`note` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_purchases`("id", "vendor_id", "vendor_invoice_no", "invoice_no", "subtotal", "discount", "total_amount", "paid_amount", "note", "created_by", "created_at", "updated_at") SELECT "id", "vendor_id", "vendor_invoice_no", "invoice_no", "subtotal", "discount", "total_amount", "paid_amount", "note", "created_by", "created_at", "updated_at" FROM `purchases`;--> statement-breakpoint
DROP TABLE `purchases`;--> statement-breakpoint
ALTER TABLE `__new_purchases` RENAME TO `purchases`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_vendorInvoice_idx` ON `purchases` (`vendor_id`,`vendor_invoice_no`);--> statement-breakpoint
CREATE INDEX `purchase_vendorId_idx` ON `purchases` (`vendor_id`);--> statement-breakpoint
CREATE INDEX `purchase_invoice_idx` ON `purchases` (`invoice_no`);--> statement-breakpoint
CREATE INDEX `purchase_createdAt_idx` ON `purchases` (`created_at`);