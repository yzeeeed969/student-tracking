CREATE TABLE IF NOT EXISTS "evidence_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"element" integer NOT NULL,
	"title" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"mime" text DEFAULT 'application/octet-stream' NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"data" bytea NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "evidence_element" ON "evidence_files" USING btree ("element");
