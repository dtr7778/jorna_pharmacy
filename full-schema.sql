CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`address` text,
	`note` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE INDEX `customer_phone_idx` ON `customers` (`phone`);
CREATE INDEX `customer_name_idx` ON `customers` (`name`);
CREATE TABLE `customer_payments` (
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
	CONSTRAINT "customerPayment_amount_chk" CHECK("customer_payments"."amount" > 0)
);

CREATE INDEX `customerPayment_customerId_idx` ON `customer_payments` (`customer_id`);
CREATE INDEX `customerPayment_saleId_idx` ON `customer_payments` (`sale_id`);
CREATE INDEX `customerPayment_createdAt_idx` ON `customer_payments` (`created_at`);
CREATE TABLE `cash_closings` (
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
	CONSTRAINT "cashClosing_period_chk" CHECK("cash_closings"."period_end" > "cash_closings"."period_start")
);

CREATE INDEX `cashClosing_closedBy_idx` ON `cash_closings` (`closed_by`);
CREATE INDEX `cashClosing_periodStart_idx` ON `cash_closings` (`period_start`);
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`amount` real NOT NULL,
	`note` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `expense_categories`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "expense_amount_chk" CHECK("expenses"."amount" > 0)
);

CREATE INDEX `expense_categoryId_idx` ON `expenses` (`category_id`);
CREATE INDEX `expense_createdBy_idx` ON `expenses` (`created_by`);
CREATE INDEX `expense_createdAt_idx` ON `expenses` (`created_at`);
CREATE TABLE `expense_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE UNIQUE INDEX `expenseCategory_name_idx` ON `expense_categories` (`name`);
CREATE TABLE `salary_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` real NOT NULL,
	`note` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "salaryPayment_amount_chk" CHECK("salary_payments"."amount" > 0)
);

CREATE INDEX `salaryPayment_userId_idx` ON `salary_payments` (`user_id`);
CREATE INDEX `salaryPayment_createdBy_idx` ON `salary_payments` (`created_by`);
CREATE INDEX `salaryPayment_createdAt_idx` ON `salary_payments` (`created_at`);
CREATE TABLE `medicines` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`generic_name` text,
	`strength` text,
	`category_id` text,
	`vendor_id` text,
	`type` text NOT NULL,
	`base_unit` text NOT NULL,
	`barcode` text,
	`rack_location` text,
	`minimum_stock` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `medicine_categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE INDEX `medicine_barcode_idx` ON `medicines` (`barcode`);
CREATE INDEX `medicine_name_idx` ON `medicines` (`name`);
CREATE INDEX `medicine_categoryId_idx` ON `medicines` (`category_id`);
CREATE INDEX `medicine_vendorId_idx` ON `medicines` (`vendor_id`);
CREATE TABLE `medicine_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE UNIQUE INDEX `medicineCategory_name_idx` ON `medicine_categories` (`name`);
CREATE TABLE `purchases` (
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

CREATE UNIQUE INDEX `purchase_vendorInvoice_idx` ON `purchases` (`vendor_id`,`vendor_invoice_no`);
CREATE INDEX `purchase_vendorId_idx` ON `purchases` (`vendor_id`);
CREATE UNIQUE INDEX `purchase_invoiceId_idx` ON `purchases` (`invoice_id`);
CREATE INDEX `purchase_createdAt_idx` ON `purchases` (`created_at`);
CREATE TABLE `purchase_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`is_linked` integer DEFAULT false NOT NULL,
	`reserved_by` text,
	`reserved_until` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`reserved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE UNIQUE INDEX `purchase_invoice_number_idx` ON `purchase_invoices` (`number`);
CREATE INDEX `purchase_invoice_reservation_idx` ON `purchase_invoices` (`is_linked`,`reserved_until`);
CREATE TABLE `purchase_items` (
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
	CONSTRAINT "purchaseItem_qty_chk" CHECK("purchase_items"."qty_purchased" > 0 AND "purchase_items"."qty_remaining" >= 0 AND "purchase_items"."qty_remaining" <= "purchase_items"."qty_purchased"),
	CONSTRAINT "purchaseItem_packaging_chk" CHECK(("purchase_items"."tablets_per_strip" IS NULL OR "purchase_items"."tablets_per_strip" > 0) AND ("purchase_items"."strips_per_box" IS NULL OR "purchase_items"."strips_per_box" > 0))
);

CREATE INDEX `purchaseItem_purchaseId_idx` ON `purchase_items` (`purchase_id`);
CREATE INDEX `purchaseItem_medicineExpiry_idx` ON `purchase_items` (`medicine_id`,`expiry_date`);
CREATE TABLE `purchase_returns` (
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

CREATE INDEX `purchaseReturn_vendorId_idx` ON `purchase_returns` (`vendor_id`);
CREATE INDEX `purchaseReturn_createdBy_idx` ON `purchase_returns` (`created_by`);
CREATE TABLE `purchase_return_items` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_return_id` text NOT NULL,
	`purchase_item_id` text NOT NULL,
	`qty` integer NOT NULL,
	`unit_cost` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`purchase_return_id`) REFERENCES `purchase_returns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`purchase_item_id`) REFERENCES `purchase_items`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "purchaseReturnItem_qty_chk" CHECK("purchase_return_items"."qty" > 0)
);

CREATE INDEX `purchaseReturnItem_returnId_idx` ON `purchase_return_items` (`purchase_return_id`);
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`level` text NOT NULL,
	`resource` text NOT NULL,
	`action` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE UNIQUE INDEX `permission_level_resource_action_key` ON `permissions` (`level`,`resource`,`action`);
CREATE INDEX `permission_level_idx` ON `permissions` (`level`);
CREATE INDEX `permission_resource_idx` ON `permissions` (`resource`);
CREATE INDEX `permission_action_idx` ON `permissions` (`action`);
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`role_name` text DEFAULT 'USER' NOT NULL,
	`description` text
);

CREATE UNIQUE INDEX `role_name_unique` ON `roles` (`role_name`);
CREATE TABLE `role_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`role_id` text NOT NULL,
	`permission_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX `role_permission_unique` ON `role_permissions` (`role_id`,`permission_id`);
CREATE INDEX `role_permission_role_idx` ON `role_permissions` (`role_id`);
CREATE INDEX `role_permission_permission_idx` ON `role_permissions` (`permission_id`);
CREATE TABLE `user_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`role_id` text NOT NULL,
	`user_id` text NOT NULL,
	`assigned_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX `user_role_unique` ON `user_roles` (`user_id`,`role_id`);
CREATE INDEX `user_role_role_id_idx` ON `user_roles` (`role_id`);
CREATE INDEX `user_role_user_id_idx` ON `user_roles` (`user_id`);
CREATE TABLE `sales` (
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
	CONSTRAINT "sale_walkInPaid_chk" CHECK("sales"."customer_id" IS NOT NULL OR "sales"."paid_amount" = "sales"."total_amount")
);

CREATE UNIQUE INDEX `sale_invoiceNo_idx` ON `sales` (`invoice_no`);
CREATE INDEX `sale_customerId_idx` ON `sales` (`customer_id`);
CREATE INDEX `sale_createdAt_idx` ON `sales` (`created_at`);
CREATE INDEX `sale_createdBy_idx` ON `sales` (`created_by`);
CREATE TABLE `sale_items` (
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
	CONSTRAINT "saleItem_qty_chk" CHECK("sale_items"."qty" > 0)
);

CREATE INDEX `saleItem_saleId_idx` ON `sale_items` (`sale_id`);
CREATE INDEX `saleItem_medicineId_idx` ON `sale_items` (`medicine_id`);
CREATE INDEX `saleItem_purchaseItemId_idx` ON `sale_items` (`purchase_item_id`);
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text NOT NULL,
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`locale` text DEFAULT 'en-US' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE UNIQUE INDEX `user_email_key` ON `users` (`email`);
CREATE TABLE `user_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`browser` text,
	`os` text,
	`device_type` text,
	`first_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`last_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX `user_device_user_fingerprint_idx` ON `user_devices` (`user_id`,`fingerprint`);
CREATE INDEX `user_device_user_id_idx` ON `user_devices` (`user_id`);
CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`device_id` text,
	`session_id` text NOT NULL,
	`login_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`last_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`logout_at` integer,
	`expires_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_id`) REFERENCES `user_devices`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE INDEX `user_session_user_id_idx` ON `user_sessions` (`user_id`);
CREATE UNIQUE INDEX `user_session_session_id_idx` ON `user_sessions` (`session_id`);
CREATE INDEX `user_session_login_at_idx` ON `user_sessions` (`login_at`);
CREATE INDEX `user_session_last_seen_at_idx` ON `user_sessions` (`last_seen_at`);
CREATE TABLE `user_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`email` text,
	`event` text NOT NULL,
	`session_id` text,
	`device_id` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_id`) REFERENCES `user_devices`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE INDEX `user_event_user_id_idx` ON `user_events` (`user_id`);
CREATE INDEX `user_event_event_idx` ON `user_events` (`event`);
CREATE INDEX `user_event_created_at_idx` ON `user_events` (`created_at`);
CREATE INDEX `user_event_session_id_idx` ON `user_events` (`session_id`);
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

CREATE INDEX `vendor_name_idx` ON `vendors` (`name`);
CREATE TABLE `vendor_payments` (
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
	CONSTRAINT "vendorPayment_amount_chk" CHECK("vendor_payments"."amount" > 0)
);

CREATE INDEX `vendorPayment_vendorId_idx` ON `vendor_payments` (`vendor_id`);
CREATE INDEX `vendorPayment_createdAt_idx` ON `vendor_payments` (`created_at`);
CREATE INDEX `vendorPayment_createdBy_idx` ON `vendor_payments` (`created_by`);
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX `account_accountProvider_accountId_idx` ON `accounts` (`provider_id`,`account_id`);
CREATE INDEX `account_userId_idx` ON `accounts` (`user_id`);
CREATE TABLE `addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text DEFAULT 'other' NOT NULL,
	`street_line_1` text NOT NULL,
	`street_line_2` text,
	`city` text NOT NULL,
	`state` text,
	`zip_code` text NOT NULL,
	`country` text NOT NULL,
	`latitude` numeric,
	`longitude` numeric,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`impersonated_by` text,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX `session_token_idx` ON `sessions` (`token`);
CREATE INDEX `session_userId_idx` ON `sessions` (`user_id`);
CREATE INDEX `session_expiresAt_idx` ON `sessions` (`expires_at`);
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

CREATE INDEX `stockMovement_purchaseItemId_idx` ON `stock_movements` (`purchase_item_id`);
CREATE INDEX `stockMovement_ref_idx` ON `stock_movements` (`ref_table`,`ref_id`);
CREATE INDEX `stockMovement_createdAt_idx` ON `stock_movements` (`created_at`);
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);

