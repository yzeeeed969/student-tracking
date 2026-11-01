CREATE TABLE "walls" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"goal" text DEFAULT '' NOT NULL,
	"moderated" boolean DEFAULT false NOT NULL,
	"open" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "walls_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "wall_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"wall_id" integer NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"image" "bytea",
	"mime" text DEFAULT '' NOT NULL,
	"approved" boolean DEFAULT true NOT NULL,
	"device" text DEFAULT '' NOT NULL,
	"ip" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wall_posts" ADD CONSTRAINT "wall_posts_wall_id_walls_id_fk" FOREIGN KEY ("wall_id") REFERENCES "public"."walls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wallpost_wall" ON "wall_posts" USING btree ("wall_id");
