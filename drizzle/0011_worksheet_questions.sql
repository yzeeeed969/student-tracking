CREATE TABLE IF NOT EXISTS "worksheet_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"worksheet_id" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"prompt" text DEFAULT '' NOT NULL,
	"options" text DEFAULT '[]' NOT NULL,
	"correct_index" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "worksheet_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"worksheet_id" integer NOT NULL,
	"score" double precision,
	"correct" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"device" text DEFAULT '' NOT NULL,
	"ip" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "worksheet_questions" ADD CONSTRAINT "worksheet_questions_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "worksheet_attempts" ADD CONSTRAINT "worksheet_attempts_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "worksheet_attempts" ADD CONSTRAINT "worksheet_attempts_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wsq_worksheet" ON "worksheet_questions" USING btree ("worksheet_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wsa_student_ws" ON "worksheet_attempts" USING btree ("student_id","worksheet_id");
