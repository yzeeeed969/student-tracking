import { NextResponse } from "next/server";
import { db } from "@/db";
import { walls, wallPosts } from "@/db/schema";
import { and, desc, eq, gt } from "drizzle-orm";

export const dynamic = "force-dynamic";

const TEXT_MAX = 500;
const NAME_MAX = 40;
const COOLDOWN_MS = 30_000; // 30 ثانية بين مشاركتين من نفس الجهاز
const IP_GAP_MS = 5_000; // 5 ثوانٍ بين مشاركتين من نفس الشبكة
const MAX_IMAGE_BYTES = 1_600_000; // ~1.5 ميجابايت كحد أقصى للصورة المخزّنة

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for") || "";
  return (xf.split(",")[0] || "").trim() || "unknown";
}

// إضافة مشاركة جديدة إلى حائط عام — بلا تسجيل دخول
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const [wall] = await db
    .select({
      id: walls.id,
      open: walls.open,
      moderated: walls.moderated,
      cells: walls.cells,
    })
    .from(walls)
    .where(eq(walls.slug, slug));
  if (!wall) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!wall.open)
    return NextResponse.json({ error: "closed" }, { status: 403 });

  let body: {
    name?: string;
    text?: string;
    device?: string;
    image?: string | null;
    cell?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const name = String(body.name || "").trim().slice(0, NAME_MAX);
  const text = String(body.text || "").trim().slice(0, TEXT_MAX);
  const device = String(body.device || "").slice(0, 100);
  const ip = clientIp(req);

  // رقم المربّع المختار — لا بدّ أن يكون ضمن عدد أماكن اللوحة
  const cell = Math.round(Number(body.cell));
  if (!Number.isInteger(cell) || cell < 0 || cell >= wall.cells)
    return NextResponse.json({ error: "bad cell" }, { status: 400 });

  if (!name) return NextResponse.json({ error: "no name" }, { status: 400 });

  // فكّ الصورة (إن وُجدت) والتحقّق من حجمها
  let imageBuf: Buffer | null = null;
  let mime = "";
  if (body.image && typeof body.image === "string") {
    const m = body.image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!m) return NextResponse.json({ error: "bad image" }, { status: 400 });
    mime = m[1];
    try {
      imageBuf = Buffer.from(m[2], "base64");
    } catch {
      return NextResponse.json({ error: "bad image" }, { status: 400 });
    }
    if (imageBuf.length > MAX_IMAGE_BYTES)
      return NextResponse.json({ error: "too large" }, { status: 413 });
  }

  if (!text && !imageBuf)
    return NextResponse.json({ error: "empty" }, { status: 400 });

  // الحدّ من التكرار السريع: نفس الجهاز خلال 30 ثانية
  if (device) {
    const since = new Date(Date.now() - COOLDOWN_MS);
    const [recent] = await db
      .select({ createdAt: wallPosts.createdAt })
      .from(wallPosts)
      .where(
        and(
          eq(wallPosts.wallId, wall.id),
          eq(wallPosts.device, device),
          gt(wallPosts.createdAt, since)
        )
      )
      .orderBy(desc(wallPosts.createdAt))
      .limit(1);
    if (recent) {
      const wait = Math.ceil(
        (COOLDOWN_MS - (Date.now() - new Date(recent.createdAt).getTime())) /
          1000
      );
      return NextResponse.json(
        { error: "cooldown", wait: Math.max(1, wait) },
        { status: 429 }
      );
    }
  }

  // حماية إضافية: نفس الشبكة خلال 5 ثوانٍ
  if (ip && ip !== "unknown") {
    const since = new Date(Date.now() - IP_GAP_MS);
    const [recent] = await db
      .select({ id: wallPosts.id })
      .from(wallPosts)
      .where(
        and(
          eq(wallPosts.wallId, wall.id),
          eq(wallPosts.ip, ip),
          gt(wallPosts.createdAt, since)
        )
      )
      .limit(1);
    if (recent)
      return NextResponse.json(
        { error: "cooldown", wait: 5 },
        { status: 429 }
      );
  }

  // منع حجز مربّع محجوز مسبقًا (تحقّق مبكر لرسالة ألطف)
  const [taken] = await db
    .select({ id: wallPosts.id })
    .from(wallPosts)
    .where(and(eq(wallPosts.wallId, wall.id), eq(wallPosts.cell, cell)))
    .limit(1);
  if (taken)
    return NextResponse.json({ error: "cell taken" }, { status: 409 });

  let newId: number | undefined;
  try {
    const [row] = await db
      .insert(wallPosts)
      .values({
        wallId: wall.id,
        name,
        text,
        image: imageBuf,
        mime,
        approved: !wall.moderated,
        device,
        ip,
        cell,
      })
      .returning({ id: wallPosts.id });
    newId = row?.id;
  } catch (e: unknown) {
    // تعارض عند حجز نفس المربّع في نفس اللحظة من طالبين (unique violation)
    const code = (e as { code?: string })?.code;
    if (code === "23505")
      return NextResponse.json({ error: "cell taken" }, { status: 409 });
    throw e;
  }

  return NextResponse.json({ ok: true, pending: wall.moderated, id: newId });
}
