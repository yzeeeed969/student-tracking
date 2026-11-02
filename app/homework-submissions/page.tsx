import { db } from "@/db";
import {
  homeworkSubmissions,
  students,
  classRooms,
  homeworkMarks,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { TAQWEEM_PAGES } from "@/lib/taqweemPages";
import { deleteSubmission } from "./actions";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d).toLocaleString("ar-SA-u-nu-latn", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function HomeworkSubmissionsPage() {
  const rows = await db
    .select({
      id: homeworkSubmissions.id,
      num: homeworkSubmissions.num,
      createdAt: homeworkSubmissions.createdAt,
      studentId: homeworkSubmissions.studentId,
      studentName: students.name,
      className: classRooms.name,
    })
    .from(homeworkSubmissions)
    .leftJoin(students, eq(homeworkSubmissions.studentId, students.id))
    .leftJoin(classRooms, eq(students.classId, classRooms.id))
    .orderBy(desc(homeworkSubmissions.createdAt));

  // هل الدرجة مرصودة لكل تسليم؟ (لمعرفة ما إن رُصدت تلقائيًا أو كانت مرصودة مسبقًا)
  const marks = await db
    .select({ studentId: homeworkMarks.studentId, num: homeworkMarks.num })
    .from(homeworkMarks);
  const graded = new Set(marks.map((m) => `${m.studentId}_${m.num}`));

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">واجبات الطلاب المرفوعة</h1>
          <span className="text-muted text-sm">{rows.length} صورة</span>
        </div>

        <div className="card p-4 text-sm text-muted">
          هذه الصور رفعها الطلاب من الصفحة العامة. تُرصد درجة «تم الحل» تلقائيًا
          عند الرفع إن كانت خانة الواجب فارغة، وتُترك كما هي إن كانت مرصودة. راجع
          الصور هنا، ويمكنك تعديل أي درجة من صفحة «الرصد ← الواجبات». حذف الصورة
          لا يحذف الدرجة.
        </div>

        {rows.length === 0 ? (
          <div className="card p-8 text-center text-muted">
            لا توجد واجبات مرفوعة بعد.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {rows.map((r) => {
              const page = TAQWEEM_PAGES[r.num] ?? null;
              const isGraded = graded.has(`${r.studentId}_${r.num}`);
              return (
                <div key={r.id} className="card p-2 space-y-2">
                  <a
                    href={`/api/hw-submission-image/${r.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/hw-submission-image/${r.id}`}
                      alt={`واجب ${r.num}`}
                      className="w-full h-40 object-cover rounded-md bg-black/5"
                      loading="lazy"
                    />
                  </a>
                  <div className="space-y-0.5 px-1">
                    <div className="font-bold text-sm truncate">
                      {r.studentName ?? "طالب محذوف"}
                    </div>
                    <div className="text-xs text-muted">{r.className ?? "—"}</div>
                    <div className="text-xs">
                      الواجب {r.num}
                      {page != null ? ` · التقويم ص ${page}` : ""}
                      {isGraded ? (
                        <span className="text-brand"> · ✓ مرصود</span>
                      ) : (
                        <span className="text-amber-600"> · غير مرصود</span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted">{fmt(r.createdAt)}</div>
                  </div>
                  <form action={deleteSubmission} className="px-1 pb-1">
                    <input type="hidden" name="id" value={r.id} />
                    <button className="text-xs text-muted hover:text-red-500">
                      🗑 حذف الصورة
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
