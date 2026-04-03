CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`lineUserId` varchar(128),
	`categoryId` int,
	`walletId` int,
	`name` varchar(100) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`period` enum('daily','weekly','monthly','yearly') NOT NULL DEFAULT 'monthly',
	`alertThreshold` int DEFAULT 80,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`lineUserId` varchar(128),
	`name` varchar(100) NOT NULL,
	`icon` varchar(50) DEFAULT '📦',
	`color` varchar(20) DEFAULT '#6366f1',
	`type` enum('income','expense','both') NOT NULL DEFAULT 'both',
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `line_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lineUserId` varchar(128) NOT NULL,
	`userId` int,
	`displayName` text,
	`pictureUrl` text,
	`plan` enum('free','pro') NOT NULL DEFAULT 'free',
	`stripeCustomerId` varchar(128),
	`stripeSubscriptionId` varchar(128),
	`subscriptionStatus` enum('active','canceled','past_due','trialing'),
	`subscriptionEndsAt` timestamp,
	`notificationsEnabled` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `line_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `line_users_lineUserId_unique` UNIQUE(`lineUserId`)
);
--> statement-breakpoint
CREATE TABLE `recurring_bills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`lineUserId` varchar(128),
	`categoryId` int,
	`walletId` int,
	`name` varchar(100) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`dueDay` int NOT NULL,
	`isActive` boolean DEFAULT true,
	`lastNotifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recurring_bills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`lineUserId` varchar(128),
	`walletId` int,
	`categoryId` int,
	`type` enum('income','expense') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`description` text,
	`tags` text,
	`note` text,
	`receiptImageUrl` text,
	`source` enum('line','web','api') NOT NULL DEFAULT 'web',
	`transactionDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lineUserId` varchar(128),
	`name` varchar(100) NOT NULL,
	`icon` varchar(50) DEFAULT '💰',
	`color` varchar(20) DEFAULT '#6366f1',
	`balance` decimal(15,2) DEFAULT '0.00',
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `plan` enum('free','pro') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lineUserId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('active','canceled','past_due','trialing');--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionEndsAt` timestamp;