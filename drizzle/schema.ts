import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { cashCurrencies, cashTransactionTypes } from "../shared/cashBusiness";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Stable local identifier; legacy rows may retain their previous value. */
  openId: varchar("openId", { length: 128 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, table => [index("users_email_idx").on(table.email)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const allowedTechnicianAccounts = mysqlTable(
  "allowedTechnicianAccounts",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }).notNull(),
    displayName: varchar("displayName", { length: 160 }).notNull(),
    linkedUserId: int("linkedUserId").references(() => users.id, { onDelete: "set null" }),
    passwordHash: varchar("passwordHash", { length: 255 }),
    isActive: boolean("isActive").default(true).notNull(),
    menuPermissions: varchar("menuPermissions", { length: 255 }).default('["workOrders"]').notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("allowed_technician_owner_email_unique").on(table.ownerId, table.email),
    index("allowed_technician_linked_user_idx").on(table.linkedUserId),
  ],
);

export type AllowedTechnicianAccount = typeof allowedTechnicianAccounts.$inferSelect;
export type InsertAllowedTechnicianAccount = typeof allowedTechnicianAccounts.$inferInsert;

export const technicianLocations = mysqlTable(
  "technicianLocations",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    technicianId: int("technicianId").notNull().references(() => users.id, { onDelete: "cascade" }),
    latitude: varchar("latitude", { length: 32 }).notNull(),
    longitude: varchar("longitude", { length: 32 }).notNull(),
    accuracy: int("accuracy"),
    recordedAt: timestamp("recordedAt").notNull(),
    sharingUntil: timestamp("sharingUntil"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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

export const customers = mysqlTable(
  "customers",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    manualCode: varchar("manualCode", { length: 64 }),
    phone: varchar("phone", { length: 32 }).notNull(),
    address: text("address"),
    latitude: varchar("latitude", { length: 32 }),
    longitude: varchar("longitude", { length: 32 }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    clientOperationId: varchar("clientOperationId", { length: 64 }),
  },
  table => [
    index("customers_owner_idx").on(table.ownerId),
    index("customers_phone_idx").on(table.phone),
    uniqueIndex("customers_owner_operation_unique").on(table.ownerId, table.clientOperationId),
    uniqueIndex("customers_owner_manual_code_unique").on(table.ownerId, table.manualCode),
  ],
);

export const visits = mysqlTable(
  "visits",
  {
    id: int("id").autoincrement().primaryKey(),
    customerId: int("customerId").notNull().references(() => customers.id, { onDelete: "cascade" }),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    visitType: mysqlEnum("visitType", visitTypeValues).notNull(),
    visitDate: timestamp("visitDate").notNull(),
    nextVisitDate: timestamp("nextVisitDate"),
    technicianName: varchar("technicianName", { length: 160 }),
    salesAgentName: varchar("salesAgentName", { length: 160 }),
    filterCount: int("filterCount").default(1).notNull(),
    tdsIn: int("tdsIn"),
    tdsOut: int("tdsOut"),
    photoBeforeKey: varchar("photoBeforeKey", { length: 512 }),
    photoAfterKey: varchar("photoAfterKey", { length: 512 }),
    status: mysqlEnum("status", ["assigned", "en_route", "arrived", "in_progress", "completed", "postponed", "cancelled"]).default("assigned").notNull(),
    assignedTechnicianId: int("assignedTechnicianId").references(() => users.id, { onDelete: "set null" }),
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

export const reminders = mysqlTable(
  "reminders",
  {
    id: int("id").autoincrement().primaryKey(),
    customerId: int("customerId").notNull().references(() => customers.id, { onDelete: "cascade" }),
    visitId: int("visitId").notNull().references(() => visits.id, { onDelete: "cascade" }),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    reminderDate: timestamp("reminderDate").notNull(),
    status: mysqlEnum("status", ["pending", "completed", "dismissed"]).default("pending").notNull(),
    alertedAt: timestamp("alertedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("reminders_owner_status_date_idx").on(table.ownerId, table.status, table.reminderDate),
    index("reminders_customer_idx").on(table.customerId),
  ],
);

export const notificationSettings = mysqlTable(
  "notificationSettings",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    leadDays: int("leadDays").default(1).notNull(),
    alertHour: int("alertHour").default(9).notNull(),
    alertMinute: int("alertMinute").default(0).notNull(),
    timezoneOffsetMinutes: int("timezoneOffsetMinutes").default(180).notNull(),
    companyName: varchar("companyName", { length: 160 }),
    companyWhatsAppPhone: varchar("companyWhatsAppPhone", { length: 32 }),
    pinHash: varchar("pinHash", { length: 255 }),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
    backupFileKey: varchar("backupFileKey", { length: 512 }),
    backupGeneratedAt: timestamp("backupGeneratedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("notification_settings_owner_unique").on(table.ownerId),
    index("notification_settings_schedule_idx").on(table.scheduleCronTaskUid),
  ],
);

export const exportHistory = mysqlTable(
  "exportHistory",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    exportedBy: int("exportedBy").notNull().references(() => users.id, { onDelete: "restrict" }),
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

export const inventoryItems = mysqlTable(
  "inventoryItems",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    category: varchar("category", { length: 120 }).default("عام").notNull(),
    unit: varchar("unit", { length: 40 }).default("قطعة").notNull(),
    reorderLevel: int("reorderLevel").default(2).notNull(),
    defaultUnitCost: int("defaultUnitCost").default(0).notNull(),
    openingQuantity: int("openingQuantity").default(0).notNull(),
    notes: text("notes"),
    customEmoji: varchar("customEmoji", { length: 16 }),
    imageKey: varchar("imageKey", { length: 255 }),
    imageUrl: varchar("imageUrl", { length: 512 }),
    clientOperationId: varchar("clientOperationId", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("inventory_items_owner_idx").on(table.ownerId), uniqueIndex("inventory_items_owner_operation_unique").on(table.ownerId, table.clientOperationId)],
);

export const inventoryMovements = mysqlTable(
  "inventoryMovements",
  {
    id: int("id").autoincrement().primaryKey(),
    inventoryItemId: int("inventoryItemId").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    movementType: mysqlEnum("movementType", ["incoming", "outgoing"]).notNull(),
    quantity: int("quantity").notNull(),
    unitCost: int("unitCost").default(0).notNull(),
    currency: mysqlEnum("currency", cashCurrencies).notNull().default("SAR"),
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

export const cashTransactions = mysqlTable(
  "cashTransactions",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    transactionType: mysqlEnum("transactionType", cashTransactionTypes).notNull(),
    currency: mysqlEnum("currency", cashCurrencies).notNull().default("SAR"),
    amount: int("amount").notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    transactionDate: timestamp("transactionDate").notNull(),
    sourceVisitId: int("sourceVisitId").references(() => visits.id, { onDelete: "set null" }),
    sourceInventoryMovementId: int("sourceInventoryMovementId").references(() => inventoryMovements.id, { onDelete: "set null" }),
    recipientName: varchar("recipientName", { length: 160 }),
    notes: text("notes"),
    clientOperationId: varchar("clientOperationId", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("cash_transactions_owner_date_idx").on(table.ownerId, table.transactionDate),
    uniqueIndex("cash_transactions_owner_operation_unique").on(table.ownerId, table.clientOperationId), index("cash_transactions_source_visit_idx").on(table.ownerId, table.sourceVisitId), index("cash_transactions_source_inventory_idx").on(table.ownerId, table.sourceInventoryMovementId)],
);

export const serviceTypes = mysqlTable(
  "serviceTypes",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 64 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    version: int("version").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("service_types_owner_code_unique").on(table.ownerId, table.code)],
);

export const serviceTypeItems = mysqlTable(
  "serviceTypeItems",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    serviceTypeId: int("serviceTypeId").notNull().references(() => serviceTypes.id, { onDelete: "cascade" }),
    inventoryItemId: int("inventoryItemId").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
    defaultQuantity: int("defaultQuantity").default(1).notNull(),
    isRequired: boolean("isRequired").default(false).notNull(),
    allowEditQuantity: boolean("allowEditQuantity").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("service_type_items_owner_service_item_unique").on(table.ownerId, table.serviceTypeId, table.inventoryItemId), index("service_type_items_service_idx").on(table.serviceTypeId)],
);

export const visitItems = mysqlTable(
  "visitItems",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    visitId: int("visitId").notNull().references(() => visits.id, { onDelete: "cascade" }),
    inventoryItemId: int("inventoryItemId").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
    itemNameSnapshot: varchar("itemNameSnapshot", { length: 160 }).notNull(),
    unitSnapshot: varchar("unitSnapshot", { length: 40 }).notNull(),
    quantity: int("quantity").notNull(),
    source: mysqlEnum("source", ["default", "manual"]).default("default").notNull(),
    clientOperationId: varchar("clientOperationId", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("visit_items_visit_idx").on(table.visitId), uniqueIndex("visit_items_owner_operation_unique").on(table.ownerId, table.clientOperationId)],
);



export const workOrderProofKindValues = ["photo", "signature", "audio"] as const;
export const workOrderPhotoSlotValues = ["before", "after", "general"] as const;

export const workOrderProofs = mysqlTable(
  "workOrderProofs",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    visitId: int("visitId").notNull().references(() => visits.id, { onDelete: "cascade" }),
    uploadedBy: int("uploadedBy").notNull().references(() => users.id, { onDelete: "restrict" }),
    kind: mysqlEnum("kind", workOrderProofKindValues).notNull(),
    photoSlot: mysqlEnum("photoSlot", workOrderPhotoSlotValues),
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
export const securityStaff = mysqlTable(
  "securityStaff",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    staffCode: varchar("staffCode", { length: 64 }).notNull(),
    fullName: varchar("fullName", { length: 160 }).notNull(),
    nationalId: varchar("nationalId", { length: 32 }),
    phone: varchar("phone", { length: 32 }),
    branch: varchar("branch", { length: 120 }).notNull(),
    atmLocation: varchar("atmLocation", { length: 160 }),
    shift: mysqlEnum("staffShift", ["morning", "evening", "night", "off"]),
    hireDate: timestamp("hireDate"),
    workStartDate: timestamp("workStartDate"),
    emergencyPhone: varchar("emergencyPhone", { length: 32 }),
    photoUrl: varchar("photoUrl", { length: 512 }),
    licenseStatus: mysqlEnum("staffLicenseStatus", ["licensed", "unlicensed"]).default("unlicensed").notNull(),
    weaponNumber: varchar("weaponNumber", { length: 80 }),
    licenseNumber: varchar("licenseNumber", { length: 80 }),
    licenseExpiry: timestamp("licenseExpiry"),
    retirementDate: timestamp("retirementDate"),
    monthlyRate: int("monthlyRate").default(0).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("security_staff_owner_code_unique").on(table.ownerId, table.staffCode), index("security_staff_owner_idx").on(table.ownerId), index("security_staff_branch_idx").on(table.ownerId, table.branch)],
);

export type SecurityStaff = typeof securityStaff.$inferSelect;
export type InsertSecurityStaff = typeof securityStaff.$inferInsert;

export const securityAttendance = mysqlTable(
  "securityAttendance",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    staffId: int("staffId").notNull().references(() => securityStaff.id, { onDelete: "cascade" }),
    attendanceDate: timestamp("attendanceDate").notNull(),
    shift: mysqlEnum("shift", ["morning", "evening", "night", "off", "leave"]).notNull(),
    status: mysqlEnum("status", ["present", "absent", "excused"]).notNull(),
    hours: int("hours").default(8).notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("security_attendance_owner_date_idx").on(table.ownerId, table.attendanceDate), index("security_attendance_staff_idx").on(table.staffId)],
);

export type SecurityAttendance = typeof securityAttendance.$inferSelect;
export type InsertSecurityAttendance = typeof securityAttendance.$inferInsert;

export const securityPatrols = mysqlTable(
  "securityPatrols",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    staffId: int("staffId").references(() => securityStaff.id, { onDelete: "set null" }),
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

export const financeEntries = mysqlTable(
  "financeEntries",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    entryType: mysqlEnum("entryType", ["income", "expense"]).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    amount: int("amount").notNull(),
    entryDate: timestamp("entryDate").notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("finance_entries_owner_date_idx").on(table.ownerId, table.entryDate), index("finance_entries_owner_type_idx").on(table.ownerId, table.entryType)],
);

export type FinanceEntry = typeof financeEntries.$inferSelect;
export type InsertFinanceEntry = typeof financeEntries.$inferInsert;

export const debts = mysqlTable(
  "debts",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    personName: varchar("personName", { length: 160 }).notNull(),
    direction: mysqlEnum("direction", ["receivable", "payable"]).notNull(),
    totalAmount: int("totalAmount").notNull(),
    paidAmount: int("paidAmount").default(0).notNull(),
    dueDate: timestamp("dueDate"),
    status: mysqlEnum("debtStatus", ["open", "partial", "settled"]).default("open").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("debts_owner_due_idx").on(table.ownerId, table.dueDate), index("debts_owner_status_idx").on(table.ownerId, table.status)],
);

export type Debt = typeof debts.$inferSelect;
export type InsertDebt = typeof debts.$inferInsert;

export const children = mysqlTable(
  "children",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    fullName: varchar("fullName", { length: 160 }).notNull(),
    grade: varchar("grade", { length: 80 }),
    school: varchar("school", { length: 160 }),
    phone: varchar("phone", { length: 32 }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("children_owner_idx").on(table.ownerId)],
);

export type Child = typeof children.$inferSelect;
export type InsertChild = typeof children.$inferInsert;

export const teachers = mysqlTable(
  "teachers",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    fullName: varchar("fullName", { length: 160 }).notNull(),
    subject: varchar("subject", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    monthlyCost: int("monthlyCost").default(0).notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("teachers_owner_subject_idx").on(table.ownerId, table.subject)],
);

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = typeof teachers.$inferInsert;

export const lessons = mysqlTable(
  "lessons",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    childId: int("childId").notNull().references(() => children.id, { onDelete: "cascade" }),
    teacherId: int("teacherId").references(() => teachers.id, { onDelete: "set null" }),
    subject: varchar("subject", { length: 120 }).notNull(),
    lessonDate: timestamp("lessonDate").notNull(),
    durationMinutes: int("durationMinutes").default(60).notNull(),
    cost: int("cost").default(0).notNull(),
    status: mysqlEnum("lessonStatus", ["scheduled", "completed", "cancelled"]).default("scheduled").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("lessons_owner_date_idx").on(table.ownerId, table.lessonDate), index("lessons_child_idx").on(table.childId)],
);

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;


export const securityWorkLocations = mysqlTable(
  "securityWorkLocations",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    staffId: int("staffId").notNull().references(() => securityStaff.id, { onDelete: "cascade" }),
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

export const securityPatrolPlans = mysqlTable(
  "securityPatrolPlans",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    staffId: int("staffId").references(() => securityStaff.id, { onDelete: "set null" }),
    branch: varchar("branch", { length: 120 }).notNull(),
    checkpoint: varchar("checkpoint", { length: 160 }).notNull(),
    planDate: timestamp("planDate").notNull(),
    shift: mysqlEnum("patrolShift", ["morning", "evening", "night", "off"]).notNull(),
    repeatWeekly: boolean("repeatWeekly").default(false).notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("security_patrol_plans_owner_date_idx").on(table.ownerId, table.planDate), index("security_patrol_plans_checkpoint_idx").on(table.ownerId, table.checkpoint)],
);

export type SecurityPatrolPlan = typeof securityPatrolPlans.$inferSelect;
export type InsertSecurityPatrolPlan = typeof securityPatrolPlans.$inferInsert;

export const personalVehicles = mysqlTable(
  "personalVehicles",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    vehicleType: mysqlEnum("vehicleType", ["car", "motorcycle", "tuk_tuk", "other"]).notNull(),
    customType: varchar("customType", { length: 100 }),
    make: varchar("make", { length: 100 }),
    model: varchar("model", { length: 100 }),
    color: varchar("color", { length: 60 }),
    plateNumber: varchar("plateNumber", { length: 64 }),
    vin: varchar("vin", { length: 100 }),
    purchaseDate: timestamp("purchaseDate"),
    saleDate: timestamp("saleDate"),
    ownership: mysqlEnum("ownership", ["owned", "sold", "leased"]).default("owned").notNull(),
    licenseStatus: mysqlEnum("vehicleLicenseStatus", ["valid", "expired", "withdrawn", "unlicensed"]).default("unlicensed").notNull(),
    licenseNumber: varchar("licenseNumber", { length: 80 }),
    licenseExpiry: timestamp("licenseExpiry"),
    licenseWithdrawnDate: timestamp("licenseWithdrawnDate"),
    licenseWithdrawalReason: text("licenseWithdrawalReason"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("personal_vehicles_owner_idx").on(table.ownerId), index("personal_vehicles_license_idx").on(table.ownerId, table.licenseExpiry)],
);

export type PersonalVehicle = typeof personalVehicles.$inferSelect;
export type InsertPersonalVehicle = typeof personalVehicles.$inferInsert;

export const personalVehicleVisits = mysqlTable(
  "personalVehicleVisits",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    vehicleId: int("vehicleId").notNull().references(() => personalVehicles.id, { onDelete: "cascade" }),
    visitDate: timestamp("visitDate").notNull(),
    visitType: mysqlEnum("vehicleVisitType", ["inspection", "renewal", "license", "withdrawal", "other"]).notNull(),
    result: varchar("result", { length: 255 }),
    nextDueDate: timestamp("nextDueDate"),
    fees: int("fees").default(0).notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("personal_vehicle_visits_owner_date_idx").on(table.ownerId, table.visitDate), index("personal_vehicle_visits_vehicle_idx").on(table.vehicleId)],
);

export type PersonalVehicleVisit = typeof personalVehicleVisits.$inferSelect;
export type InsertPersonalVehicleVisit = typeof personalVehicleVisits.$inferInsert;
