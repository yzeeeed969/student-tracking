import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, homeworkSubmissions, homeworkMarks } from "@/db/schema";
import { and, desc, eq, gt } from "drizzle-orm";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const COOLDOWN_MS = 20_000; // 20 ثانية بين رفعين من نفس الجهاز
const IP_GAP_MS = 4_000; // 4 ثوانٍ بين رفعين من نفس الشبكة
const MAX_IMAGE_BYTES = 1_300_000; // ~1.3 ميجابايت كحد أقصى للصورة المخزّنة
const DONE_SCORE = 1; // درجة «تم حلّ الواجب»

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for") || "";
  return (xf.split(",")[0] || "").trim() || "unknown";
}

// يُبقي آخر 9 أرقام فقط (يتجاهل 966 أو الصفر الأول والمسافات) — مطابق لصفحة ولي الأمر
function normPhone(p: string): string {
  return (p || "").replace(/\D/g, "").slice(-9);
}

// رفع صورة واجب من الصفحة العامة — بلا تسجيل دخول
// يتحقّق أن رقم الجوال يطابق الطالب، ثم يحفظ الصورة ويرصد الدرجة إن كانت الخانة فارغة
export async function POST(req: Request) {
  let body: {
    phone?: string;
    studentId?: number;
    num?: number;
    image?: string;
    device?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const key = normPhone(String(body.phone || ""));
  const studentId = Math.round(Number(body.studentId));
  const num = Math.round(Number(body.num));
  const device = String(body.device || "").slice(0, 100);
  const ip = clientIp(req);

  if (key.length < 9)
    return NextResponse.json({ error: "bad phone" }, { status: 400 });
  if (!Number.isInteger(studentId) || studentId <= 0)
    return NextResponse.json({ error: "bad student" }, { status: 400 });

  const s = await getSettings();
  const homeworkCount = Number(s.homework_count ?? 18);
  if (!Number.isInteger(num) || num < 1 || num > homeworkCount)
    return NextResponse.json({ error: "bad num" }, { status: 400 });

  // التحقّق أن الطالب موجود وأن رقم الجوال يطابقه (حماية من الرصد لطالب آخر)
  const [stu] = await db
    .select({ id: students.id, phone: students.phone })
    .from(students)
    .where(eq(students.id, studentId));
  if (!stu || normPhone(stu.phone || "") !== key)
    return NextResponse.json({ error: "mismatch" }, { status: 403 });

  // فكّ الصورة والتحقّق من حجمها (الصورة مطلوبة)
  if (!body.image || typeof body.image !== "string")
    return NextResponse.json({ error: "no image" }, { status: 400 });
  const m = body.image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return NextResponse.json({ error: "bad image" }, { status: 400 });
  const mime = m[1];
  let imageBuf: Buffer;
  try {
    imageBuf = Buffer.from(m[2], "base64");
  } catch {
    return NextResponse.json({ error: "bad image" }, { status: 400 });
  }
  if (imageBuf.length === 0)
    return NextResponse.json({ error: "empty" }, { status: 400 });
  if (imageBuf.length > MAX_IMAGE_BYTES)
    return NextResponse.json({ error: "too large" }, { status: 413 });

  // الحدّ من التكرار السريع: نفس الجهاز خلال 20 ثانية
  if (device) {
    const since = new Date(Date.now() - COOLDOWN_MS);
    const [recent] = await db
      .select({ createdAt: homeworkSubmissions.createdAt })
      .from(homeworkSubmissions)
      .where(
        and(
          eq(homeworkSubmissions.device, device),
          gt(homeworkSubmissions.createdAt, since)
        )
      )
      .orderBy(desc(homeworkSubmissions.createdAt))
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

  // حماية إضافية: نفس الشبكة خلال 4 ثوانٍ
  if (ip && ip !== "unknown") {
    const since = new Date(Date.now() - IP_GAP_MS);
    const [recent] = await db
      .select({ id: homeworkSubmissions.id })
      .from(homeworkSubmissions)
      .where(
        and(
          eq(homeworkSubmissions.ip, ip),
          gt(homeworkSubmissions.createdAt, since)
        )
      )
      .limit(1);
    if (recent)
      return NextResponse.json({ error: "cooldown", wait: 4 }, { status: 429 });
  }

  // احفظ الصورة (استبدل أي صورة سابقة لنفس الواجب)
  await db
    .insert(homeworkSubmissions)
    .values({ studentId, num, image: imageBuf, mime, device, ip })
    .onConflictDoUpdate({
      target: [homeworkSubmissions.studentId, homeworkSubmissions.num],
      set: { image: imageBuf, mime, device, ip, createdAt: new Date() },
    });

  // ارصد الدرجة فقط إن كانت الخانة فارغة — إن كانت مرصودة تُترك كما هي
  let graded = false;
  const ins = await db
    .insert(homeworkMarks)
    .values({ studentId, num, score: DONE_SCORE })
    .onConflictDoNothing({
      target: [homeworkMarks.studentId, homeworkMarks.num],
    })
    .returning({ id: homeworkMarks.id });
  graded = ins.length > 0;

  return NextResponse.json({ ok: true, graded });
}
