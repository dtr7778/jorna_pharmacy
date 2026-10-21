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
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_invoice_number_idx` ON `purchase_invoices` (`number`);--> statement-breakpoint
CREATE INDEX `purchase_invoice_reservation_idx` ON `purchase_invoices` (`is_linked`,`reserved_until`);--> statement-breakpoint
INSERT INTO `purchase_invoices`("id", "number", "is_linked", "created_at", "updated_at") SELECT "id", "invoice_no", 1, "created_at", "updated_at" FROM `purchases`;--> statement-breakpoint
DROP INDEX `purchase_invoice_idx`;--> statement-breakpoint
ALTER TABLE `purchases` ADD `invoice_id` text REFERENCES purchase_invoices(id);--> statement-breakpoint
UPDATE `purchases` SET `invoice_id` = `id`;--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_invoiceId_idx` ON `purchases` (`invoice_id`);--> statement-breakpoint
ALTER TABLE `purchases` DROP COLUMN `invoice_no`;--> statement-breakpoint
DROP TABLE IF EXISTS `purchase_invoice_counters`;
