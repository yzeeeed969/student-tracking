import Nav from "@/components/Nav";
import ClassTabs from "@/components/ClassTabs";
import { computeClassGrades, getClasses } from "@/lib/grades";
import { saveGrades } from "./actions";

export const dynamic = "force-dynamic";

export default async function GradesPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const classes = await getClasses();
  const sp = await searchParams;
  const activeId = Number(sp.class) || classes[0]?.id;
  const { rows, w } = await computeClassGrades(activeId);

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold">الدرجات</h1>
          <div className="text-muted text-sm">
            القرآن {w.quran} + الشفهي والتحريري {w.oralWritten} + الواجبات{" "}
            {w.homework} + المشاركة {w.participation} = 100
          </div>
        </div>
        <ClassTabs classes={classes} active={activeId} base="/grades" />

        <form action={saveGrades} className="card p-4 space-y-3">
          <input type="hidden" name="classId" value={activeId} />
          <input
            type="hidden"
            name="ids"
            value={rows.map((r) => r.id).join(",")}
          />
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>الطالب</th>
                  <th>القرآن ({w.quran}) تلقائي</th>
                  <th>الشفهي والتحريري ({w.oralWritten})</th>
                  <th>الواجبات ({w.homework})</th>
                  <th>المشاركة ({w.participation})</th>
                  <th>المجموع (100)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.code}</td>
                    <td>{r.name}</td>
                    <td className="text-center text-muted">
                      {r.quran ?? "—"}
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        max={w.oralWritten}
                        name={`oral_${r.id}`}
                        defaultValue={r.oralWritten ?? ""}
                        className="w-20 text-center"
                      />
                    </td>
                    <td className="text-center text-muted">
                      {r.homeworkScore}
                    </td>
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
          <div className="flex justify-end">
            <button className="btn">حفظ الدرجات</button>
          </div>
        </form>
      </main>
    </div>
  );
}
