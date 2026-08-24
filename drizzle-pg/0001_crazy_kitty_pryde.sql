ALTER TABLE "children" ADD COLUMN "relation" varchar(40) DEFAULT 'ابن/ابنة';--> statement-breakpoint
ALTER TABLE "children" ADD COLUMN "nationalId" varchar(14);--> statement-breakpoint
ALTER TABLE "children" ADD COLUMN "birthDate" timestamp;--> statement-breakpoint
ALTER TABLE "children" ADD COLUMN "bloodType" varchar(12);--> statement-breakpoint
ALTER TABLE "children" ADD COLUMN "healthNotes" text;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "weekDay" varchar(30);--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "paidAmount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "whatsapp" varchar(32);--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "availability" varchar(160);