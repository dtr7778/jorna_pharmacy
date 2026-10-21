CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`invoice_no` text,
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
CREATE UNIQUE INDEX `purchase_vendorInvoice_idx` ON `purchases` (`vendor_id`,`invoice_no`);--> statement-breakpoint
CREATE INDEX `purchase_vendorId_idx` ON `purchases` (`vendor_id`);--> statement-breakpoint
CREATE INDEX `purchase_createdAt_idx` ON `purchases` (`created_at`);--> statement-breakpoint
CREATE TABLE `purchase_items` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_id` text NOT NULL,
	`medicine_id` text NOT NULL,
	`batch_no` text,
	`tablets_per_strip` integer,
	`strips_per_box` integer,
	`qty_purchased` integer NOT NULL,
	`qty_remaining` integer NOT NULL,
	`cost_per_unit` integer NOT NULL,
	`sell_per_unit` integer NOT NULL,
	`expiry_date` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`medicine_id`) REFERENCES `medicines`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "purchaseItem_qty_chk" CHECK("purchase_items"."qty_purchased" > 0 AND "purchase_items"."qty_remaining" >= 0 AND "purchase_items"."qty_remaining" <= "purchase_items"."qty_purchased"),
	CONSTRAINT "purchaseItem_packaging_chk" CHECK(("purchase_items"."tablets_per_strip" IS NULL OR "purchase_items"."tablets_per_strip" > 0) AND ("purchase_items"."strips_per_box" IS NULL OR "purchase_items"."strips_per_box" > 0))
);
--> statement-breakpoint
CREATE INDEX `purchaseItem_purchaseId_idx` ON `purchase_items` (`purchase_id`);--> statement-breakpoint
CREATE INDEX `purchaseItem_medicineExpiry_idx` ON `purchase_items` (`medicine_id`,`expiry_date`);--> statement-breakpoint
CREATE TABLE `purchase_returns` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`purchase_id` text NOT NULL,
	`total_amount` integer NOT NULL,
	`reason` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `purchaseReturn_vendorId_idx` ON `purchase_returns` (`vendor_id`);--> statement-breakpoint
CREATE INDEX `purchaseReturn_createdBy_idx` ON `purchase_returns` (`created_by`);--> statement-breakpoint
CREATE TABLE `purchase_return_items` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_return_id` text NOT NULL,
	`purchase_item_id` text NOT NULL,
	`qty` integer NOT NULL,
	`unit_cost` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`purchase_return_id`) REFERENCES `purchase_returns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`purchase_item_id`) REFERENCES `purchase_items`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "purchaseReturnItem_qty_chk" CHECK("purchase_return_items"."qty" > 0)
);
--> statement-breakpoint
CREATE INDEX `purchaseReturnItem_returnId_idx` ON `purchase_return_items` (`purchase_return_id`);