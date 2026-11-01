import { NextResponse } from "next/server";
import { db } from "@/db";
import { walls, wallPosts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// صورة مشاركة واحدة — المنشورة متاحة للجميع، والمعلّقة للمعلم فقط
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  const { slug, postId } = await params;
  const [wall] = await db
    .select({ id: walls.id })
    .from(walls)
    .where(eq(walls.slug, slug));
  if (!wall) return new NextResponse("not found", { status: 404 });

  const [post] = await db
    .select({
      image: wallPosts.image,
      mime: wallPosts.mime,
      approved: wallPosts.approved,
    })
    .from(wallPosts)
    .where(
      and(eq(wallPosts.id, Number(postId)), eq(wallPosts.wallId, wall.id))
    );

  if (!post || !post.image)
    return new NextResponse("not found", { status: 404 });

  // المشاركة المعلّقة لا تُعرض صورتها إلا للمعلم المسجّل دخوله
  if (!post.approved && !(await isAuthed()))
    return new NextResponse("unauthorized", { status: 401 });

  const data = post.image as Buffer;
  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": post.mime || "image/jpeg",
      "Content-Length": String(data.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
