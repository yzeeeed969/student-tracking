import { db } from "@/db";
import { recitationLog, students, classRooms } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SURAHS, LEVELS } from "@/lib/surahs";
import Link from "next/link";

export const dynamic = "force-dynamic";

const surahName = (num: number) =>
  SURAHS.find((s) => s.num === num)?.name ?? String(num);

const gradeLabel = (points: number) =>
  LEVELS.find((l) => l.points === points)?.label ?? String(points);

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);

export default async function ArchivePage() {
  const rows = await db
    .select({
      id: recitationLog.id,
      surah: recitationLog.surah,
      grade: recitationLog.grade,
      gradedAt: recitationLog.gradedAt,
      studentName: students.name,
      className: classRooms.name,
    })
    .from(recitationLog)
    .leftJoin(students, eq(recitationLog.studentId, students.id))
    .leftJoin(classRooms, eq(students.classId, classRooms.id))
    .orderBy(desc(recitationLog.gradedAt));

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">أرشيف التسميع</h1>
          <Link href="/recitations" className="text-brand text-sm font-bold">
            ← التسميعات الجديدة
          </Link>
        </div>

        <div className="card p-3 text-sm text-muted">
          سِجلّ لكل تسميع تم رصده عبر التطبيق: اسم الطالب والسورة والتاريخ
          والدرجة. (التسجيل الصوتي يُحذف تلقائيًا بعد الرصد.)
        </div>

        {rows.length === 0 ? (
          <div className="card p-8 text-center text-muted">
            <div className="text-3xl mb-2">🗂️</div>
            لا يوجد في الأرشيف بعد. يظهر هنا كل تسميع فور رصد درجته.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.id}
                className="card p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-bold truncate">
                    {r.studentName ?? "طالب"}
                    {r.className ? (
                      <span className="text-muted font-normal text-sm">
                        {" "}
                        · {r.className}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-muted">
                    سورة {surahName(r.surah)} — {fmtDate(r.gradedAt)}
                  </div>
                </div>
                <span className="flex-none rounded-lg bg-brand/10 text-brand px-2.5 py-1 text-sm font-bold whitespace-nowrap">
                  {gradeLabel(r.grade)}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
