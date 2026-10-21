import ClassTabs from "@/components/ClassTabs";
import { db } from "@/db";
import { students, homeworkMarks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import {
  saveHomework,
  saveOneHomework,
  bulkSetHomework,
  setHomeworkCell,
} from "@/app/homework/actions";
import RowSaveButton from "@/components/RowSaveButton";
import AutoSelect from "@/components/AutoSelect";
import StudentSearch from "@/components/StudentSearch";
import SelectAllCheckbox from "@/components/SelectAllCheckbox";
import HomeworkBulk from "@/components/HomeworkBulk";
import StudentName from "@/components/StudentName";
import { orderByName } from "@/lib/order";

export default async function HomeworkSection({
  classes,
  activeId,
}: {
  classes: { id: number; name: string }[];
  activeId: number;
}) {
  const s = await getSettings();
  const count = Number(s.homework_count ?? 18);

  const rows = await db
    .select()
    .from(students)
    .where(eq(students.classId, activeId))
    .orderBy(orderByName);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-muted text-sm">
          كل خانة واجب: اختر 1 أو 0.5، والفراغ = لم يُرصد. يُجمع تلقائيًا. احفظ
          الواجبات قبل إرسال الواتساب ليُحتسب آخر رصد.
        </div>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <ClassTabs
          classes={classes}
          active={activeId}
          base="/record?view=homework"
        />
        <StudentSearch />
      </div>

      <HomeworkBulk count={count} bulkSetHomework={bulkSetHomework} />

      <form className="card p-3 space-y-3">
        <input type="hidden" name="count" value={count} />
        <input type="hidden" name="ids" value={ids.join(",")} />
        <div className="frozen-head">
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
                        <StudentName
                          id={st.id}
                          name={st.name}
                          readingLevel={st.readingLevel}
                        />
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
                          <AutoSelect
                            name={`hw_${st.id}_${n}`}
                            defaultValue={v != null ? String(v) : ""}
                            options={[
                              { v: "", l: "—" },
                              { v: "1", l: "1" },
                              { v: "0.5", l: "0.5" },
                            ]}
                            action={setHomeworkCell.bind(null, st.id, n)}
                            className="w-14 text-center border-0 rounded-none bg-transparent"
                          />
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
    </div>
  );
}
