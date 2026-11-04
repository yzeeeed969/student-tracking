import { db } from "@/db";
import {
  worksheets,
  worksheetQuestions,
  classRooms,
  students,
} from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { parseOptions } from "@/lib/worksheetQuestions";
import SolveClient from "@/components/SolveClient";
import { orderByName } from "@/lib/order";

export const dynamic = "force-dynamic";

export default async function SolvePage({
  params,
}: {
  params: Promise<{ num: string }>;
}) {
  const { num } = await params;
  const n = Number(num);
  const [ws] = await db.select().from(worksheets).where(eq(worksheets.num, n));

  const notReady = (msg: string) => (
    <div className="min-h-screen flex items-center justify-center p-6" dir="rtl">
      <div className="card p-6 text-center max-w-sm">
        <div className="text-2xl mb-2">📝</div>
        <div className="font-bold mb-1">ورقة العمل غير متاحة</div>
        <div className="text-muted text-sm">{msg}</div>
      </div>
    </div>
  );

  if (!ws) return notReady("تأكّد من الرابط، أو اطلب من المعلم رابطًا جديدًا.");
  if (!ws.published)
    return notReady("لم يفتح المعلم هذه الورقة بعد. حاول لاحقًا.");

  const qRows = await db
    .select()
    .from(worksheetQuestions)
    .where(eq(worksheetQuestions.worksheetId, ws.id))
    .orderBy(asc(worksheetQuestions.order), asc(worksheetQuestions.id));

  if (qRows.length === 0)
    return notReady("لم يُضف المعلم أسئلة لهذه الورقة بعد.");

  // لا نُرسل الإجابة الصحيحة للمتصفح — التصحيح يتم في الخادم
  const questions = qRows.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: parseOptions(q.options),
  }));

  const classes = await db
    .select()
    .from(classRooms)
    .orderBy(asc(classRooms.order), asc(classRooms.id));
  const studentRows = await db
    .select({ id: students.id, name: students.name, classId: students.classId })
    .from(students)
    .where(eq(students.active, true))
    .orderBy(orderByName);

  const roster = classes.map((c) => ({
    classId: c.id,
    className: c.name,
    students: studentRows
      .filter((s) => s.classId === c.id)
      .map((s) => ({ id: s.id, name: s.name })),
  }));

  return (
    <div className="min-h-screen" dir="rtl">
      <SolveClient
        num={ws.num}
        title={ws.title}
        questions={questions}
        roster={roster}
      />
    </div>
  );
}
