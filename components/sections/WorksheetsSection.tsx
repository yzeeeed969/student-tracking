import ClassTabs from "@/components/ClassTabs";
import { db } from "@/db";
import { students, worksheets, worksheetMarks } from "@/db/schema";
import { eq, sql, asc } from "drizzle-orm";
import { setWorksheetCell } from "@/app/worksheets/actions";
import AutoNumber from "@/components/AutoNumber";
import StudentSearch from "@/components/StudentSearch";
import ReadingBadge from "@/components/ReadingBadge";
import Link from "next/link";
import { getSettings, weights } from "@/lib/settings";
import { orderByName } from "@/lib/order";

export default async function WorksheetsSection({
  classes,
  activeId,
}: {
  classes: { id: number; name: string }[];
  activeId: number;
}) {
  const w = weights(await getSettings());

  const sheets = await db
    .select()
    .from(worksheets)
    .orderBy(asc(worksheets.order), asc(worksheets.num));

  const rows = await db
    .select()
    .from(students)
    .where(eq(students.classId, activeId))
    .orderBy(orderByName);
  const ids = rows.map((r) => r.id);

  const marks = ids.length
    ? await db
        .select()
        .from(worksheetMarks)
        .where(
          sql`${worksheetMarks.studentId} in (${sql.join(
            ids.map((i) => sql`${i}`),
            sql`, `
          )})`
        )
    : [];
  const markMap = new Map<string, number>();
  for (const m of marks)
    if (m.score != null) markMap.set(`${m.studentId}_${m.worksheetId}`, m.score);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-muted text-sm">
          ارصد كل ورقة عمل من ٢٠ — يُحفظ تلقائيًا عند الخروج من الخانة. العمود
          الأخير «الدرجة /{w.worksheets}» = (متوسط درجاته ÷ ٢٠) × {w.worksheets}.
        </div>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <ClassTabs
          classes={classes}
          active={activeId}
          base="/record?view=worksheets"
        />
        <StudentSearch />
      </div>

      {sheets.length === 0 ? (
        <div className="card p-4 text-sm text-muted">
          لم تُنشأ أوراق العمل بعد. أضِفها وعدّل عناوينها وروابطها من{" "}
          <Link href="/worksheets" className="text-brand underline">
            صفحة أوراق العمل
          </Link>
          .
        </div>
      ) : (
        <div className="card p-3">
          <div className="frozen-head">
            <table className="text-sm">
              <thead>
                <tr>
                  <th className="sticky right-0 bg-brand">الطالب</th>
                  {sheets.map((s) => (
                    <th key={s.id} className="whitespace-nowrap" title={s.title}>
                      {s.title || `درس ${s.num}`}
                    </th>
                  ))}
                  <th>الدرجة /{w.worksheets}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((st) => {
                  let sum = 0;
                  let cnt = 0;
                  for (const s of sheets) {
                    const v = markMap.get(`${st.id}_${s.id}`);
                    if (v != null) {
                      sum += v;
                      cnt += 1;
                    }
                  }
                  const grade =
                    cnt > 0
                      ? Math.round((sum / cnt / 20) * w.worksheets * 100) / 100
                      : 0;
                  return (
                    <tr key={st.id} data-name={st.name}>
                      <td className="sticky right-0 bg-card whitespace-nowrap">
                        {st.name} <ReadingBadge level={st.readingLevel} />
                      </td>
                      {sheets.map((s) => {
                        const v = markMap.get(`${st.id}_${s.id}`);
                        return (
                          <td key={s.id} className="p-0">
                            <AutoNumber
                              defaultValue={v != null ? String(v) : ""}
                              action={setWorksheetCell.bind(null, st.id, s.id)}
                              className="w-16 text-center border-0 rounded-none bg-transparent"
                            />
                          </td>
                        );
                      })}
                      <td className="text-center font-bold text-brand">
                        {grade}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
