CREATE TABLE "behavior_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "class_rooms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "contact_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"kind" text NOT NULL,
	"message" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homework_marks" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"num" integer NOT NULL,
	"score" double precision
);
--> statement-breakpoint
CREATE TABLE "participation" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"points" double precision DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"guardian_name" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"class_id" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"quran" double precision,
	"oral_written" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "students_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "behavior_notes" ADD CONSTRAINT "behavior_notes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_logs" ADD CONSTRAINT "contact_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework_marks" ADD CONSTRAINT "homework_marks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participation" ADD CONSTRAINT "participation_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_class_rooms_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."class_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "beh_student" ON "behavior_notes" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hw_student_num" ON "homework_marks" USING btree ("student_id","num");--> statement-breakpoint
CREATE INDEX "part_student" ON "participation" USING btree ("student_id");