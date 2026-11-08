CREATE TABLE IF NOT EXISTS "recitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"surah" integer NOT NULL,
	"audio" "bytea" NOT NULL,
	"mime" text DEFAULT 'audio/webm' NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"bytes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "recitations" ADD CONSTRAINT "recitations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "recite_student_surah" ON "recitations" USING btree ("student_id","surah");
