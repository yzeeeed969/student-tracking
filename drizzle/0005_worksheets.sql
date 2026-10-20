CREATE TABLE "worksheet_marks" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"worksheet_id" integer NOT NULL,
	"score" double precision
);
--> statement-breakpoint
CREATE TABLE "worksheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"num" integer NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"links" text DEFAULT '[]' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "worksheets_num_unique" UNIQUE("num")
);
--> statement-breakpoint
ALTER TABLE "worksheet_marks" ADD CONSTRAINT "worksheet_marks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheet_marks" ADD CONSTRAINT "worksheet_marks_worksheet_id_worksheets_id_fk" FOREIGN KEY ("worksheet_id") REFERENCES "public"."worksheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ws_student_worksheet" ON "worksheet_marks" USING btree ("student_id","worksheet_id");