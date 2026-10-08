import Nav from "@/components/Nav";
import ClassTabs from "@/components/ClassTabs";
import { getClasses } from "@/lib/grades";
import { db } from "@/db";
import { students, homeworkMarks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { saveHomework, saveOneHomework, bulkSetHomework } from "./actions";
import RowSaveButton from "@/components/RowSaveButton";
import StudentSearch from "@/components/StudentSearch";
import SelectAllCheckbox from "@/components/SelectAllCheckbox";
import HomeworkBulk from "@/components/HomeworkBulk";

export const dynamic = "force-dynamic";

export default async function HomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const classes = await getClasses();
  const sp = await searchParams;
  const activeId = Number(sp.class) || classes[0]?.id;
  const s = await getSettings();
  const count = Number(s.homework_count ?? 18);

  const rows = await db
    .select()
    .from(students)
    .where(eq(students.classId, activeId))
    .orderBy(students.code);
  const ids = rows.map((r) => r.id);

  const marks = ids.length
    ? await db
        .select()
        .from(homeworkMarks)
        .where(
          sql`${homeworkMarks.studentId} in (${sql.join(
            ids.map((i) => sql`${i}`),
            sql`, `
          )})`
        )
    : [];
  const markMap = new Map<string, number>();
  for (const m of marks)
    if (m.score != null) markMap.set(`${m.studentId}_${m.num}`, m.score);

  const nums = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold">الواجبات</h1>
          <div className="text-muted text-sm">
            كل خانة واجب: اختر 1 أو 0.5، والفراغ = لم يُرصد. يُجمع تلقائيًا.
            احفظ الواجبات قبل إرسال الواتساب ليُحتسب آخر رصد.
          </div>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <ClassTabs classes={classes} active={activeId} base="/homework" />
          <StudentSearch />
        </div>

        <HomeworkBulk count={count} bulkSetHomework={bulkSetHomework} />

        <form className="card p-3 space-y-3">
          <input type="hidden" name="count" value={count} />
          <input type="hidden" name="ids" value={ids.join(",")} />
          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead>
                <tr>
                  <th className="sticky right-0 bg-brand">
                    <SelectAllCheckbox /> الطالب
                  </th>
                  {nums.map((n) => (
                    <th key={n}>{n}</th>
                  ))}
                  <th>المجموع</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((st) => {
                  let sum = 0;
                  for (const n of nums) sum += markMap.get(`${st.id}_${n}`) ?? 0;
                  return (
                    <tr key={st.id} data-name={st.name}>
                      <td className="sticky right-0 bg-card whitespace-nowrap">
                        <div>
                          <input
                            type="checkbox"
                            className="rowchk ml-1"
                            value={st.id}
                          />
                          {st.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <RowSaveButton
                            action={saveOneHomework.bind(null, st.id)}
                            toast="تم حفظ درجات الطالب"
                            className="text-xs bg-brand text-white rounded px-2 py-0.5 hover:opacity-90"
                          >
                            حفظ
                          </RowSaveButton>
                          {st.phone ? (
                            <a
                              href={`/api/whatsapp?studentId=${st.id}&kind=${encodeURIComponent(
                                "واجبات"
                              )}`}
                              target="_blank"
                              className="text-xs text-green-600 hover:underline"
                            >
                              واتساب
                            </a>
                          ) : (
                            <span className="text-xs text-muted">لا جوال</span>
                          )}
                        </div>
                      </td>
                      {nums.map((n) => {
                        const v = markMap.get(`${st.id}_${n}`);
                        return (
                          <td key={n} className="p-0">
                            <select
                              name={`hw_${st.id}_${n}`}
                              defaultValue={v ?? ""}
                              className="w-14 text-center border-0 rounded-none bg-transparent"
                            >
                              <option value="">—</option>
                              <option value="1">1</option>
                              <option value="0.5">0.5</option>
                            </select>
                          </td>
                        );
                      })}
                      <td className="text-center font-bold text-brand">
                        {Math.round(sum * 100) / 100}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <RowSaveButton
              action={saveHomework}
              toast="تم حفظ الواجبات"
              className="btn"
            >
              حفظ الواجبات
            </RowSaveButton>
          </div>
        </form>
      </main>
    </div>
  );
}
