import { db } from "@/db";
import { recitations, students, classRooms } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SURAHS } from "@/lib/surahs";
import RecitationRow from "@/components/RecitationRow";
import Link from "next/link";

export const dynamic = "force-dynamic";

const surahName = (num: number) =>
  SURAHS.find((s) => s.num === num)?.name ?? String(num);

export default async function RecitationsPage() {
  const rows = await db
    .select({
      studentId: recitations.studentId,
      surah: recitations.surah,
      createdAt: recitations.createdAt,
      studentName: students.name,
      className: classRooms.name,
    })
    .from(recitations)
    .leftJoin(students, eq(recitations.studentId, students.id))
    .leftJoin(classRooms, eq(students.classId, classRooms.id))
    .orderBy(desc(recitations.createdAt));

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">تسميعات الطلاب</h1>
          <div className="flex items-center gap-3">
            <span className="text-muted text-sm">
              بانتظار الرصد: {rows.length}
            </span>
            <Link
              href="/recitations/archive"
              className="text-brand text-sm font-bold whitespace-nowrap"
            >
              🗂️ الأرشيف
            </Link>
          </div>
        </div>

        <div className="card p-3 text-sm text-muted">
          استمع لتسميع الطالب ثم اختر الدرجة. تُرصد مباشرة في درجة القرآن لنفس
          السورة، ويُحذف التسجيل تلقائيًا بعد الرصد.
        </div>

        {rows.length === 0 ? (
          <div className="card p-8 text-center text-muted">
            <div className="text-3xl mb-2">📭</div>
            لا توجد تسميعات جديدة حاليًا. ستظهر هنا فور إرسال الطلاب تسميعهم.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <RecitationRow
                key={`${r.studentId}_${r.surah}`}
                studentId={r.studentId}
                surah={r.surah}
                surahName={surahName(r.surah)}
                studentName={r.studentName ?? "طالب"}
                className={r.className ?? ""}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
