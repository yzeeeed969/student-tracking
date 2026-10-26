ALTER TABLE "worksheets" DROP CONSTRAINT "worksheets_num_unique";--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN "class_id" integer;--> statement-breakpoint
UPDATE "worksheets" SET "class_id" = (SELECT "id" FROM "class_rooms" ORDER BY "order", "id" LIMIT 1) WHERE "class_id" IS NULL;--> statement-breakpoint
ALTER TABLE "worksheets" ALTER COLUMN "class_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_class_id_class_rooms_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."class_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ws_class_num" ON "worksheets" USING btree ("class_id","num");
