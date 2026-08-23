CREATE TABLE `children` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`fullName` varchar(160) NOT NULL,
	`grade` varchar(80),
	`school` varchar(160),
	`phone` varchar(32),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `children_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`personName` varchar(160) NOT NULL,
	`direction` enum('receivable','payable') NOT NULL,
	`totalAmount` int NOT NULL,
	`paidAmount` int NOT NULL DEFAULT 0,
	`dueDate` timestamp,
	`debtStatus` enum('open','partial','settled') NOT NULL DEFAULT 'open',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financeEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`entryType` enum('income','expense') NOT NULL,
	`category` varchar(100) NOT NULL,
	`amount` int NOT NULL,
	`entryDate` timestamp NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financeEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`childId` int NOT NULL,
	`teacherId` int,
	`subject` varchar(120) NOT NULL,
	`lessonDate` timestamp NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 60,
	`cost` int NOT NULL DEFAULT 0,
	`lessonStatus` enum('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personalVehicleVisits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`visitDate` timestamp NOT NULL,
	`vehicleVisitType` enum('inspection','renewal','license','withdrawal','other') NOT NULL,
	`result` varchar(255),
	`nextDueDate` timestamp,
	`fees` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `personalVehicleVisits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personalVehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`vehicleType` enum('car','motorcycle','tuk_tuk','other') NOT NULL,
	`customType` varchar(100),
	`make` varchar(100),
	`model` varchar(100),
	`color` varchar(60),
	`plateNumber` varchar(64),
	`vin` varchar(100),
	`purchaseDate` timestamp,
	`saleDate` timestamp,
	`ownership` enum('owned','sold','leased') NOT NULL DEFAULT 'owned',
	`vehicleLicenseStatus` enum('valid','expired','withdrawn','unlicensed') NOT NULL DEFAULT 'unlicensed',
	`licenseNumber` varchar(80),
	`licenseExpiry` timestamp,
	`licenseWithdrawnDate` timestamp,
	`licenseWithdrawalReason` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personalVehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityAttendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`staffId` int NOT NULL,
	`attendanceDate` timestamp NOT NULL,
	`shift` enum('morning','evening','night','off','leave') NOT NULL,
	`status` enum('present','absent','excused') NOT NULL,
	`hours` int NOT NULL DEFAULT 8,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `securityAttendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityPatrolPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`staffId` int,
	`branch` varchar(120) NOT NULL,
	`checkpoint` varchar(160) NOT NULL,
	`planDate` timestamp NOT NULL,
	`patrolShift` enum('morning','evening','night','off') NOT NULL,
	`repeatWeekly` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `securityPatrolPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityPatrols` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`staffId` int,
	`branch` varchar(120) NOT NULL,
	`patrolDate` timestamp NOT NULL,
	`checkpoint` varchar(160),
	`notes` text,
	`photoUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `securityPatrols_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityStaff` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`staffCode` varchar(64) NOT NULL,
	`fullName` varchar(160) NOT NULL,
	`nationalId` varchar(32),
	`phone` varchar(32),
	`branch` varchar(120) NOT NULL,
	`atmLocation` varchar(160),
	`staffShift` enum('morning','evening','night','off'),
	`hireDate` timestamp,
	`workStartDate` timestamp,
	`emergencyPhone` varchar(32),
	`photoUrl` varchar(512),
	`staffLicenseStatus` enum('licensed','unlicensed') NOT NULL DEFAULT 'unlicensed',
	`weaponNumber` varchar(80),
	`licenseNumber` varchar(80),
	`licenseExpiry` timestamp,
	`retirementDate` timestamp,
	`monthlyRate` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `securityStaff_id` PRIMARY KEY(`id`),
	CONSTRAINT `security_staff_owner_code_unique` UNIQUE(`ownerId`,`staffCode`)
);
--> statement-breakpoint
CREATE TABLE `securityWorkLocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`staffId` int NOT NULL,
	`locationName` varchar(160) NOT NULL,
	`fromDate` timestamp NOT NULL,
	`toDate` timestamp,
	`transferReason` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `securityWorkLocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`fullName` varchar(160) NOT NULL,
	`subject` varchar(120) NOT NULL,
	`phone` varchar(32),
	`monthlyCost` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teachers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `children` ADD CONSTRAINT `children_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `debts` ADD CONSTRAINT `debts_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financeEntries` ADD CONSTRAINT `financeEntries_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_childId_children_id_fk` FOREIGN KEY (`childId`) REFERENCES `children`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_teacherId_teachers_id_fk` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `personalVehicleVisits` ADD CONSTRAINT `personalVehicleVisits_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `personalVehicleVisits` ADD CONSTRAINT `personalVehicleVisits_vehicleId_personalVehicles_id_fk` FOREIGN KEY (`vehicleId`) REFERENCES `personalVehicles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `personalVehicles` ADD CONSTRAINT `personalVehicles_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityAttendance` ADD CONSTRAINT `securityAttendance_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityAttendance` ADD CONSTRAINT `securityAttendance_staffId_securityStaff_id_fk` FOREIGN KEY (`staffId`) REFERENCES `securityStaff`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityPatrolPlans` ADD CONSTRAINT `securityPatrolPlans_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityPatrolPlans` ADD CONSTRAINT `securityPatrolPlans_staffId_securityStaff_id_fk` FOREIGN KEY (`staffId`) REFERENCES `securityStaff`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityPatrols` ADD CONSTRAINT `securityPatrols_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityPatrols` ADD CONSTRAINT `securityPatrols_staffId_securityStaff_id_fk` FOREIGN KEY (`staffId`) REFERENCES `securityStaff`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityStaff` ADD CONSTRAINT `securityStaff_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityWorkLocations` ADD CONSTRAINT `securityWorkLocations_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityWorkLocations` ADD CONSTRAINT `securityWorkLocations_staffId_securityStaff_id_fk` FOREIGN KEY (`staffId`) REFERENCES `securityStaff`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teachers` ADD CONSTRAINT `teachers_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `children_owner_idx` ON `children` (`ownerId`);--> statement-breakpoint
CREATE INDEX `debts_owner_due_idx` ON `debts` (`ownerId`,`dueDate`);--> statement-breakpoint
CREATE INDEX `debts_owner_status_idx` ON `debts` (`ownerId`,`debtStatus`);--> statement-breakpoint
CREATE INDEX `finance_entries_owner_date_idx` ON `financeEntries` (`ownerId`,`entryDate`);--> statement-breakpoint
CREATE INDEX `finance_entries_owner_type_idx` ON `financeEntries` (`ownerId`,`entryType`);--> statement-breakpoint
CREATE INDEX `lessons_owner_date_idx` ON `lessons` (`ownerId`,`lessonDate`);--> statement-breakpoint
CREATE INDEX `lessons_child_idx` ON `lessons` (`childId`);--> statement-breakpoint
CREATE INDEX `personal_vehicle_visits_owner_date_idx` ON `personalVehicleVisits` (`ownerId`,`visitDate`);--> statement-breakpoint
CREATE INDEX `personal_vehicle_visits_vehicle_idx` ON `personalVehicleVisits` (`vehicleId`);--> statement-breakpoint
CREATE INDEX `personal_vehicles_owner_idx` ON `personalVehicles` (`ownerId`);--> statement-breakpoint
CREATE INDEX `personal_vehicles_license_idx` ON `personalVehicles` (`ownerId`,`licenseExpiry`);--> statement-breakpoint
CREATE INDEX `security_attendance_owner_date_idx` ON `securityAttendance` (`ownerId`,`attendanceDate`);--> statement-breakpoint
CREATE INDEX `security_attendance_staff_idx` ON `securityAttendance` (`staffId`);--> statement-breakpoint
CREATE INDEX `security_patrol_plans_owner_date_idx` ON `securityPatrolPlans` (`ownerId`,`planDate`);--> statement-breakpoint
CREATE INDEX `security_patrol_plans_checkpoint_idx` ON `securityPatrolPlans` (`ownerId`,`checkpoint`);--> statement-breakpoint
CREATE INDEX `security_patrols_owner_date_idx` ON `securityPatrols` (`ownerId`,`patrolDate`);--> statement-breakpoint
CREATE INDEX `security_patrols_branch_idx` ON `securityPatrols` (`ownerId`,`branch`);--> statement-breakpoint
CREATE INDEX `security_staff_owner_idx` ON `securityStaff` (`ownerId`);--> statement-breakpoint
CREATE INDEX `security_staff_branch_idx` ON `securityStaff` (`ownerId`,`branch`);--> statement-breakpoint
CREATE INDEX `security_work_locations_owner_staff_idx` ON `securityWorkLocations` (`ownerId`,`staffId`);--> statement-breakpoint
CREATE INDEX `security_work_locations_date_idx` ON `securityWorkLocations` (`ownerId`,`fromDate`);--> statement-breakpoint
CREATE INDEX `teachers_owner_subject_idx` ON `teachers` (`ownerId`,`subject`);