import Nav from "@/components/Nav";
import { db } from "@/db";
import {
  students,
  classRooms,
  homeworkMarks,
  behaviorNotes,
  contactLogs,
} from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { computeClassGrades } from "@/lib/grades";
import { getSettings } from "@/lib/settings";
import Link from "next/link";
import ReadingBadge from "@/components/ReadingBadge";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("ar-SA-u-nu-latn");
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const sp = await searchParams;
  const all = await db
    .select({
      id: students.id,
      name: students.name,
      classId: students.classId,
      className: classRooms.name,
      readingLevel: students.readingLevel,
    })
    .from(students)
    .leftJoin(classRooms, eq(students.classId, classRooms.id))
    .orderBy(students.code);

  const sid = Number(sp.student) || all[0]?.id;
  const current = all.find((a) => a.id === sid);
  const s = await getSettings();
  const homeworkCount = Number(s.homework_count ?? 18);

  let card = null;
  if (current) {
    const { rows } = await computeClassGrades(current.classId);
    const g = rows.find((r) => r.id === sid)!;

    const marks = await db
      .select()
      .from(homeworkMarks)
      .where(eq(homeworkMarks.studentId, sid));
    const recorded = new Set(marks.map((m) => m.num));
    const missing: number[] = [];
    for (let i = 1; i <= homeworkCount; i++)
      if (!recorded.has(i)) missing.push(i);

    const notes = await db
      .select()
      .from(behaviorNotes)
      .where(eq(behaviorNotes.studentId, sid))
      .orderBy(desc(behaviorNotes.date))
      .limit(20);
    const logs = await db
      .select()
      .from(contactLogs)
      .where(eq(contactLogs.studentId, sid))
      .orderBy(desc(contactLogs.date))
      .limit(20);

    card = { g, missing, notes, logs };
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold">تقرير الطالب</h1>
          <form className="flex items-center gap-2 text-sm">
            <select name="student" defaultValue={sid} className="min-w-64">
              {all.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.className})
                </option>
              ))}
            </select>
            <button className="btn-ghost btn">عرض</button>
          </form>
        </div>

        {card && current && (
          <>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="card p-5 space-y-2">
                <div className="text-lg font-bold text-brand">
                  {current.name} <ReadingBadge level={current.readingLevel} />
                </div>
                <div className="text-muted text-sm">
                  الفصل: {current.className}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <Stat label="القرآن" value={card.g.quran ?? "—"} />
                  <Stat
                    label="الشفهي والتحريري"
                    value={card.g.oralWritten ?? "—"}
                  />
                  <Stat label="الواجبات" value={card.g.homeworkScore} />
                  <Stat label="المشاركة" value={card.g.participationGrade} />
                </div>
                <div className="mt-3 p-3 rounded-lg bg-brandsoft text-center">
                  <span className="text-muted text-sm">المجموع: </span>
                  <span className="text-2xl font-bold text-brand">
                    {card.g.total ?? "—"}
                  </span>
                  <span className="text-muted"> / 100</span>
                </div>
              </div>

              <div className="card p-5 space-y-3">
                <div className="font-bold">الواجبات</div>
                <div className="text-sm">
                  المرصودة: {card.g.homeworkDone} من {homeworkCount}
                </div>
                <div className="text-sm">
                  غير المرصودة:{" "}
                  {card.missing.length ? (
                    <span className="text-red-500">
                      {card.missing.join("، ")}
                    </span>
                  ) : (
                    <span className="text-brand">لا شيء</span>
                  )}
                </div>
                <div className="font-bold mt-3">إرسال واتساب</div>
                <div className="flex gap-2 flex-wrap">
                  <a
                    target="_blank"
                    className="btn-ghost btn text-sm"
                    href={`/api/whatsapp?studentId=${sid}&kind=${encodeURIComponent(
                      "تعزيز"
                    )}`}
                  >
                    ✉ تعزيز
                  </a>
                  <form
                    action="/api/whatsapp"
                    method="get"
                    target="_blank"
                    className="flex gap-1"
                  >
                    <input type="hidden" name="studentId" value={sid} />
                    <input type="hidden" name="kind" value="عدم الإجابة" />
                    <input
                      name="lesson"
                      placeholder="اسم الدرس"
                      className="text-sm w-28"
                    />
                    <button className="btn-ghost btn text-sm">✉ عدم الإجابة</button>
                  </form>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="card p-4">
                <div className="font-bold mb-2">آخر الملاحظات</div>
                <table className="text-sm">
                  <tbody>
                    {card.notes.map((n) => (
                      <tr key={n.id}>
                        <td className="whitespace-nowrap">{fmt(n.date)}</td>
                        <td>{n.type}</td>
                        <td className="text-muted">{n.description}</td>
                      </tr>
                    ))}
                    {card.notes.length === 0 && (
                      <tr>
                        <td className="text-muted text-center">لا شيء</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="card p-4">
                <div className="font-bold mb-2">سجل التواصل</div>
                <table className="text-sm">
                  <tbody>
                    {card.logs.map((l) => (
                      <tr key={l.id}>
                        <td className="whitespace-nowrap">{fmt(l.date)}</td>
                        <td>{l.kind}</td>
                        <td className="text-muted">{l.message}</td>
                      </tr>
                    ))}
                    {card.logs.length === 0 && (
                      <tr>
                        <td className="text-muted text-center">لا شيء</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-[var(--border)] pb-1">
      <span className="text-muted">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
