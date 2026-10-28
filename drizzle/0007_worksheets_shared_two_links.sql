DELETE FROM "worksheets";--> statement-breakpoint
ALTER TABLE "worksheets" DROP CONSTRAINT "worksheets_class_id_class_rooms_id_fk";--> statement-breakpoint
DROP INDEX "ws_class_num";--> statement-breakpoint
ALTER TABLE "worksheets" DROP COLUMN "class_id";--> statement-breakpoint
ALTER TABLE "worksheets" DROP COLUMN "links";--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN "page" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN "url_c1" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN "url_c2" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_num_unique" UNIQUE("num");
