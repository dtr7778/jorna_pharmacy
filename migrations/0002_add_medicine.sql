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
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `medicine_categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `medicine_barcode_idx` ON `medicines` (`barcode`);--> statement-breakpoint
CREATE INDEX `medicine_name_idx` ON `medicines` (`name`);--> statement-breakpoint
CREATE INDEX `medicine_categoryId_idx` ON `medicines` (`category_id`);--> statement-breakpoint
CREATE INDEX `medicine_vendorId_idx` ON `medicines` (`vendor_id`);--> statement-breakpoint
CREATE TABLE `medicine_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `medicineCategory_name_idx` ON `medicine_categories` (`name`);