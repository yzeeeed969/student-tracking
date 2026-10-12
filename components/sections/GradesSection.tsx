import ClassTabs from "@/components/ClassTabs";
import { computeClassGrades } from "@/lib/grades";
import StudentSearch from "@/components/StudentSearch";

export default async function GradesSection({
  classes,
  activeId,
}: {
  classes: { id: number; name: string }[];
  activeId: number;
}) {
  const { rows, w } = await computeClassGrades(activeId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-muted text-sm">
          القرآن {w.quran} + الشفهي والتحريري {w.oralWritten} + الواجبات{" "}
          {w.homework} + المشاركة {w.participation} = 100. تُحسب كل درجة تلقائيًا من
          تبويبها (الاختبارات، الواجبات، القرآن، المشاركة).
        </div>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <ClassTabs classes={classes} active={activeId} base="/record?view=grades" />
        <StudentSearch />
      </div>

      <div className="card p-2">
       <div className="frozen-head">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>الطالب</th>
              <th>القرآن ({w.quran})</th>
              <th>الشفهي والتحريري ({w.oralWritten})</th>
              <th>الواجبات ({w.homework})</th>
              <th>المشاركة ({w.participation})</th>
              <th>المجموع (100)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} data-name={r.name}>
                <td>{r.code}</td>
                <td>{r.name}</td>
                <td className="text-center text-muted">{r.quran ?? "—"}</td>
                <td className="text-center text-muted">
                  {r.oralWritten ?? "—"}
                </td>
                <td className="text-center text-muted">{r.homeworkScore}</td>
                <td className="text-center text-muted">
                  {r.participationGrade}
                </td>
                <td className="text-center font-bold text-brand">
                  {r.total ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
       </div>
      </div>
    </div>
  );
}
