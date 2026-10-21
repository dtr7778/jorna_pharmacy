PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_customer_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`sale_id` text,
	`amount` real NOT NULL,
	`note` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "customerPayment_amount_chk" CHECK("__new_customer_payments"."amount" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_customer_payments`("id", "customer_id", "sale_id", "amount", "note", "created_by", "created_at", "updated_at") SELECT "id", "customer_id", "sale_id", "amount", "note", "created_by", "created_at", "updated_at" FROM `customer_payments`;--> statement-breakpoint
DROP TABLE `customer_payments`;--> statement-breakpoint
ALTER TABLE `__new_customer_payments` RENAME TO `customer_payments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `customerPayment_customerId_idx` ON `customer_payments` (`customer_id`);--> statement-breakpoint
CREATE INDEX `customerPayment_saleId_idx` ON `customer_payments` (`sale_id`);--> statement-breakpoint
CREATE INDEX `customerPayment_createdAt_idx` ON `customer_payments` (`created_at`);--> statement-breakpoint
CREATE TABLE `__new_daily_closings` (
	`id` text PRIMARY KEY NOT NULL,
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
	FOREIGN KEY (`closed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_daily_closings`("id", "opening_cash", "total_sales", "total_returns", "cash_received", "vendor_paid", "total_expenses", "total_salary", "expected_cash", "counted_cash", "difference", "closed_by", "note", "created_at", "updated_at") SELECT "id", "opening_cash", "total_sales", "total_returns", "cash_received", "vendor_paid", "total_expenses", "total_salary", "expected_cash", "counted_cash", "difference", "closed_by", "note", "created_at", "updated_at" FROM `daily_closings`;--> statement-breakpoint
DROP TABLE `daily_closings`;--> statement-breakpoint
ALTER TABLE `__new_daily_closings` RENAME TO `daily_closings`;--> statement-breakpoint
CREATE INDEX `dailyClosing_closedBy_idx` ON `daily_closings` (`closed_by`);--> statement-breakpoint
CREATE TABLE `__new_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`amount` real NOT NULL,
	`note` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `expense_categories`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "expense_amount_chk" CHECK("__new_expenses"."amount" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_expenses`("id", "category_id", "amount", "note", "created_by", "created_at", "updated_at") SELECT "id", "category_id", "amount", "note", "created_by", "created_at", "updated_at" FROM `expenses`;--> statement-breakpoint
DROP TABLE `expenses`;--> statement-breakpoint
ALTER TABLE `__new_expenses` RENAME TO `expenses`;--> statement-breakpoint
CREATE INDEX `expense_categoryId_idx` ON `expenses` (`category_id`);--> statement-breakpoint
CREATE INDEX `expense_createdBy_idx` ON `expenses` (`created_by`);--> statement-breakpoint
CREATE INDEX `expense_createdAt_idx` ON `expenses` (`created_at`);--> statement-breakpoint
CREATE TABLE `__new_salary_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` real NOT NULL,
	`note` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "salaryPayment_amount_chk" CHECK("__new_salary_payments"."amount" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_salary_payments`("id", "user_id", "amount", "note", "created_by", "created_at", "updated_at") SELECT "id", "user_id", "amount", "note", "created_by", "created_at", "updated_at" FROM `salary_payments`;--> statement-breakpoint
DROP TABLE `salary_payments`;--> statement-breakpoint
ALTER TABLE `__new_salary_payments` RENAME TO `salary_payments`;--> statement-breakpoint
CREATE INDEX `salaryPayment_userId_idx` ON `salary_payments` (`user_id`);--> statement-breakpoint
CREATE INDEX `salaryPayment_createdBy_idx` ON `salary_payments` (`created_by`);--> statement-breakpoint
CREATE INDEX `salaryPayment_createdAt_idx` ON `salary_payments` (`created_at`);--> statement-breakpoint
CREATE TABLE `__new_purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`vendor_invoice_no` text,
	`invoice_id` text,
	`subtotal` real NOT NULL,
	`discount` real DEFAULT 1 NOT NULL,
	`total_amount` real NOT NULL,
	`paid_amount` real DEFAULT 0 NOT NULL,
	`note` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`invoice_id`) REFERENCES `purchase_invoices`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_purchases`("id", "vendor_id", "vendor_invoice_no", "invoice_id", "subtotal", "discount", "total_amount", "paid_amount", "note", "created_by", "created_at", "updated_at") SELECT "id", "vendor_id", "vendor_invoice_no", "invoice_id", "subtotal", "discount", "total_amount", "paid_amount", "note", "created_by", "created_at", "updated_at" FROM `purchases`;--> statement-breakpoint
DROP TABLE `purchases`;--> statement-breakpoint
ALTER TABLE `__new_purchases` RENAME TO `purchases`;--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_vendorInvoice_idx` ON `purchases` (`vendor_id`,`vendor_invoice_no`);--> statement-breakpoint
CREATE INDEX `purchase_vendorId_idx` ON `purchases` (`vendor_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_invoiceId_idx` ON `purchases` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `purchase_createdAt_idx` ON `purchases` (`created_at`);--> statement-breakpoint
CREATE TABLE `__new_purchase_items` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_id` text NOT NULL,
	`medicine_id` text NOT NULL,
	`batch_no` text,
	`tablets_per_strip` integer,
	`strips_per_box` integer,
	`qty_purchased` integer NOT NULL,
	`qty_remaining` integer NOT NULL,
	`cost_per_unit` real NOT NULL,
	`sell_per_unit` real NOT NULL,
	`expiry_date` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`medicine_id`) REFERENCES `medicines`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "purchaseItem_qty_chk" CHECK("__new_purchase_items"."qty_purchased" > 0 AND "__new_purchase_items"."qty_remaining" >= 0 AND "__new_purchase_items"."qty_remaining" <= "__new_purchase_items"."qty_purchased"),
	CONSTRAINT "purchaseItem_packaging_chk" CHECK(("__new_purchase_items"."tablets_per_strip" IS NULL OR "__new_purchase_items"."tablets_per_strip" > 0) AND ("__new_purchase_items"."strips_per_box" IS NULL OR "__new_purchase_items"."strips_per_box" > 0))
);
--> statement-breakpoint
INSERT INTO `__new_purchase_items`("id", "purchase_id", "medicine_id", "batch_no", "tablets_per_strip", "strips_per_box", "qty_purchased", "qty_remaining", "cost_per_unit", "sell_per_unit", "expiry_date", "created_at", "updated_at") SELECT "id", "purchase_id", "medicine_id", "batch_no", "tablets_per_strip", "strips_per_box", "qty_purchased", "qty_remaining", "cost_per_unit", "sell_per_unit", "expiry_date", "created_at", "updated_at" FROM `purchase_items`;--> statement-breakpoint
DROP TABLE `purchase_items`;--> statement-breakpoint
ALTER TABLE `__new_purchase_items` RENAME TO `purchase_items`;--> statement-breakpoint
CREATE INDEX `purchaseItem_purchaseId_idx` ON `purchase_items` (`purchase_id`);--> statement-breakpoint
CREATE INDEX `purchaseItem_medicineExpiry_idx` ON `purchase_items` (`medicine_id`,`expiry_date`);--> statement-breakpoint
CREATE TABLE `__new_purchase_returns` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`purchase_id` text NOT NULL,
	`total_amount` real NOT NULL,
	`reason` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_purchase_returns`("id", "vendor_id", "purchase_id", "total_amount", "reason", "created_by", "created_at", "updated_at") SELECT "id", "vendor_id", "purchase_id", "total_amount", "reason", "created_by", "created_at", "updated_at" FROM `purchase_returns`;--> statement-breakpoint
DROP TABLE `purchase_returns`;--> statement-breakpoint
ALTER TABLE `__new_purchase_returns` RENAME TO `purchase_returns`;--> statement-breakpoint
CREATE INDEX `purchaseReturn_vendorId_idx` ON `purchase_returns` (`vendor_id`);--> statement-breakpoint
CREATE INDEX `purchaseReturn_createdBy_idx` ON `purchase_returns` (`created_by`);--> statement-breakpoint
CREATE TABLE `__new_purchase_return_items` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_return_id` text NOT NULL,
	`purchase_item_id` text NOT NULL,
	`qty` integer NOT NULL,
	`unit_cost` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`purchase_return_id`) REFERENCES `purchase_returns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`purchase_item_id`) REFERENCES `purchase_items`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "purchaseReturnItem_qty_chk" CHECK("__new_purchase_return_items"."qty" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_purchase_return_items`("id", "purchase_return_id", "purchase_item_id", "qty", "unit_cost", "created_at") SELECT "id", "purchase_return_id", "purchase_item_id", "qty", "unit_cost", "created_at" FROM `purchase_return_items`;--> statement-breakpoint
DROP TABLE `purchase_return_items`;--> statement-breakpoint
ALTER TABLE `__new_purchase_return_items` RENAME TO `purchase_return_items`;--> statement-breakpoint
CREATE INDEX `purchaseReturnItem_returnId_idx` ON `purchase_return_items` (`purchase_return_id`);--> statement-breakpoint
CREATE TABLE `__new_sales` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_no` text NOT NULL,
	`customer_id` text,
	`subtotal` real NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`total_amount` real NOT NULL,
	`paid_amount` real DEFAULT 0 NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "sale_walkInPaid_chk" CHECK("__new_sales"."customer_id" IS NOT NULL OR "__new_sales"."paid_amount" = "__new_sales"."total_amount")
);
--> statement-breakpoint
INSERT INTO `__new_sales`("id", "invoice_no", "customer_id", "subtotal", "discount", "total_amount", "paid_amount", "created_by", "created_at", "updated_at") SELECT "id", "invoice_no", "customer_id", "subtotal", "discount", "total_amount", "paid_amount", "created_by", "created_at", "updated_at" FROM `sales`;--> statement-breakpoint
DROP TABLE `sales`;--> statement-breakpoint
ALTER TABLE `__new_sales` RENAME TO `sales`;--> statement-breakpoint
CREATE UNIQUE INDEX `sale_invoiceNo_idx` ON `sales` (`invoice_no`);--> statement-breakpoint
CREATE INDEX `sale_customerId_idx` ON `sales` (`customer_id`);--> statement-breakpoint
CREATE INDEX `sale_createdAt_idx` ON `sales` (`created_at`);--> statement-breakpoint
CREATE INDEX `sale_createdBy_idx` ON `sales` (`created_by`);--> statement-breakpoint
CREATE TABLE `__new_sale_items` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`medicine_id` text NOT NULL,
	`purchase_item_id` text NOT NULL,
	`qty` integer NOT NULL,
	`unit_price` real NOT NULL,
	`unit_cost` real NOT NULL,
	`line_total` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`medicine_id`) REFERENCES `medicines`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`purchase_item_id`) REFERENCES `purchase_items`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "saleItem_qty_chk" CHECK("__new_sale_items"."qty" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_sale_items`("id", "sale_id", "medicine_id", "purchase_item_id", "qty", "unit_price", "unit_cost", "line_total", "created_at") SELECT "id", "sale_id", "medicine_id", "purchase_item_id", "qty", "unit_price", "unit_cost", "line_total", "created_at" FROM `sale_items`;--> statement-breakpoint
DROP TABLE `sale_items`;--> statement-breakpoint
ALTER TABLE `__new_sale_items` RENAME TO `sale_items`;--> statement-breakpoint
CREATE INDEX `saleItem_saleId_idx` ON `sale_items` (`sale_id`);--> statement-breakpoint
CREATE INDEX `saleItem_medicineId_idx` ON `sale_items` (`medicine_id`);--> statement-breakpoint
CREATE INDEX `saleItem_purchaseItemId_idx` ON `sale_items` (`purchase_item_id`);--> statement-breakpoint
CREATE TABLE `__new_vendor_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`purchase_id` text,
	`amount` real NOT NULL,
	`note` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "vendorPayment_amount_chk" CHECK("__new_vendor_payments"."amount" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_vendor_payments`("id", "vendor_id", "purchase_id", "amount", "note", "created_by", "created_at", "updated_at") SELECT "id", "vendor_id", "purchase_id", "amount", "note", "created_by", "created_at", "updated_at" FROM `vendor_payments`;--> statement-breakpoint
DROP TABLE `vendor_payments`;--> statement-breakpoint
ALTER TABLE `__new_vendor_payments` RENAME TO `vendor_payments`;--> statement-breakpoint
CREATE INDEX `vendorPayment_vendorId_idx` ON `vendor_payments` (`vendor_id`);--> statement-breakpoint
CREATE INDEX `vendorPayment_createdAt_idx` ON `vendor_payments` (`created_at`);--> statement-breakpoint
CREATE INDEX `vendorPayment_createdBy_idx` ON `vendor_payments` (`created_by`);