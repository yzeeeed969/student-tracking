import ClassTabs from "@/components/ClassTabs";
import { db } from "@/db";
import { students, quranMarks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { SURAHS, LEVELS } from "@/lib/surahs";
import { saveQuran, bulkSetSurah, setQuranCell } from "@/app/quran/actions";
import RowSaveButton from "@/components/RowSaveButton";
import AutoSelect from "@/components/AutoSelect";
import StudentSearch from "@/components/StudentSearch";
import SelectAllCheckbox from "@/components/SelectAllCheckbox";
import QuranBulk from "@/components/QuranBulk";
import StudentName from "@/components/StudentName";
import { orderByName } from "@/lib/order";

export default async function QuranSection({
  classes,
  activeId,
}: {
  classes: { id: number; name: string }[];
  activeId: number;
}) {
  const rows = await db
    .select()
    .from(students)
    .where(eq(students.classId, activeId))
    .orderBy(orderByName);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-muted text-sm">
          كل سورة من 1: ممتاز=1، جيد جدًا=⅔، جيد=⅓. المجموع /20 تلقائيًا (20
          سورة).
        </div>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <ClassTabs classes={classes} active={activeId} base="/record?view=quran" />
        <StudentSearch />
      </div>

      <QuranBulk surahs={SURAHS} levels={LEVELS} bulkSetSurah={bulkSetSurah} />

      <form className="card p-3 space-y-3">
        <input type="hidden" name="ids" value={ids.join(",")} />
        <div className="frozen-head">
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
                <th>القرآن (20)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((st) => {
                let hifzPts = 0;
                for (const s of SURAHS)
                  hifzPts += markMap.get(`${st.id}_${s.num}`) ?? 0;
                const totalQ = Math.round((hifzPts / 3) * 100) / 100;
                return (
                  <tr key={st.id} data-name={st.name}>
                    <td className="sticky right-0 bg-card whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rowchk ml-1"
                        value={st.id}
                      />
                      <StudentName
                        id={st.id}
                        name={st.name}
                        readingLevel={st.readingLevel}
                      />
                    </td>
                    {SURAHS.map((s) => {
                      const v = markMap.get(`${st.id}_${s.num}`);
                      return (
                        <td key={s.num} className="p-0">
                          <AutoSelect
                            name={`q_${st.id}_${s.num}`}
                            defaultValue={v != null ? String(v) : ""}
                            options={[
                              { v: "", l: "—" },
                              ...LEVELS.map((l) => ({
                                v: String(l.points),
                                l: l.label,
                              })),
                            ]}
                            action={setQuranCell.bind(null, st.id, s.num)}
                            className="w-20 text-center border-0 rounded-none bg-transparent text-xs"
                          />
                        </td>
                      );
                    })}
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
    </div>
  );
}
