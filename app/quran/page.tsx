import Nav from "@/components/Nav";
import ClassTabs from "@/components/ClassTabs";
import { getClasses } from "@/lib/grades";
import { db } from "@/db";
import { students, quranMarks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { SURAHS, LEVELS } from "@/lib/surahs";
import { saveQuran, bulkSetSurah } from "./actions";
import RowSaveButton from "@/components/RowSaveButton";
import StudentSearch from "@/components/StudentSearch";
import SelectAllCheckbox from "@/components/SelectAllCheckbox";
import QuranBulk from "@/components/QuranBulk";
import ReadingBadge from "@/components/ReadingBadge";

export const dynamic = "force-dynamic";

export default async function QuranPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const classes = await getClasses();
  const sp = await searchParams;
  const activeId = Number(sp.class) || classes[0]?.id;

  const rows = await db
    .select()
    .from(students)
    .where(eq(students.classId, activeId))
    .orderBy(students.code);
  const ids = rows.map((r) => r.id);

  const marks = ids.length
    ? await db
        .select()
        .from(quranMarks)
        .where(
          sql`${quranMarks.studentId} in (${sql.join(
            ids.map((i) => sql`${i}`),
            sql`, `
          )})`
        )
    : [];
  const markMap = new Map<string, number>();
  for (const m of marks) markMap.set(`${m.studentId}_${m.surah}`, m.points);

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold">القرآن (الحفظ والتلاوة)</h1>
          <div className="text-muted text-sm">
            كل سورة من 1: ممتاز=1، جيد جدًا=⅔، جيد=⅓. + تلاوة المدثر من 4.
            المجموع /20 تلقائيًا.
          </div>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <ClassTabs classes={classes} active={activeId} base="/quran" />
          <StudentSearch />
        </div>

        <QuranBulk surahs={SURAHS} levels={LEVELS} bulkSetSurah={bulkSetSurah} />

        <form className="card p-3 space-y-3">
          <input type="hidden" name="ids" value={ids.join(",")} />
          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead>
                <tr>
                  <th className="sticky right-0 bg-brand">
                    <SelectAllCheckbox /> الطالب
                  </th>
                  {SURAHS.map((s) => (
                    <th key={s.num} className="whitespace-nowrap">
                      {s.name}
                    </th>
                  ))}
                  <th>تلاوة المدثر (4)</th>
                  <th>الحفظ (16)</th>
                  <th>القرآن (20)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((st) => {
                  let hifzPts = 0;
                  for (const s of SURAHS)
                    hifzPts += markMap.get(`${st.id}_${s.num}`) ?? 0;
                  const hifz = Math.round((hifzPts / 3) * 100) / 100;
                  const rec = st.recitation ?? 0;
                  const totalQ = Math.round((hifz + rec) * 100) / 100;
                  return (
                    <tr key={st.id} data-name={st.name}>
                      <td className="sticky right-0 bg-card whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rowchk ml-1"
                          value={st.id}
                        />
                        {st.name} <ReadingBadge level={st.readingLevel} />
                      </td>
                      {SURAHS.map((s) => {
                        const v = markMap.get(`${st.id}_${s.num}`);
                        return (
                          <td key={s.num} className="p-0">
                            <select
                              name={`q_${st.id}_${s.num}`}
                              defaultValue={v ?? ""}
                              className="w-20 text-center border-0 rounded-none bg-transparent text-xs"
                            >
                              <option value="">—</option>
                              {LEVELS.map((l) => (
                                <option key={l.points} value={l.points}>
                                  {l.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        );
                      })}
                      <td className="p-0">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max="4"
                          name={`rec_${st.id}`}
                          defaultValue={st.recitation ?? ""}
                          className="w-16 text-center border-0 rounded-none bg-transparent"
                        />
                      </td>
                      <td className="text-center text-muted">{hifz}</td>
                      <td className="text-center font-bold text-brand">
                        {totalQ}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <RowSaveButton action={saveQuran} toast="تم حفظ درجات القرآن" className="btn">
              حفظ القرآن
            </RowSaveButton>
          </div>
        </form>
      </main>
    </div>
  );
}
