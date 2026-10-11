import ClassTabs from "@/components/ClassTabs";
import { db } from "@/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { saveExams, saveOneExam } from "@/app/exams/actions";
import RowSaveButton from "@/components/RowSaveButton";
import StudentSearch from "@/components/StudentSearch";
import ReadingBadge from "@/components/ReadingBadge";
import { orderByName } from "@/lib/order";

export default async function ExamsSection({
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-muted text-sm">
          عمودان للاختبارات الشفهية وعمودان للاختبارات التحريرية، كل اختبار من 10.
          مجموع الأربعة (من 40) يظهر تلقائيًا في عمود «الشفهي والتحريري» في الدرجات.
        </div>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <ClassTabs classes={classes} active={activeId} base="/record?view=exams" />
        <StudentSearch />
      </div>

      <form className="card p-3 space-y-3">
        <input type="hidden" name="ids" value={ids.join(",")} />
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr>
                <th className="sticky right-0 bg-brand">الطالب</th>
                <th>شفهي 1 (10)</th>
                <th>شفهي 2 (10)</th>
                <th>تحريري 1 (10)</th>
                <th>تحريري 2 (10)</th>
                <th>المجموع (40)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((st) => {
                const parts = [st.oral1, st.oral2, st.written1, st.written2];
                const any = parts.some((v) => v != null);
                const sum = any
                  ? Math.round(
                      parts.reduce<number>((a, v) => a + (v ?? 0), 0) * 100
                    ) / 100
                  : null;
                return (
                  <tr key={st.id} data-name={st.name}>
                    <td className="sticky right-0 bg-card whitespace-nowrap">
                      <div>
                        {st.name} <ReadingBadge level={st.readingLevel} />
                      </div>
                      <div className="mt-1">
                        <RowSaveButton
                          action={saveOneExam.bind(null, st.id)}
                          toast="تم حفظ اختبارات الطالب"
                          className="text-xs bg-brand text-white rounded px-2 py-0.5 hover:opacity-90"
                        >
                          حفظ
                        </RowSaveButton>
                      </div>
                    </td>
                    <ExamCell name={`o1_${st.id}`} value={st.oral1} />
                    <ExamCell name={`o2_${st.id}`} value={st.oral2} />
                    <ExamCell name={`w1_${st.id}`} value={st.written1} />
                    <ExamCell name={`w2_${st.id}`} value={st.written2} />
                    <td className="text-center font-bold text-brand">
                      {sum ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <RowSaveButton action={saveExams} toast="تم حفظ الاختبارات" className="btn">
            حفظ الاختبارات
          </RowSaveButton>
        </div>
      </form>
    </div>
  );
}

function ExamCell({ name, value }: { name: string; value: number | null }) {
  return (
    <td className="p-0">
      <input
        type="number"
        step="0.25"
        min="0"
        max="10"
        name={name}
        defaultValue={value ?? ""}
        className="w-16 text-center border-0 rounded-none bg-transparent"
      />
    </td>
  );
}
