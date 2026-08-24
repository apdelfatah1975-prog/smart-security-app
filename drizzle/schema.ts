import { boolean, index, integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { cashCurrencies, cashTransactionTypes } from "../shared/cashBusiness";

const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
const visitTypeEnum = pgEnum("visit_type", ["installation", "maintenance", "cartridge_change", "follow_up", "other"]);
const workOrderStatusEnum = pgEnum("work_order_status", ["assigned", "en_route", "arrived", "in_progress", "completed", "postponed", "cancelled"]);
const visitReminderStatusEnum = pgEnum("visit_reminder_status", ["pending", "completed", "dismissed"]);
const inventoryMovementTypeEnum = pgEnum("inventory_movement_type", ["incoming", "outgoing"]);
const cashCurrencyEnum = pgEnum("cash_currency", cashCurrencies);
const cashTransactionTypeEnum = pgEnum("cash_transaction_type", cashTransactionTypes);
const visitItemSourceEnum = pgEnum("visit_item_source", ["default", "manual"]);
const workOrderProofKindEnum = pgEnum("work_order_proof_kind", ["photo", "signature", "audio"]);
const workOrderPhotoSlotEnum = pgEnum("work_order_photo_slot", ["before", "after", "general"]);
const staffShiftEnum = pgEnum("staff_shift", ["morning", "evening", "night", "off"]);
const staffLicenseStatusEnum = pgEnum("staff_license_status", ["licensed", "unlicensed"]);
const attendanceShiftEnum = pgEnum("attendance_shift", ["morning", "evening", "night", "off", "leave"]);
const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "excused"]);
const financeEntryTypeEnum = pgEnum("finance_entry_type", ["income", "expense"]);
const debtDirectionEnum = pgEnum("debt_direction", ["receivable", "payable"]);
const debtStatusEnum = pgEnum("debt_status", ["open", "partial", "settled"]);
const lessonStatusEnum = pgEnum("lesson_status", ["scheduled", "completed", "cancelled"]);
const patrolShiftEnum = pgEnum("patrol_shift", ["morning", "evening", "night", "off"]);
const vehicleTypeEnum = pgEnum("vehicle_type", ["car", "motorcycle", "tuk_tuk", "other"]);
const vehicleOwnershipEnum = pgEnum("vehicle_ownership", ["owned", "sold", "leased"]);
const vehicleLicenseStatusEnum = pgEnum("vehicle_license_status", ["valid", "expired", "withdrawn", "unlicensed"]);
const vehicleVisitTypeEnum = pgEnum("vehicle_visit_type", ["inspection", "renewal", "license", "withdrawal", "other"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Stable local identifier; legacy rows may retain their previous value. */
  openId: varchar("openId", { length: 128 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, table => [index("users_email_idx").on(table.email)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const allowedTechnicianAccounts = pgTable(
  "allowedTechnicianAccounts",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }).notNull(),
    displayName: varchar("displayName", { length: 160 }).notNull(),
    linkedUserId: integer("linkedUserId").references(() => users.id, { onDelete: "set null" }),
    passwordHash: varchar("passwordHash", { length: 255 }),
    isActive: boolean("isActive").default(true).notNull(),
    menuPermissions: varchar("menuPermissions", { length: 255 }).default('["workOrders"]').notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [
    uniqueIndex("allowed_technician_owner_email_unique").on(table.ownerId, table.email),
    index("allowed_technician_linked_user_idx").on(table.linkedUserId),
  ],
);

export type AllowedTechnicianAccount = typeof allowedTechnicianAccounts.$inferSelect;
export type InsertAllowedTechnicianAccount = typeof allowedTechnicianAccounts.$inferInsert;

export const technicianLocations = pgTable(
  "technicianLocations",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    technicianId: integer("technicianId").notNull().references(() => users.id, { onDelete: "cascade" }),
    latitude: varchar("latitude", { length: 32 }).notNull(),
    longitude: varchar("longitude", { length: 32 }).notNull(),
    accuracy: integer("accuracy"),
    recordedAt: timestamp("recordedAt").notNull(),
    sharingUntil: timestamp("sharingUntil"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [
    uniqueIndex("technician_locations_owner_technician_unique").on(table.ownerId, table.technicianId),
    index("technician_locations_owner_updated_idx").on(table.ownerId, table.updatedAt),
  ],
);

export const visitTypeValues = [
  "installation",
  "maintenance",
  "cartridge_change",
  "follow_up",
  "other",
] as const;

export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    manualCode: varchar("manualCode", { length: 64 }),
    phone: varchar("phone", { length: 32 }).notNull(),
    address: text("address"),
    latitude: varchar("latitude", { length: 32 }),
    longitude: varchar("longitude", { length: 32 }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
    clientOperationId: varchar("clientOperationId", { length: 64 }),
  },
  table => [
    index("customers_owner_idx").on(table.ownerId),
    index("customers_phone_idx").on(table.phone),
    uniqueIndex("customers_owner_operation_unique").on(table.ownerId, table.clientOperationId),
    uniqueIndex("customers_owner_manual_code_unique").on(table.ownerId, table.manualCode),
  ],
);

export const visits = pgTable(
  "visits",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customerId").notNull().references(() => customers.id, { onDelete: "cascade" }),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    visitType: visitTypeEnum("visitType").notNull(),
    visitDate: timestamp("visitDate").notNull(),
    nextVisitDate: timestamp("nextVisitDate"),
    technicianName: varchar("technicianName", { length: 160 }),
    salesAgentName: varchar("salesAgentName", { length: 160 }),
    filterCount: integer("filterCount").default(1).notNull(),
    tdsIn: integer("tdsIn"),
    tdsOut: integer("tdsOut"),
    photoBeforeKey: varchar("photoBeforeKey", { length: 512 }),
    photoAfterKey: varchar("photoAfterKey", { length: 512 }),
    status: workOrderStatusEnum("status").default("assigned").notNull(),
    assignedTechnicianId: integer("assignedTechnicianId").references(() => users.id, { onDelete: "set null" }),
    arrivedAt: timestamp("arrivedAt"),
    completedAt: timestamp("completedAt"),
    notes: text("notes"),
    visitResult: text("visitResult"),
    executionOutcome: varchar("executionOutcome", { length: 32 }),
    notCompletedReason: text("notCompletedReason"),
    clientOperationId: varchar("clientOperationId", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("visits_owner_date_idx").on(table.ownerId, table.visitDate),
    index("visits_customer_idx").on(table.customerId),
    uniqueIndex("visits_owner_operation_unique").on(table.ownerId, table.clientOperationId),
  ],
);

export const reminders = pgTable(
  "reminders",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customerId").notNull().references(() => customers.id, { onDelete: "cascade" }),
    visitId: integer("visitId").notNull().references(() => visits.id, { onDelete: "cascade" }),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    reminderDate: timestamp("reminderDate").notNull(),
    status: visitReminderStatusEnum("status").default("pending").notNull(),
    alertedAt: timestamp("alertedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [
    index("reminders_owner_status_date_idx").on(table.ownerId, table.status, table.reminderDate),
    index("reminders_customer_idx").on(table.customerId),
  ],
);

export const notificationSettings = pgTable(
  "notificationSettings",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    leadDays: integer("leadDays").default(1).notNull(),
    alertHour: integer("alertHour").default(9).notNull(),
    alertMinute: integer("alertMinute").default(0).notNull(),
    timezoneOffsetMinutes: integer("timezoneOffsetMinutes").default(180).notNull(),
    companyName: varchar("companyName", { length: 160 }),
    companyWhatsAppPhone: varchar("companyWhatsAppPhone", { length: 32 }),
    pinHash: varchar("pinHash", { length: 255 }),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
    backupFileKey: varchar("backupFileKey", { length: 512 }),
    backupGeneratedAt: timestamp("backupGeneratedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [
    uniqueIndex("notification_settings_owner_unique").on(table.ownerId),
    index("notification_settings_schedule_idx").on(table.scheduleCronTaskUid),
  ],
);

export const exportHistory = pgTable(
  "exportHistory",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    exportedBy: integer("exportedBy").notNull().references(() => users.id, { onDelete: "restrict" }),
    selectedTables: text("selectedTables").notNull(),
    counts: text("counts").notNull(),
    fileKey: varchar("fileKey", { length: 512 }).notNull(),
    generatedAt: timestamp("generatedAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("export_history_owner_created_idx").on(table.ownerId, table.createdAt)],
);

export type ExportHistory = typeof exportHistory.$inferSelect;
export type InsertExportHistory = typeof exportHistory.$inferInsert;

export const inventoryItems = pgTable(
  "inventoryItems",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    category: varchar("category", { length: 120 }).default("عام").notNull(),
    unit: varchar("unit", { length: 40 }).default("قطعة").notNull(),
    reorderLevel: integer("reorderLevel").default(2).notNull(),
    defaultUnitCost: integer("defaultUnitCost").default(0).notNull(),
    openingQuantity: integer("openingQuantity").default(0).notNull(),
    notes: text("notes"),
    customEmoji: varchar("customEmoji", { length: 16 }),
    imageKey: varchar("imageKey", { length: 255 }),
    imageUrl: varchar("imageUrl", { length: 512 }),
    clientOperationId: varchar("clientOperationId", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [index("inventory_items_owner_idx").on(table.ownerId), uniqueIndex("inventory_items_owner_operation_unique").on(table.ownerId, table.clientOperationId)],
);

export const inventoryMovements = pgTable(
  "inventoryMovements",
  {
    id: serial("id").primaryKey(),
    inventoryItemId: integer("inventoryItemId").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    movementType: inventoryMovementTypeEnum("movementType").notNull(),
    quantity: integer("quantity").notNull(),
    unitCost: integer("unitCost").default(0).notNull(),
    currency: cashCurrencyEnum("currency").notNull().default("SAR"),
    movementDate: timestamp("movementDate").notNull(),
    technicianName: varchar("technicianName", { length: 160 }),
    notes: text("notes"),
    clientOperationId: varchar("clientOperationId", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("inventory_movements_item_idx").on(table.inventoryItemId),
    uniqueIndex("inventory_movements_owner_operation_unique").on(table.ownerId, table.clientOperationId),
    index("inventory_movements_owner_date_idx").on(table.ownerId, table.movementDate),
    index("inventory_movements_purchase_idx").on(table.ownerId, table.movementType, table.movementDate),
  ],
);

export const cashTransactions = pgTable(
  "cashTransactions",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    transactionType: cashTransactionTypeEnum("transactionType").notNull(),
    currency: cashCurrencyEnum("currency").notNull().default("SAR"),
    amount: integer("amount").notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    transactionDate: timestamp("transactionDate").notNull(),
    sourceVisitId: integer("sourceVisitId").references(() => visits.id, { onDelete: "set null" }),
    sourceInventoryMovementId: integer("sourceInventoryMovementId").references(() => inventoryMovements.id, { onDelete: "set null" }),
    recipientName: varchar("recipientName", { length: 160 }),
    notes: text("notes"),
    clientOperationId: varchar("clientOperationId", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("cash_transactions_owner_date_idx").on(table.ownerId, table.transactionDate),
    uniqueIndex("cash_transactions_owner_operation_unique").on(table.ownerId, table.clientOperationId), index("cash_transactions_source_visit_idx").on(table.ownerId, table.sourceVisitId), index("cash_transactions_source_inventory_idx").on(table.ownerId, table.sourceInventoryMovementId)],
);

export const serviceTypes = pgTable(
  "serviceTypes",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 64 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [uniqueIndex("service_types_owner_code_unique").on(table.ownerId, table.code)],
);

export const serviceTypeItems = pgTable(
  "serviceTypeItems",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    serviceTypeId: integer("serviceTypeId").notNull().references(() => serviceTypes.id, { onDelete: "cascade" }),
    inventoryItemId: integer("inventoryItemId").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
    defaultQuantity: integer("defaultQuantity").default(1).notNull(),
    isRequired: boolean("isRequired").default(false).notNull(),
    allowEditQuantity: boolean("allowEditQuantity").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [uniqueIndex("service_type_items_owner_service_item_unique").on(table.ownerId, table.serviceTypeId, table.inventoryItemId), index("service_type_items_service_idx").on(table.serviceTypeId)],
);

export const visitItems = pgTable(
  "visitItems",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    visitId: integer("visitId").notNull().references(() => visits.id, { onDelete: "cascade" }),
    inventoryItemId: integer("inventoryItemId").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
    itemNameSnapshot: varchar("itemNameSnapshot", { length: 160 }).notNull(),
    unitSnapshot: varchar("unitSnapshot", { length: 40 }).notNull(),
    quantity: integer("quantity").notNull(),
    source: visitItemSourceEnum("source").default("default").notNull(),
    clientOperationId: varchar("clientOperationId", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("visit_items_visit_idx").on(table.visitId), uniqueIndex("visit_items_owner_operation_unique").on(table.ownerId, table.clientOperationId)],
);



export const workOrderProofKindValues = ["photo", "signature", "audio"] as const;
export const workOrderPhotoSlotValues = ["before", "after", "general"] as const;

export const workOrderProofs = pgTable(
  "workOrderProofs",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    visitId: integer("visitId").notNull().references(() => visits.id, { onDelete: "cascade" }),
    uploadedBy: integer("uploadedBy").notNull().references(() => users.id, { onDelete: "restrict" }),
    kind: workOrderProofKindEnum("kind").notNull(),
    photoSlot: workOrderPhotoSlotEnum("photoSlot"),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    url: varchar("url", { length: 1024 }).notNull(),
    mimeType: varchar("mimeType", { length: 120 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("work_order_proofs_owner_visit_idx").on(table.ownerId, table.visitId),
    index("work_order_proofs_uploaded_by_idx").on(table.uploadedBy),
  ],
);


/** Smart Security Life domain tables. */
export const securityStaff = pgTable(
  "securityStaff",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    staffCode: varchar("staffCode", { length: 64 }).notNull(),
    fullName: varchar("fullName", { length: 160 }).notNull(),
    nationalId: varchar("nationalId", { length: 32 }),
    phone: varchar("phone", { length: 32 }),
    branch: varchar("branch", { length: 120 }).notNull(),
    atmLocation: varchar("atmLocation", { length: 160 }),
    shift: staffShiftEnum("staffShift"),
    hireDate: timestamp("hireDate"),
    workStartDate: timestamp("workStartDate"),
    emergencyPhone: varchar("emergencyPhone", { length: 32 }),
    photoUrl: varchar("photoUrl", { length: 512 }),
    licenseStatus: staffLicenseStatusEnum("staffLicenseStatus").default("unlicensed").notNull(),
    weaponNumber: varchar("weaponNumber", { length: 80 }),
    licenseNumber: varchar("licenseNumber", { length: 80 }),
    licenseExpiry: timestamp("licenseExpiry"),
    retirementDate: timestamp("retirementDate"),
    monthlyRate: integer("monthlyRate").default(0).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [uniqueIndex("security_staff_owner_code_unique").on(table.ownerId, table.staffCode), index("security_staff_owner_idx").on(table.ownerId), index("security_staff_branch_idx").on(table.ownerId, table.branch)],
);

export type SecurityStaff = typeof securityStaff.$inferSelect;
export type InsertSecurityStaff = typeof securityStaff.$inferInsert;

export const securityAttendance = pgTable(
  "securityAttendance",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    staffId: integer("staffId").notNull().references(() => securityStaff.id, { onDelete: "cascade" }),
    attendanceDate: timestamp("attendanceDate").notNull(),
    shift: attendanceShiftEnum("shift").notNull(),
    status: attendanceStatusEnum("status").notNull(),
    hours: integer("hours").default(8).notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [index("security_attendance_owner_date_idx").on(table.ownerId, table.attendanceDate), index("security_attendance_staff_idx").on(table.staffId)],
);

export type SecurityAttendance = typeof securityAttendance.$inferSelect;
export type InsertSecurityAttendance = typeof securityAttendance.$inferInsert;

export const securityPatrols = pgTable(
  "securityPatrols",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    staffId: integer("staffId").references(() => securityStaff.id, { onDelete: "set null" }),
    branch: varchar("branch", { length: 120 }).notNull(),
    patrolDate: timestamp("patrolDate").notNull(),
    checkpoint: varchar("checkpoint", { length: 160 }),
    notes: text("notes"),
    photoUrl: varchar("photoUrl", { length: 512 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("security_patrols_owner_date_idx").on(table.ownerId, table.patrolDate), index("security_patrols_branch_idx").on(table.ownerId, table.branch)],
);

export type SecurityPatrol = typeof securityPatrols.$inferSelect;
export type InsertSecurityPatrol = typeof securityPatrols.$inferInsert;

export const financeEntries = pgTable(
  "financeEntries",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    entryType: financeEntryTypeEnum("entryType").notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    amount: integer("amount").notNull(),
    entryDate: timestamp("entryDate").notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [index("finance_entries_owner_date_idx").on(table.ownerId, table.entryDate), index("finance_entries_owner_type_idx").on(table.ownerId, table.entryType)],
);

export type FinanceEntry = typeof financeEntries.$inferSelect;
export type InsertFinanceEntry = typeof financeEntries.$inferInsert;

export const debts = pgTable(
  "debts",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    personName: varchar("personName", { length: 160 }).notNull(),
    direction: debtDirectionEnum("direction").notNull(),
    totalAmount: integer("totalAmount").notNull(),
    paidAmount: integer("paidAmount").default(0).notNull(),
    dueDate: timestamp("dueDate"),
    status: debtStatusEnum("debtStatus").default("open").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [index("debts_owner_due_idx").on(table.ownerId, table.dueDate), index("debts_owner_status_idx").on(table.ownerId, table.status)],
);

export type Debt = typeof debts.$inferSelect;
export type InsertDebt = typeof debts.$inferInsert;

export const children = pgTable(
  "children",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    fullName: varchar("fullName", { length: 160 }).notNull(),
    grade: varchar("grade", { length: 80 }),
    school: varchar("school", { length: 160 }),
    phone: varchar("phone", { length: 32 }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [index("children_owner_idx").on(table.ownerId)],
);

export type Child = typeof children.$inferSelect;
export type InsertChild = typeof children.$inferInsert;

export const teachers = pgTable(
  "teachers",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    fullName: varchar("fullName", { length: 160 }).notNull(),
    subject: varchar("subject", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    monthlyCost: integer("monthlyCost").default(0).notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [index("teachers_owner_subject_idx").on(table.ownerId, table.subject)],
);

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = typeof teachers.$inferInsert;

export const lessons = pgTable(
  "lessons",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    childId: integer("childId").notNull().references(() => children.id, { onDelete: "cascade" }),
    teacherId: integer("teacherId").references(() => teachers.id, { onDelete: "set null" }),
    subject: varchar("subject", { length: 120 }).notNull(),
    lessonDate: timestamp("lessonDate").notNull(),
    durationMinutes: integer("durationMinutes").default(60).notNull(),
    cost: integer("cost").default(0).notNull(),
    status: lessonStatusEnum("lessonStatus").default("scheduled").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [index("lessons_owner_date_idx").on(table.ownerId, table.lessonDate), index("lessons_child_idx").on(table.childId)],
);

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;


export const securityWorkLocations = pgTable(
  "securityWorkLocations",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    staffId: integer("staffId").notNull().references(() => securityStaff.id, { onDelete: "cascade" }),
    locationName: varchar("locationName", { length: 160 }).notNull(),
    fromDate: timestamp("fromDate").notNull(),
    toDate: timestamp("toDate"),
    transferReason: varchar("transferReason", { length: 255 }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("security_work_locations_owner_staff_idx").on(table.ownerId, table.staffId), index("security_work_locations_date_idx").on(table.ownerId, table.fromDate)],
);

export type SecurityWorkLocation = typeof securityWorkLocations.$inferSelect;
export type InsertSecurityWorkLocation = typeof securityWorkLocations.$inferInsert;

export const securityPatrolPlans = pgTable(
  "securityPatrolPlans",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    staffId: integer("staffId").references(() => securityStaff.id, { onDelete: "set null" }),
    branch: varchar("branch", { length: 120 }).notNull(),
    checkpoint: varchar("checkpoint", { length: 160 }).notNull(),
    planDate: timestamp("planDate").notNull(),
    shift: patrolShiftEnum("patrolShift").notNull(),
    repeatWeekly: boolean("repeatWeekly").default(false).notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [index("security_patrol_plans_owner_date_idx").on(table.ownerId, table.planDate), index("security_patrol_plans_checkpoint_idx").on(table.ownerId, table.checkpoint)],
);

export type SecurityPatrolPlan = typeof securityPatrolPlans.$inferSelect;
export type InsertSecurityPatrolPlan = typeof securityPatrolPlans.$inferInsert;

export const personalVehicles = pgTable(
  "personalVehicles",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    vehicleType: vehicleTypeEnum("vehicleType").notNull(),
    customType: varchar("customType", { length: 100 }),
    make: varchar("make", { length: 100 }),
    model: varchar("model", { length: 100 }),
    color: varchar("color", { length: 60 }),
    plateNumber: varchar("plateNumber", { length: 64 }),
    vin: varchar("vin", { length: 100 }),
    purchaseDate: timestamp("purchaseDate"),
    saleDate: timestamp("saleDate"),
    ownership: vehicleOwnershipEnum("ownership").default("owned").notNull(),
    licenseStatus: vehicleLicenseStatusEnum("vehicleLicenseStatus").default("unlicensed").notNull(),
    licenseNumber: varchar("licenseNumber", { length: 80 }),
    licenseExpiry: timestamp("licenseExpiry"),
    licenseWithdrawnDate: timestamp("licenseWithdrawnDate"),
    licenseWithdrawalReason: text("licenseWithdrawalReason"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => [index("personal_vehicles_owner_idx").on(table.ownerId), index("personal_vehicles_license_idx").on(table.ownerId, table.licenseExpiry)],
);

export type PersonalVehicle = typeof personalVehicles.$inferSelect;
export type InsertPersonalVehicle = typeof personalVehicles.$inferInsert;

export const personalVehicleVisits = pgTable(
  "personalVehicleVisits",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    vehicleId: integer("vehicleId").notNull().references(() => personalVehicles.id, { onDelete: "cascade" }),
    visitDate: timestamp("visitDate").notNull(),
    visitType: vehicleVisitTypeEnum("visitType").notNull(),
    result: varchar("result", { length: 255 }),
    nextDueDate: timestamp("nextDueDate"),
    fees: integer("fees").default(0).notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("personal_vehicle_visits_owner_date_idx").on(table.ownerId, table.visitDate), index("personal_vehicle_visits_vehicle_idx").on(table.vehicleId)],
);

export type PersonalVehicleVisit = typeof personalVehicleVisits.$inferSelect;
export type InsertPersonalVehicleVisit = typeof personalVehicleVisits.$inferInsert;
