CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientPhone` varchar(20) NOT NULL,
	`clientName` varchar(255),
	`channel` varchar(50) NOT NULL DEFAULT 'whatsapp',
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	`messageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`content` text NOT NULL,
	`sender` enum('client','ai','human') NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
