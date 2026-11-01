import { NextResponse } from "next/server";
import { db } from "@/db";
import { walls, wallPosts } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// قائمة المشاركات المنشورة (المعتمدة) لحائط عام — بلا تسجيل دخول
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const [wall] = await db
    .select({ id: walls.id, open: walls.open, cells: walls.cells })
    .from(walls)
    .where(eq(walls.slug, slug));
  if (!wall) return NextResponse.json({ error: "not found" }, { status: 404 });

  const rows = await db
    .select({
      id: wallPosts.id,
      name: wallPosts.name,
      text: wallPosts.text,
      cell: wallPosts.cell,
      hasImage: sql<boolean>`${wallPosts.image} is not null`,
      createdAt: wallPosts.createdAt,
    })
    .from(wallPosts)
    .where(and(eq(wallPosts.wallId, wall.id), eq(wallPosts.approved, true)))
    .orderBy(desc(wallPosts.createdAt))
    .limit(300);

  const posts = rows.map((r) => ({
    id: r.id,
    name: r.name,
    text: r.text,
    cell: r.cell,
    hasImage: !!r.hasImage,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ open: wall.open, cells: wall.cells, posts });
}
