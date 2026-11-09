CREATE TABLE IF NOT EXISTS "recitation_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"surah" integer NOT NULL,
	"grade" integer NOT NULL,
	"graded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "recitation_log" ADD CONSTRAINT "recitation_log_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recitelog_student" ON "recitation_log" USING btree ("student_id");
