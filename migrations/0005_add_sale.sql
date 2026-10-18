CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_no` text NOT NULL,
	`customer_id` text,
	`subtotal` integer NOT NULL,
	`discount` integer DEFAULT 0 NOT NULL,
	`total_amount` integer NOT NULL,
	`paid_amount` integer DEFAULT 0 NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "sale_walkInPaid_chk" CHECK("sales"."customer_id" IS NOT NULL OR "sales"."paid_amount" = "sales"."total_amount")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sale_invoiceNo_idx` ON `sales` (`invoice_no`);--> statement-breakpoint
CREATE INDEX `sale_customerId_idx` ON `sales` (`customer_id`);--> statement-breakpoint
CREATE INDEX `sale_createdAt_idx` ON `sales` (`created_at`);--> statement-breakpoint
CREATE INDEX `sale_createdBy_idx` ON `sales` (`created_by`);--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`medicine_id` text NOT NULL,
	`purchase_item_id` text NOT NULL,
	`qty` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`unit_cost` integer NOT NULL,
	`line_total` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`medicine_id`) REFERENCES `medicines`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`purchase_item_id`) REFERENCES `purchase_items`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "saleItem_qty_chk" CHECK("sale_items"."qty" > 0)
);
--> statement-breakpoint
CREATE INDEX `saleItem_saleId_idx` ON `sale_items` (`sale_id`);--> statement-breakpoint
CREATE INDEX `saleItem_medicineId_idx` ON `sale_items` (`medicine_id`);--> statement-breakpoint
CREATE INDEX `saleItem_purchaseItemId_idx` ON `sale_items` (`purchase_item_id`);--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_item_id` text NOT NULL,
	`movement_type` text NOT NULL,
	`qty_change` integer NOT NULL,
	`ref_table` text,
	`ref_id` text,
	`reason` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`purchase_item_id`) REFERENCES `purchase_items`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `stockMovement_purchaseItemId_idx` ON `stock_movements` (`purchase_item_id`);--> statement-breakpoint
CREATE INDEX `stockMovement_ref_idx` ON `stock_movements` (`ref_table`,`ref_id`);--> statement-breakpoint
CREATE INDEX `stockMovement_createdAt_idx` ON `stock_movements` (`created_at`);