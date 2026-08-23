import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, like, lte, or } from "drizzle-orm";
import { z } from "zod";
import {
  children,
  debts,
  financeEntries,
  lessons,
  personalVehicleVisits,
  personalVehicles,
  securityAttendance,
  securityPatrolPlans,
  securityPatrols,
  securityStaff,
  securityWorkLocations,
  teachers,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";

const dateValue = z.coerce.date();
const optionalText = z.string().trim().max(500).optional().nullable();

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة حالياً." });
  return db;
}

const staffInput = z.object({
  staffCode: z.string().trim().min(1).max(64),
  fullName: z.string().trim().min(2).max(160),
  nationalId: z.string().trim().max(32).optional().nullable(),
  phone: z.string().trim().max(32).optional().nullable(),
  branch: z.string().trim().min(1).max(120),
  atmLocation: z.string().trim().max(160).optional().nullable(),
  shift: z.enum(["morning", "evening", "night", "off"]).optional().nullable(),
  hireDate: dateValue.optional().nullable(),
  workStartDate: dateValue.optional().nullable(),
  emergencyPhone: z.string().trim().max(32).optional().nullable(),
  photoUrl: z.string().url().max(512).optional().nullable(),
  licenseStatus: z.enum(["licensed", "unlicensed"]).default("unlicensed"),
  weaponNumber: z.string().trim().max(80).optional().nullable(),
  licenseNumber: z.string().trim().max(80).optional().nullable(),
  licenseExpiry: dateValue.optional().nullable(),
  retirementDate: dateValue.optional().nullable(),
  monthlyRate: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  notes: optionalText,
});

const ownerIdFrom = (user: { id: number }) => user.id;

const imageDataUrl = z.string().regex(/^data:image\/(?:jpg|jpeg|png|webp|heic|heif);base64,[A-Za-z0-9+/=\r\n]+$/i, "صيغة الصورة غير صالحة.");

function decodeImageDataUrl(value: string) {
  const normalized = value.replace(/\r?\n|\r/g, "").replace(/^data:image\/jpg;/i, "data:image/jpeg;");
  const match = normalized.match(/^data:(image\/(?:jpeg|png|webp|heic|heif));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "صيغة الصورة غير مدعومة." });
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > 8 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "حجم الصورة يجب ألا يتجاوز 8 ميجابايت." });
  return { buffer, mimeType: match[1].toLowerCase() };
}

export const smartSecurityRouter = router({
  uploadImage: protectedProcedure.input(z.object({ dataUrl: imageDataUrl, folder: z.enum(["staff", "patrols", "vehicles"]).default("staff") })).mutation(async ({ ctx, input }) => {
    const { buffer, mimeType } = decodeImageDataUrl(input.dataUrl);
    const extension = mimeType.split("/")[1] === "jpeg" ? "jpg" : mimeType.split("/")[1];
    const uploaded = await storagePut(`smart-security/${ctx.user.id}/${input.folder}/${crypto.randomUUID()}.${extension}`, buffer, mimeType);
    return { ...uploaded, mimeType };
  }),
  snapshot: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const ownerId = ctx.user.id;
    const [staff, workLocations, attendance, patrols, patrolPlans, entries, debtsRows, childrenRows, teachersRows, lessonsRows, vehiclesRows, vehicleVisits] = await Promise.all([
      db.select().from(securityStaff).where(eq(securityStaff.ownerId, ownerId)),
      db.select().from(securityWorkLocations).where(eq(securityWorkLocations.ownerId, ownerId)),
      db.select().from(securityAttendance).where(eq(securityAttendance.ownerId, ownerId)),
      db.select().from(securityPatrols).where(eq(securityPatrols.ownerId, ownerId)),
      db.select().from(securityPatrolPlans).where(eq(securityPatrolPlans.ownerId, ownerId)),
      db.select().from(financeEntries).where(eq(financeEntries.ownerId, ownerId)),
      db.select().from(debts).where(eq(debts.ownerId, ownerId)),
      db.select().from(children).where(eq(children.ownerId, ownerId)),
      db.select().from(teachers).where(eq(teachers.ownerId, ownerId)),
      db.select().from(lessons).where(eq(lessons.ownerId, ownerId)),
      db.select().from(personalVehicles).where(eq(personalVehicles.ownerId, ownerId)),
      db.select().from(personalVehicleVisits).where(eq(personalVehicleVisits.ownerId, ownerId)),
    ]);
    return { staff, workLocations, attendance, patrols, patrolPlans, entries, debts: debtsRows, children: childrenRows, teachers: teachersRows, lessons: lessonsRows, vehicles: vehiclesRows, vehicleVisits };
  }),
  save: protectedProcedure.input(z.object({
    entity: z.enum(["staff", "workLocations", "attendance", "patrols", "patrolPlans", "entries", "debts", "children", "teachers", "lessons", "vehicles", "vehicleVisits"]),
    payload: z.record(z.string(), z.unknown()),
  })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const ownerId = ctx.user.id;
    const p = input.payload;
    const text = (key: string) => typeof p[key] === "string" && p[key] !== "" ? String(p[key]) : null;
    const date = (key: string) => { const value = text(key); return value ? new Date(value) : null; };
    if (input.entity === "staff") {
      const result = await db.insert(securityStaff).values({ ownerId, staffCode: text("code") || `staff-${Date.now()}`, fullName: text("name") || "فرد أمن", nationalId: text("nationalId"), phone: text("phone"), branch: text("branch") || "غير محدد", atmLocation: text("atm"), shift: (text("shift") as "morning" | "evening" | "night" | "off" | null) || "morning", hireDate: date("hireDate"), workStartDate: date("workStartDate"), emergencyPhone: text("emergencyPhone"), photoUrl: text("image")?.startsWith("http") || text("image")?.startsWith("/manus-storage/") ? text("image") : null, licenseStatus: text("licenseStatus") === "licensed" ? "licensed" : "unlicensed", weaponNumber: text("weaponNumber"), licenseNumber: text("licenseNumber"), licenseExpiry: date("licenseExpiry"), retirementDate: date("retirementDate"), monthlyRate: Number(p.rate) || 0, isActive: p.active !== false, notes: text("notes") });
      return { entity: input.entity, id: Number(result[0].insertId), success: true } as const;
    }
    if (input.entity === "attendance") {
      const result = await db.insert(securityAttendance).values({ ownerId, staffId: Number(p.staffId), attendanceDate: date("date") || new Date(), shift: (text("shift") as "morning" | "evening" | "night" | "off" | "leave") || "morning", status: (text("status") as "present" | "absent" | "excused") || "present", hours: Number(p.hours) || 0, notes: text("notes") });
      return { entity: input.entity, id: Number(result[0].insertId), success: true } as const;
    }
    if (input.entity === "patrols") {
      const result = await db.insert(securityPatrols).values({ ownerId, staffId: text("staffId") ? Number(p.staffId) : null, branch: text("branch") || "غير محدد", patrolDate: date("date") || new Date(), checkpoint: text("checkpoint"), notes: text("notes"), photoUrl: text("photo")?.startsWith("http") || text("photo")?.startsWith("/manus-storage/") ? text("photo") : null });
      return { entity: input.entity, id: Number(result[0].insertId), success: true } as const;
    }
    if (input.entity === "patrolPlans") {
      const result = await db.insert(securityPatrolPlans).values({ ownerId, staffId: text("staffId") ? Number(p.staffId) : null, branch: text("branch") || "غير محدد", checkpoint: text("checkpoint") || "غير محدد", planDate: date("date") || new Date(), shift: (text("shift") as "morning" | "evening" | "night" | "off") || "morning", repeatWeekly: p.repeatWeekly === true, notes: text("notes") });
      return { entity: input.entity, id: Number(result[0].insertId), success: true } as const;
    }
    if (input.entity === "workLocations") {
      const result = await db.insert(securityWorkLocations).values({ ownerId, staffId: Number(p.staffId), locationName: text("location") || "غير محدد", fromDate: date("fromDate") || new Date(), toDate: date("toDate"), transferReason: text("reason"), notes: text("notes") });
      return { entity: input.entity, id: Number(result[0].insertId), success: true } as const;
    }
    if (input.entity === "entries") {
      const result = await db.insert(financeEntries).values({ ownerId, entryType: text("type") === "expense" ? "expense" : "income", category: text("category") || "عام", amount: Math.max(0, Number(p.amount) || 0), entryDate: date("date") || new Date(), description: text("notes") });
      return { entity: input.entity, id: Number(result[0].insertId), success: true } as const;
    }
    if (input.entity === "debts") {
      const totalAmount = Math.max(0, Number(p.total) || 0); const paidAmount = Math.max(0, Number(p.paid) || 0);
      const result = await db.insert(debts).values({ ownerId, personName: text("name") || "غير محدد", direction: text("direction") === "payable" ? "payable" : "receivable", totalAmount, paidAmount, dueDate: date("due"), status: paidAmount >= totalAmount ? "settled" : paidAmount > 0 ? "partial" : "open", notes: text("notes") });
      return { entity: input.entity, id: Number(result[0].insertId), success: true } as const;
    }
    if (input.entity === "children") {
      const result = await db.insert(children).values({ ownerId, fullName: text("name") || "ابن/ابنة", grade: text("grade"), school: text("school"), phone: text("phone"), notes: text("notes") });
      return { entity: input.entity, id: Number(result[0].insertId), success: true } as const;
    }
    if (input.entity === "teachers") {
      const result = await db.insert(teachers).values({ ownerId, fullName: text("name") || "مدرس", subject: text("subject") || "عام", phone: text("phone"), monthlyCost: Math.max(0, Number(p.cost) || 0), notes: text("notes") });
      return { entity: input.entity, id: Number(result[0].insertId), success: true } as const;
    }
    if (input.entity === "lessons") {
      const result = await db.insert(lessons).values({ ownerId, childId: Number(p.childId), teacherId: text("teacherId") ? Number(p.teacherId) : null, subject: text("subject") || "درس", lessonDate: date("date") || new Date(), durationMinutes: 60, cost: Math.max(0, Number(p.cost) || 0), status: text("status") === "completed" ? "completed" : "scheduled", notes: text("notes") });
      return { entity: input.entity, id: Number(result[0].insertId), success: true } as const;
    }
    if (input.entity === "vehicles") {
      const result = await db.insert(personalVehicles).values({ ownerId, vehicleType: (text("type") as "car" | "motorcycle" | "tuk_tuk" | "other") || "other", customType: text("customType"), make: text("make"), model: text("model"), color: text("color"), plateNumber: text("plate"), vin: text("vin"), purchaseDate: date("purchaseDate"), saleDate: date("saleDate"), ownership: (text("ownership") as "owned" | "sold" | "leased") || "owned", licenseStatus: (text("licenseStatus") as "valid" | "expired" | "withdrawn" | "unlicensed") || "unlicensed", licenseNumber: text("licenseNumber"), licenseExpiry: date("licenseExpiry"), licenseWithdrawnDate: date("licenseWithdrawnDate"), licenseWithdrawalReason: text("licenseWithdrawalReason"), notes: text("notes") });
      return { entity: input.entity, id: Number(result[0].insertId), success: true } as const;
    }
    if (input.entity === "vehicleVisits") {
      const result = await db.insert(personalVehicleVisits).values({ ownerId, vehicleId: Number(p.vehicleId), visitDate: date("date") || new Date(), visitType: (text("kind") as "inspection" | "renewal" | "license" | "withdrawal" | "other") || "other", result: text("result"), nextDueDate: date("nextDue"), fees: Math.max(0, Number(p.fees) || 0), notes: text("notes") });
      return { entity: input.entity, id: Number(result[0].insertId), success: true } as const;
    }
    throw new TRPCError({ code: "BAD_REQUEST", message: "نوع السجل غير مدعوم." });
  }),
  staff: router({
    list: protectedProcedure.input(z.object({ search: z.string().trim().max(160).optional() }).optional()).query(async ({ ctx, input }) => {
      const db = await requireDb();
      const ownerId = ownerIdFrom(ctx.user);
      const search = input?.search?.trim();
      const filters = [eq(securityStaff.ownerId, ownerId)];
      if (search) {
        filters.push(or(like(securityStaff.fullName, `%${search}%`), like(securityStaff.staffCode, `%${search}%`), like(securityStaff.phone, `%${search}%`), like(securityStaff.nationalId, `%${search}%`))!);
      }
      return db.select().from(securityStaff).where(and(...filters)).orderBy(desc(securityStaff.createdAt));
    }),
    create: protectedProcedure.input(staffInput).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const ownerId = ownerIdFrom(ctx.user);
      const result = await db.insert(securityStaff).values({ ...input, ownerId });
      const created = await db.select().from(securityStaff).where(and(eq(securityStaff.ownerId, ownerId), eq(securityStaff.id, Number(result[0].insertId)))).limit(1);
      return created[0];
    }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), isActive: z.boolean() })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await db.update(securityStaff).set({ isActive: input.isActive }).where(and(eq(securityStaff.id, input.id), eq(securityStaff.ownerId, ctx.user.id)));
      return { success: true } as const;
    }),
  }),
  attendance: router({
    list: protectedProcedure.input(z.object({ from: dateValue.optional(), to: dateValue.optional(), staffId: z.number().int().positive().optional() }).optional()).query(async ({ ctx, input }) => {
      const db = await requireDb();
      const filters = [eq(securityAttendance.ownerId, ctx.user.id)];
      if (input?.from) filters.push(gte(securityAttendance.attendanceDate, input.from));
      if (input?.to) filters.push(lte(securityAttendance.attendanceDate, input.to));
      if (input?.staffId) filters.push(eq(securityAttendance.staffId, input.staffId));
      return db.select().from(securityAttendance).where(and(...filters)).orderBy(desc(securityAttendance.attendanceDate));
    }),
    create: protectedProcedure.input(z.object({ staffId: z.number().int().positive(), attendanceDate: dateValue, shift: z.enum(["morning", "evening", "night", "off", "leave"]), status: z.enum(["present", "absent", "excused"]), hours: z.number().int().min(0).max(24).default(8), notes: optionalText })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await db.insert(securityAttendance).values({ ...input, ownerId: ctx.user.id });
      return { id: Number(result[0].insertId), success: true } as const;
    }),
  }),
  patrols: router({
    list: protectedProcedure.input(z.object({ from: dateValue.optional(), to: dateValue.optional(), branch: z.string().trim().max(120).optional(), checkpoint: z.string().trim().max(160).optional() }).optional()).query(async ({ ctx, input }) => {
      const db = await requireDb();
      const filters = [eq(securityPatrols.ownerId, ctx.user.id)];
      if (input?.from) filters.push(gte(securityPatrols.patrolDate, input.from));
      if (input?.to) filters.push(lte(securityPatrols.patrolDate, input.to));
      if (input?.branch) filters.push(eq(securityPatrols.branch, input.branch));
      if (input?.checkpoint) filters.push(like(securityPatrols.checkpoint, `%${input.checkpoint}%`));
      return db.select().from(securityPatrols).where(and(...filters)).orderBy(desc(securityPatrols.patrolDate));
    }),
    create: protectedProcedure.input(z.object({ staffId: z.number().int().positive().optional().nullable(), branch: z.string().trim().min(1).max(120), patrolDate: dateValue, checkpoint: z.string().trim().max(160).optional().nullable(), notes: optionalText, photoUrl: z.string().url().max(512).optional().nullable() })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await db.insert(securityPatrols).values({ ...input, ownerId: ctx.user.id });
      return { id: Number(result[0].insertId), success: true } as const;
    }),
  }),
  patrolPlans: router({
    list: protectedProcedure.input(z.object({ month: z.string().regex(/^\\d{4}-\\d{2}$/).optional(), checkpoint: z.string().trim().max(160).optional() }).optional()).query(async ({ ctx, input }) => {
      const db = await requireDb();
      const filters = [eq(securityPatrolPlans.ownerId, ctx.user.id)];
      if (input?.checkpoint) filters.push(like(securityPatrolPlans.checkpoint, `%${input.checkpoint}%`));
      return db.select().from(securityPatrolPlans).where(and(...filters)).orderBy(securityPatrolPlans.planDate);
    }),
    create: protectedProcedure.input(z.object({ staffId: z.number().int().positive().optional().nullable(), branch: z.string().trim().min(1).max(120), checkpoint: z.string().trim().min(1).max(160), planDate: dateValue, shift: z.enum(["morning", "evening", "night", "off"]), repeatWeekly: z.boolean().default(false), notes: optionalText })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await db.insert(securityPatrolPlans).values({ ...input, ownerId: ctx.user.id });
      return { id: Number(result[0].insertId), success: true } as const;
    }),
  }),
  workLocations: router({
    list: protectedProcedure.input(z.object({ staffId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const db = await requireDb();
      return db.select().from(securityWorkLocations).where(and(eq(securityWorkLocations.ownerId, ctx.user.id), eq(securityWorkLocations.staffId, input.staffId))).orderBy(desc(securityWorkLocations.fromDate));
    }),
    create: protectedProcedure.input(z.object({ staffId: z.number().int().positive(), locationName: z.string().trim().min(1).max(160), fromDate: dateValue, toDate: dateValue.optional().nullable(), transferReason: z.string().trim().max(255).optional().nullable(), notes: optionalText })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await db.insert(securityWorkLocations).values({ ...input, ownerId: ctx.user.id });
      return { id: Number(result[0].insertId), success: true } as const;
    }),
  }),
  finance: router({
    list: protectedProcedure.input(z.object({ from: dateValue.optional(), to: dateValue.optional(), entryType: z.enum(["income", "expense"]).optional() }).optional()).query(async ({ ctx, input }) => {
      const db = await requireDb();
      const filters = [eq(financeEntries.ownerId, ctx.user.id)];
      if (input?.from) filters.push(gte(financeEntries.entryDate, input.from));
      if (input?.to) filters.push(lte(financeEntries.entryDate, input.to));
      if (input?.entryType) filters.push(eq(financeEntries.entryType, input.entryType));
      return db.select().from(financeEntries).where(and(...filters)).orderBy(desc(financeEntries.entryDate));
    }),
    create: protectedProcedure.input(z.object({ entryType: z.enum(["income", "expense"]), category: z.string().trim().min(1).max(100), amount: z.number().int().positive(), entryDate: dateValue, description: optionalText })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await db.insert(financeEntries).values({ ...input, ownerId: ctx.user.id });
      return { id: Number(result[0].insertId), success: true } as const;
    }),
  }),
  debts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await requireDb();
      return db.select().from(debts).where(eq(debts.ownerId, ctx.user.id)).orderBy(desc(debts.createdAt));
    }),
    create: protectedProcedure.input(z.object({ personName: z.string().trim().min(2).max(160), direction: z.enum(["receivable", "payable"]), totalAmount: z.number().int().positive(), paidAmount: z.number().int().nonnegative().default(0), dueDate: dateValue.optional().nullable(), notes: optionalText })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const status = input.paidAmount >= input.totalAmount ? "settled" : input.paidAmount > 0 ? "partial" : "open";
      const result = await db.insert(debts).values({ ...input, ownerId: ctx.user.id, status });
      return { id: Number(result[0].insertId), success: true } as const;
    }),
    recordPayment: protectedProcedure.input(z.object({ id: z.number().int().positive(), paidAmount: z.number().int().nonnegative() })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const existing = await db.select().from(debts).where(and(eq(debts.id, input.id), eq(debts.ownerId, ctx.user.id))).limit(1);
      if (!existing[0]) throw new TRPCError({ code: "NOT_FOUND", message: "الدين غير موجود." });
      const status = input.paidAmount >= existing[0].totalAmount ? "settled" : input.paidAmount > 0 ? "partial" : "open";
      await db.update(debts).set({ paidAmount: input.paidAmount, status }).where(and(eq(debts.id, input.id), eq(debts.ownerId, ctx.user.id)));
      return { success: true } as const;
    }),
  }),
  children: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await requireDb();
      return db.select().from(children).where(eq(children.ownerId, ctx.user.id)).orderBy(desc(children.createdAt));
    }),
    create: protectedProcedure.input(z.object({ fullName: z.string().trim().min(2).max(160), grade: z.string().trim().max(80).optional().nullable(), school: z.string().trim().max(160).optional().nullable(), phone: z.string().trim().max(32).optional().nullable(), notes: optionalText })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await db.insert(children).values({ ...input, ownerId: ctx.user.id });
      return { id: Number(result[0].insertId), success: true } as const;
    }),
  }),
  teachers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await requireDb();
      return db.select().from(teachers).where(eq(teachers.ownerId, ctx.user.id)).orderBy(desc(teachers.createdAt));
    }),
    create: protectedProcedure.input(z.object({ fullName: z.string().trim().min(2).max(160), subject: z.string().trim().min(1).max(120), phone: z.string().trim().max(32).optional().nullable(), monthlyCost: z.number().int().nonnegative().default(0), notes: optionalText })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await db.insert(teachers).values({ ...input, ownerId: ctx.user.id });
      return { id: Number(result[0].insertId), success: true } as const;
    }),
  }),
  lessons: router({
    list: protectedProcedure.input(z.object({ from: dateValue.optional(), to: dateValue.optional(), childId: z.number().int().positive().optional() }).optional()).query(async ({ ctx, input }) => {
      const db = await requireDb();
      const filters = [eq(lessons.ownerId, ctx.user.id)];
      if (input?.from) filters.push(gte(lessons.lessonDate, input.from));
      if (input?.to) filters.push(lte(lessons.lessonDate, input.to));
      if (input?.childId) filters.push(eq(lessons.childId, input.childId));
      return db.select().from(lessons).where(and(...filters)).orderBy(desc(lessons.lessonDate));
    }),
    create: protectedProcedure.input(z.object({ childId: z.number().int().positive(), teacherId: z.number().int().positive().optional().nullable(), subject: z.string().trim().min(1).max(120), lessonDate: dateValue, durationMinutes: z.number().int().positive().max(600).default(60), cost: z.number().int().nonnegative().default(0), status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"), notes: optionalText })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await db.insert(lessons).values({ ...input, ownerId: ctx.user.id });
      return { id: Number(result[0].insertId), success: true } as const;
    }),
  }),
  vehicles: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await requireDb();
      return db.select().from(personalVehicles).where(eq(personalVehicles.ownerId, ctx.user.id)).orderBy(desc(personalVehicles.createdAt));
    }),
    create: protectedProcedure.input(z.object({ vehicleType: z.enum(["car", "motorcycle", "tuk_tuk", "other"]), customType: z.string().trim().max(100).optional().nullable(), make: z.string().trim().max(100).optional().nullable(), model: z.string().trim().max(100).optional().nullable(), color: z.string().trim().max(60).optional().nullable(), plateNumber: z.string().trim().max(64).optional().nullable(), vin: z.string().trim().max(100).optional().nullable(), purchaseDate: dateValue.optional().nullable(), saleDate: dateValue.optional().nullable(), ownership: z.enum(["owned", "sold", "leased"]).default("owned"), licenseStatus: z.enum(["valid", "expired", "withdrawn", "unlicensed"]).default("unlicensed"), licenseNumber: z.string().trim().max(80).optional().nullable(), licenseExpiry: dateValue.optional().nullable(), licenseWithdrawnDate: dateValue.optional().nullable(), licenseWithdrawalReason: optionalText, notes: optionalText })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await db.insert(personalVehicles).values({ ...input, ownerId: ctx.user.id });
      return { id: Number(result[0].insertId), success: true } as const;
    }),
  }),
  vehicleVisits: router({
    list: protectedProcedure.input(z.object({ vehicleId: z.number().int().positive().optional() }).optional()).query(async ({ ctx, input }) => {
      const db = await requireDb();
      const filters = [eq(personalVehicleVisits.ownerId, ctx.user.id)];
      if (input?.vehicleId) filters.push(eq(personalVehicleVisits.vehicleId, input.vehicleId));
      return db.select().from(personalVehicleVisits).where(and(...filters)).orderBy(desc(personalVehicleVisits.visitDate));
    }),
    create: protectedProcedure.input(z.object({ vehicleId: z.number().int().positive(), visitDate: dateValue, visitType: z.enum(["inspection", "renewal", "license", "withdrawal", "other"]), result: z.string().trim().max(255).optional().nullable(), nextDueDate: dateValue.optional().nullable(), fees: z.number().int().nonnegative().default(0), notes: optionalText })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await db.insert(personalVehicleVisits).values({ ...input, ownerId: ctx.user.id });
      return { id: Number(result[0].insertId), success: true } as const;
    }),
  }),
});
