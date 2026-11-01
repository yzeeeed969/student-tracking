ALTER TABLE "walls" ADD COLUMN "cells" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "wall_posts" ADD COLUMN "cell" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "wallpost_cell_uq" ON "wall_posts" USING btree ("wall_id","cell") WHERE "cell" is not null;
