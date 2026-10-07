CREATE TABLE "quran_marks" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"surah" integer NOT NULL,
	"points" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "recitation" double precision;--> statement-breakpoint
ALTER TABLE "quran_marks" ADD CONSTRAINT "quran_marks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quran_student_surah" ON "quran_marks" USING btree ("student_id","surah");