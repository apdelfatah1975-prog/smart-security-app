CREATE TABLE "allowedTechnicianAccounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"email" varchar(320) NOT NULL,
	"displayName" varchar(160) NOT NULL,
	"linkedUserId" integer,
	"passwordHash" varchar(255),
	"isActive" boolean DEFAULT true NOT NULL,
	"menuPermissions" varchar(255) DEFAULT '["workOrders"]' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cashTransactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"transactionType" "cash_transaction_type" NOT NULL,
	"currency" "cash_currency" DEFAULT 'SAR' NOT NULL,
	"amount" integer NOT NULL,
	"category" varchar(100) NOT NULL,
	"transactionDate" timestamp NOT NULL,
	"sourceVisitId" integer,
	"sourceInventoryMovementId" integer,
	"recipientName" varchar(160),
	"notes" text,
	"clientOperationId" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "children" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"fullName" varchar(160) NOT NULL,
	"grade" varchar(80),
	"school" varchar(160),
	"phone" varchar(32),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"manualCode" varchar(64),
	"phone" varchar(32) NOT NULL,
	"address" text,
	"latitude" varchar(32),
	"longitude" varchar(32),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"clientOperationId" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "debts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"personName" varchar(160) NOT NULL,
	"direction" "debt_direction" NOT NULL,
	"totalAmount" integer NOT NULL,
	"paidAmount" integer DEFAULT 0 NOT NULL,
	"dueDate" timestamp,
	"debtStatus" "debt_status" DEFAULT 'open' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exportHistory" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"exportedBy" integer NOT NULL,
	"selectedTables" text NOT NULL,
	"counts" text NOT NULL,
	"fileKey" varchar(512) NOT NULL,
	"generatedAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financeEntries" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"entryType" "finance_entry_type" NOT NULL,
	"category" varchar(100) NOT NULL,
	"amount" integer NOT NULL,
	"entryDate" timestamp NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventoryItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"category" varchar(120) DEFAULT 'عام' NOT NULL,
	"unit" varchar(40) DEFAULT 'قطعة' NOT NULL,
	"reorderLevel" integer DEFAULT 2 NOT NULL,
	"defaultUnitCost" integer DEFAULT 0 NOT NULL,
	"openingQuantity" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"customEmoji" varchar(16),
	"imageKey" varchar(255),
	"imageUrl" varchar(512),
	"clientOperationId" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventoryMovements" (
	"id" serial PRIMARY KEY NOT NULL,
	"inventoryItemId" integer NOT NULL,
	"ownerId" integer NOT NULL,
	"movementType" "inventory_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"unitCost" integer DEFAULT 0 NOT NULL,
	"currency" "cash_currency" DEFAULT 'SAR' NOT NULL,
	"movementDate" timestamp NOT NULL,
	"technicianName" varchar(160),
	"notes" text,
	"clientOperationId" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"childId" integer NOT NULL,
	"teacherId" integer,
	"subject" varchar(120) NOT NULL,
	"lessonDate" timestamp NOT NULL,
	"durationMinutes" integer DEFAULT 60 NOT NULL,
	"cost" integer DEFAULT 0 NOT NULL,
	"lessonStatus" "lesson_status" DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notificationSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"leadDays" integer DEFAULT 1 NOT NULL,
	"alertHour" integer DEFAULT 9 NOT NULL,
	"alertMinute" integer DEFAULT 0 NOT NULL,
	"timezoneOffsetMinutes" integer DEFAULT 180 NOT NULL,
	"companyName" varchar(160),
	"companyWhatsAppPhone" varchar(32),
	"pinHash" varchar(255),
	"scheduleCronTaskUid" varchar(65),
	"backupFileKey" varchar(512),
	"backupGeneratedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personalVehicleVisits" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"vehicleId" integer NOT NULL,
	"visitDate" timestamp NOT NULL,
	"visitType" "vehicle_visit_type" NOT NULL,
	"result" varchar(255),
	"nextDueDate" timestamp,
	"fees" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personalVehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"vehicleType" "vehicle_type" NOT NULL,
	"customType" varchar(100),
	"make" varchar(100),
	"model" varchar(100),
	"color" varchar(60),
	"plateNumber" varchar(64),
	"vin" varchar(100),
	"purchaseDate" timestamp,
	"saleDate" timestamp,
	"ownership" "vehicle_ownership" DEFAULT 'owned' NOT NULL,
	"vehicleLicenseStatus" "vehicle_license_status" DEFAULT 'unlicensed' NOT NULL,
	"licenseNumber" varchar(80),
	"licenseExpiry" timestamp,
	"licenseWithdrawnDate" timestamp,
	"licenseWithdrawalReason" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customerId" integer NOT NULL,
	"visitId" integer NOT NULL,
	"ownerId" integer NOT NULL,
	"reminderDate" timestamp NOT NULL,
	"status" "visit_reminder_status" DEFAULT 'pending' NOT NULL,
	"alertedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "securityAttendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"staffId" integer NOT NULL,
	"attendanceDate" timestamp NOT NULL,
	"shift" "attendance_shift" NOT NULL,
	"status" "attendance_status" NOT NULL,
	"hours" integer DEFAULT 8 NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "securityPatrolPlans" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"staffId" integer,
	"branch" varchar(120) NOT NULL,
	"checkpoint" varchar(160) NOT NULL,
	"planDate" timestamp NOT NULL,
	"patrolShift" "patrol_shift" NOT NULL,
	"repeatWeekly" boolean DEFAULT false NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "securityPatrols" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"staffId" integer,
	"branch" varchar(120) NOT NULL,
	"patrolDate" timestamp NOT NULL,
	"checkpoint" varchar(160),
	"notes" text,
	"photoUrl" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "securityStaff" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"staffCode" varchar(64) NOT NULL,
	"fullName" varchar(160) NOT NULL,
	"nationalId" varchar(32),
	"phone" varchar(32),
	"branch" varchar(120) NOT NULL,
	"atmLocation" varchar(160),
	"staffShift" "staff_shift",
	"hireDate" timestamp,
	"workStartDate" timestamp,
	"emergencyPhone" varchar(32),
	"photoUrl" varchar(512),
	"staffLicenseStatus" "staff_license_status" DEFAULT 'unlicensed' NOT NULL,
	"weaponNumber" varchar(80),
	"licenseNumber" varchar(80),
	"licenseExpiry" timestamp,
	"retirementDate" timestamp,
	"monthlyRate" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "securityWorkLocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"staffId" integer NOT NULL,
	"locationName" varchar(160) NOT NULL,
	"fromDate" timestamp NOT NULL,
	"toDate" timestamp,
	"transferReason" varchar(255),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "serviceTypeItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"serviceTypeId" integer NOT NULL,
	"inventoryItemId" integer NOT NULL,
	"defaultQuantity" integer DEFAULT 1 NOT NULL,
	"isRequired" boolean DEFAULT false NOT NULL,
	"allowEditQuantity" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "serviceTypes" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"code" varchar(64) NOT NULL,
	"name" varchar(160) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teachers" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"fullName" varchar(160) NOT NULL,
	"subject" varchar(120) NOT NULL,
	"phone" varchar(32),
	"monthlyCost" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technicianLocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"technicianId" integer NOT NULL,
	"latitude" varchar(32) NOT NULL,
	"longitude" varchar(32) NOT NULL,
	"accuracy" integer,
	"recordedAt" timestamp NOT NULL,
	"sharingUntil" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(128) NOT NULL,
	"name" text,
	"email" varchar(320),
	"passwordHash" varchar(255),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "visitItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"visitId" integer NOT NULL,
	"inventoryItemId" integer NOT NULL,
	"itemNameSnapshot" varchar(160) NOT NULL,
	"unitSnapshot" varchar(40) NOT NULL,
	"quantity" integer NOT NULL,
	"source" "visit_item_source" DEFAULT 'default' NOT NULL,
	"clientOperationId" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"customerId" integer NOT NULL,
	"ownerId" integer NOT NULL,
	"visitType" "visit_type" NOT NULL,
	"visitDate" timestamp NOT NULL,
	"nextVisitDate" timestamp,
	"technicianName" varchar(160),
	"salesAgentName" varchar(160),
	"filterCount" integer DEFAULT 1 NOT NULL,
	"tdsIn" integer,
	"tdsOut" integer,
	"photoBeforeKey" varchar(512),
	"photoAfterKey" varchar(512),
	"status" "work_order_status" DEFAULT 'assigned' NOT NULL,
	"assignedTechnicianId" integer,
	"arrivedAt" timestamp,
	"completedAt" timestamp,
	"notes" text,
	"visitResult" text,
	"executionOutcome" varchar(32),
	"notCompletedReason" text,
	"clientOperationId" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workOrderProofs" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"visitId" integer NOT NULL,
	"uploadedBy" integer NOT NULL,
	"kind" "work_order_proof_kind" NOT NULL,
	"photoSlot" "work_order_photo_slot",
	"storageKey" varchar(512) NOT NULL,
	"url" varchar(1024) NOT NULL,
	"mimeType" varchar(120) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "allowedTechnicianAccounts" ADD CONSTRAINT "allowedTechnicianAccounts_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allowedTechnicianAccounts" ADD CONSTRAINT "allowedTechnicianAccounts_linkedUserId_users_id_fk" FOREIGN KEY ("linkedUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashTransactions" ADD CONSTRAINT "cashTransactions_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashTransactions" ADD CONSTRAINT "cashTransactions_sourceVisitId_visits_id_fk" FOREIGN KEY ("sourceVisitId") REFERENCES "public"."visits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashTransactions" ADD CONSTRAINT "cashTransactions_sourceInventoryMovementId_inventoryMovements_id_fk" FOREIGN KEY ("sourceInventoryMovementId") REFERENCES "public"."inventoryMovements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exportHistory" ADD CONSTRAINT "exportHistory_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exportHistory" ADD CONSTRAINT "exportHistory_exportedBy_users_id_fk" FOREIGN KEY ("exportedBy") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financeEntries" ADD CONSTRAINT "financeEntries_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventoryItems" ADD CONSTRAINT "inventoryItems_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventoryMovements" ADD CONSTRAINT "inventoryMovements_inventoryItemId_inventoryItems_id_fk" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."inventoryItems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventoryMovements" ADD CONSTRAINT "inventoryMovements_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_childId_children_id_fk" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_teacherId_teachers_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificationSettings" ADD CONSTRAINT "notificationSettings_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personalVehicleVisits" ADD CONSTRAINT "personalVehicleVisits_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personalVehicleVisits" ADD CONSTRAINT "personalVehicleVisits_vehicleId_personalVehicles_id_fk" FOREIGN KEY ("vehicleId") REFERENCES "public"."personalVehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personalVehicles" ADD CONSTRAINT "personalVehicles_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_visitId_visits_id_fk" FOREIGN KEY ("visitId") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "securityAttendance" ADD CONSTRAINT "securityAttendance_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "securityAttendance" ADD CONSTRAINT "securityAttendance_staffId_securityStaff_id_fk" FOREIGN KEY ("staffId") REFERENCES "public"."securityStaff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "securityPatrolPlans" ADD CONSTRAINT "securityPatrolPlans_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "securityPatrolPlans" ADD CONSTRAINT "securityPatrolPlans_staffId_securityStaff_id_fk" FOREIGN KEY ("staffId") REFERENCES "public"."securityStaff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "securityPatrols" ADD CONSTRAINT "securityPatrols_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "securityPatrols" ADD CONSTRAINT "securityPatrols_staffId_securityStaff_id_fk" FOREIGN KEY ("staffId") REFERENCES "public"."securityStaff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "securityStaff" ADD CONSTRAINT "securityStaff_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "securityWorkLocations" ADD CONSTRAINT "securityWorkLocations_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "securityWorkLocations" ADD CONSTRAINT "securityWorkLocations_staffId_securityStaff_id_fk" FOREIGN KEY ("staffId") REFERENCES "public"."securityStaff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serviceTypeItems" ADD CONSTRAINT "serviceTypeItems_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serviceTypeItems" ADD CONSTRAINT "serviceTypeItems_serviceTypeId_serviceTypes_id_fk" FOREIGN KEY ("serviceTypeId") REFERENCES "public"."serviceTypes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serviceTypeItems" ADD CONSTRAINT "serviceTypeItems_inventoryItemId_inventoryItems_id_fk" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."inventoryItems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serviceTypes" ADD CONSTRAINT "serviceTypes_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technicianLocations" ADD CONSTRAINT "technicianLocations_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technicianLocations" ADD CONSTRAINT "technicianLocations_technicianId_users_id_fk" FOREIGN KEY ("technicianId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitItems" ADD CONSTRAINT "visitItems_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitItems" ADD CONSTRAINT "visitItems_visitId_visits_id_fk" FOREIGN KEY ("visitId") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitItems" ADD CONSTRAINT "visitItems_inventoryItemId_inventoryItems_id_fk" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."inventoryItems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_assignedTechnicianId_users_id_fk" FOREIGN KEY ("assignedTechnicianId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workOrderProofs" ADD CONSTRAINT "workOrderProofs_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workOrderProofs" ADD CONSTRAINT "workOrderProofs_visitId_visits_id_fk" FOREIGN KEY ("visitId") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workOrderProofs" ADD CONSTRAINT "workOrderProofs_uploadedBy_users_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "allowed_technician_owner_email_unique" ON "allowedTechnicianAccounts" USING btree ("ownerId","email");--> statement-breakpoint
CREATE INDEX "allowed_technician_linked_user_idx" ON "allowedTechnicianAccounts" USING btree ("linkedUserId");--> statement-breakpoint
CREATE INDEX "cash_transactions_owner_date_idx" ON "cashTransactions" USING btree ("ownerId","transactionDate");--> statement-breakpoint
CREATE UNIQUE INDEX "cash_transactions_owner_operation_unique" ON "cashTransactions" USING btree ("ownerId","clientOperationId");--> statement-breakpoint
CREATE INDEX "cash_transactions_source_visit_idx" ON "cashTransactions" USING btree ("ownerId","sourceVisitId");--> statement-breakpoint
CREATE INDEX "cash_transactions_source_inventory_idx" ON "cashTransactions" USING btree ("ownerId","sourceInventoryMovementId");--> statement-breakpoint
CREATE INDEX "children_owner_idx" ON "children" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "customers_owner_idx" ON "customers" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_owner_operation_unique" ON "customers" USING btree ("ownerId","clientOperationId");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_owner_manual_code_unique" ON "customers" USING btree ("ownerId","manualCode");--> statement-breakpoint
CREATE INDEX "debts_owner_due_idx" ON "debts" USING btree ("ownerId","dueDate");--> statement-breakpoint
CREATE INDEX "debts_owner_status_idx" ON "debts" USING btree ("ownerId","debtStatus");--> statement-breakpoint
CREATE INDEX "export_history_owner_created_idx" ON "exportHistory" USING btree ("ownerId","createdAt");--> statement-breakpoint
CREATE INDEX "finance_entries_owner_date_idx" ON "financeEntries" USING btree ("ownerId","entryDate");--> statement-breakpoint
CREATE INDEX "finance_entries_owner_type_idx" ON "financeEntries" USING btree ("ownerId","entryType");--> statement-breakpoint
CREATE INDEX "inventory_items_owner_idx" ON "inventoryItems" USING btree ("ownerId");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_items_owner_operation_unique" ON "inventoryItems" USING btree ("ownerId","clientOperationId");--> statement-breakpoint
CREATE INDEX "inventory_movements_item_idx" ON "inventoryMovements" USING btree ("inventoryItemId");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_movements_owner_operation_unique" ON "inventoryMovements" USING btree ("ownerId","clientOperationId");--> statement-breakpoint
CREATE INDEX "inventory_movements_owner_date_idx" ON "inventoryMovements" USING btree ("ownerId","movementDate");--> statement-breakpoint
CREATE INDEX "inventory_movements_purchase_idx" ON "inventoryMovements" USING btree ("ownerId","movementType","movementDate");--> statement-breakpoint
CREATE INDEX "lessons_owner_date_idx" ON "lessons" USING btree ("ownerId","lessonDate");--> statement-breakpoint
CREATE INDEX "lessons_child_idx" ON "lessons" USING btree ("childId");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_settings_owner_unique" ON "notificationSettings" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "notification_settings_schedule_idx" ON "notificationSettings" USING btree ("scheduleCronTaskUid");--> statement-breakpoint
CREATE INDEX "personal_vehicle_visits_owner_date_idx" ON "personalVehicleVisits" USING btree ("ownerId","visitDate");--> statement-breakpoint
CREATE INDEX "personal_vehicle_visits_vehicle_idx" ON "personalVehicleVisits" USING btree ("vehicleId");--> statement-breakpoint
CREATE INDEX "personal_vehicles_owner_idx" ON "personalVehicles" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "personal_vehicles_license_idx" ON "personalVehicles" USING btree ("ownerId","licenseExpiry");--> statement-breakpoint
CREATE INDEX "reminders_owner_status_date_idx" ON "reminders" USING btree ("ownerId","status","reminderDate");--> statement-breakpoint
CREATE INDEX "reminders_customer_idx" ON "reminders" USING btree ("customerId");--> statement-breakpoint
CREATE INDEX "security_attendance_owner_date_idx" ON "securityAttendance" USING btree ("ownerId","attendanceDate");--> statement-breakpoint
CREATE INDEX "security_attendance_staff_idx" ON "securityAttendance" USING btree ("staffId");--> statement-breakpoint
CREATE INDEX "security_patrol_plans_owner_date_idx" ON "securityPatrolPlans" USING btree ("ownerId","planDate");--> statement-breakpoint
CREATE INDEX "security_patrol_plans_checkpoint_idx" ON "securityPatrolPlans" USING btree ("ownerId","checkpoint");--> statement-breakpoint
CREATE INDEX "security_patrols_owner_date_idx" ON "securityPatrols" USING btree ("ownerId","patrolDate");--> statement-breakpoint
CREATE INDEX "security_patrols_branch_idx" ON "securityPatrols" USING btree ("ownerId","branch");--> statement-breakpoint
CREATE UNIQUE INDEX "security_staff_owner_code_unique" ON "securityStaff" USING btree ("ownerId","staffCode");--> statement-breakpoint
CREATE INDEX "security_staff_owner_idx" ON "securityStaff" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "security_staff_branch_idx" ON "securityStaff" USING btree ("ownerId","branch");--> statement-breakpoint
CREATE INDEX "security_work_locations_owner_staff_idx" ON "securityWorkLocations" USING btree ("ownerId","staffId");--> statement-breakpoint
CREATE INDEX "security_work_locations_date_idx" ON "securityWorkLocations" USING btree ("ownerId","fromDate");--> statement-breakpoint
CREATE UNIQUE INDEX "service_type_items_owner_service_item_unique" ON "serviceTypeItems" USING btree ("ownerId","serviceTypeId","inventoryItemId");--> statement-breakpoint
CREATE INDEX "service_type_items_service_idx" ON "serviceTypeItems" USING btree ("serviceTypeId");--> statement-breakpoint
CREATE UNIQUE INDEX "service_types_owner_code_unique" ON "serviceTypes" USING btree ("ownerId","code");--> statement-breakpoint
CREATE INDEX "teachers_owner_subject_idx" ON "teachers" USING btree ("ownerId","subject");--> statement-breakpoint
CREATE UNIQUE INDEX "technician_locations_owner_technician_unique" ON "technicianLocations" USING btree ("ownerId","technicianId");--> statement-breakpoint
CREATE INDEX "technician_locations_owner_updated_idx" ON "technicianLocations" USING btree ("ownerId","updatedAt");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "visit_items_visit_idx" ON "visitItems" USING btree ("visitId");--> statement-breakpoint
CREATE UNIQUE INDEX "visit_items_owner_operation_unique" ON "visitItems" USING btree ("ownerId","clientOperationId");--> statement-breakpoint
CREATE INDEX "visits_owner_date_idx" ON "visits" USING btree ("ownerId","visitDate");--> statement-breakpoint
CREATE INDEX "visits_customer_idx" ON "visits" USING btree ("customerId");--> statement-breakpoint
CREATE UNIQUE INDEX "visits_owner_operation_unique" ON "visits" USING btree ("ownerId","clientOperationId");--> statement-breakpoint
CREATE INDEX "work_order_proofs_owner_visit_idx" ON "workOrderProofs" USING btree ("ownerId","visitId");--> statement-breakpoint
CREATE INDEX "work_order_proofs_uploaded_by_idx" ON "workOrderProofs" USING btree ("uploadedBy");