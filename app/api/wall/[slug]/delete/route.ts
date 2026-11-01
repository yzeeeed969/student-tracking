import { NextResponse } from "next/server";
import { db } from "@/db";
import { walls, wallPosts } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// حذف الطالب لمشاركته هو فقط — يُتحقّق من الملكية عبر رمز الجهاز
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const [wall] = await db
    .select({ id: walls.id })
    .from(walls)
    .where(eq(walls.slug, slug));
  if (!wall) return NextResponse.json({ error: "not found" }, { status: 404 });

  let body: { postId?: number; device?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const postId = Math.round(Number(body.postId));
  const device = String(body.device || "").slice(0, 100);
  if (!Number.isInteger(postId) || !device)
    return NextResponse.json({ error: "bad request" }, { status: 400 });

  const [post] = await db
    .select({ id: wallPosts.id, device: wallPosts.device })
    .from(wallPosts)
    .where(and(eq(wallPosts.id, postId), eq(wallPosts.wallId, wall.id)));

  // محذوفة أصلًا → نعتبرها نجاحًا كي ينظّف الجهاز قائمته
  if (!post) return NextResponse.json({ ok: true });

  // لا يُسمح بالحذف إلا لصاحب المشاركة (نفس الجهاز)
  if (!post.device || post.device !== device)
    return NextResponse.json({ error: "not owner" }, { status: 403 });

  await db.delete(wallPosts).where(eq(wallPosts.id, postId));
  return NextResponse.json({ ok: true });
}
