import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  students,
  worksheets,
  worksheetQuestions,
  worksheetMarks,
  worksheetAttempts,
} from "@/db/schema";
import { and, asc, desc, eq, gt } from "drizzle-orm";
import { scoreFromCorrect } from "@/lib/worksheetQuestions";

export const dynamic = "force-dynamic";

const COOLDOWN_MS = 15_000; // 15 ثانية بين إرسالين من نفس الجهاز
const IP_GAP_MS = 3_000; // 3 ثوانٍ بين إرسالين من نفس الشبكة

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for") || "";
  return (xf.split(",")[0] || "").trim() || "unknown";
}

// إرسال حلّ ورقة عمل من الصفحة العامة — بلا تسجيل دخول
// يصحّح في الخادم، يسجّل المحاولة، ويرصد الدرجة فقط إن كانت الخانة فارغة
export async function POST(req: Request) {
  let body: {
    num?: number;
    studentId?: number;
    answers?: { id: number; choice: number }[];
    device?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const num = Math.round(Number(body.num));
  const studentId = Math.round(Number(body.studentId));
  const device = String(body.device || "").slice(0, 100);
  const ip = clientIp(req);
  const answers = Array.isArray(body.answers) ? body.answers : [];

  if (!Number.isInteger(num) || num < 1)
    return NextResponse.json({ error: "bad num" }, { status: 400 });
  if (!Number.isInteger(studentId) || studentId <= 0)
    return NextResponse.json({ error: "bad student" }, { status: 400 });

  // الورقة موجودة ومنشورة
  const [ws] = await db.select().from(worksheets).where(eq(worksheets.num, num));
  if (!ws || !ws.published)
    return NextResponse.json({ error: "not available" }, { status: 404 });

  // الطالب موجود ونشط
  const [stu] = await db
    .select({ id: students.id, classId: students.classId })
    .from(students)
    .where(eq(students.id, studentId));
  if (!stu) return NextResponse.json({ error: "mismatch" }, { status: 403 });

  // حدّ التكرار: نفس الجهاز خلال 15 ثانية
  if (device) {
    const since = new Date(Date.now() - COOLDOWN_MS);
    const [recent] = await db
      .select({ createdAt: worksheetAttempts.createdAt })
      .from(worksheetAttempts)
      .where(
        and(
          eq(worksheetAttempts.device, device),
          gt(worksheetAttempts.createdAt, since)
        )
      )
      .orderBy(desc(worksheetAttempts.createdAt))
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
  if (ip && ip !== "unknown") {
    const since = new Date(Date.now() - IP_GAP_MS);
    const [recent] = await db
      .select({ id: worksheetAttempts.id })
      .from(worksheetAttempts)
      .where(
        and(eq(worksheetAttempts.ip, ip), gt(worksheetAttempts.createdAt, since))
      )
      .limit(1);
    if (recent)
      return NextResponse.json({ error: "cooldown", wait: 3 }, { status: 429 });
  }

  // التصحيح في الخادم (الإجابات الصحيحة لا تغادر الخادم)
  const qRows = await db
    .select()
    .from(worksheetQuestions)
    .where(eq(worksheetQuestions.worksheetId, ws.id))
    .orderBy(asc(worksheetQuestions.order), asc(worksheetQuestions.id));
  if (qRows.length === 0)
    return NextResponse.json({ error: "no questions" }, { status: 400 });

  const chosen = new Map<number, number>();
  for (const a of answers) {
    const qid = Math.round(Number(a?.id));
    const ch = Math.round(Number(a?.choice));
    if (Number.isInteger(qid) && Number.isInteger(ch)) chosen.set(qid, ch);
  }

  let correct = 0;
  const total = qRows.length;
  for (const q of qRows) {
    if (chosen.get(q.id) === q.correctIndex) correct += 1;
  }
  const score = scoreFromCorrect(correct, total);

  // سجّل المحاولة دائمًا
  await db.insert(worksheetAttempts).values({
    studentId,
    worksheetId: ws.id,
    score,
    correct,
    total,
    device,
    ip,
  });

  // ارصد الدرجة فقط إن كانت الخانة فارغة — إن كانت مرصودة تُترك كما هي
  const ins = await db
    .insert(worksheetMarks)
    .values({ studentId, worksheetId: ws.id, score })
    .onConflictDoNothing({
      target: [worksheetMarks.studentId, worksheetMarks.worksheetId],
    })
    .returning({ id: worksheetMarks.id });
  const graded = ins.length > 0;

  return NextResponse.json({ ok: true, score, correct, total, graded });
}
