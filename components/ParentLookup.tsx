"use client";

import { useActionState } from "react";
import { lookupParent, type LookupState } from "@/app/showcase/actions";

const initial: LookupState = { ok: false };

export default function ParentLookup() {
  const [state, formAction, pending] = useActionState(lookupParent, initial);

  return (
    <div className="card p-5 space-y-4 border-2 border-brand/30">
      <div>
        <h2 className="font-bold text-lg text-brand">استعلام ولي الأمر</h2>
        <p className="text-muted text-sm mt-1">
          أدخل رقم جوالك المسجّل لدى المعلم لعرض درجات ابنك وملاحظاته.
        </p>
      </div>

      <form action={formAction} className="flex gap-2 items-center flex-wrap">
        <input
          name="phone"
          type="tel"
          inputMode="numeric"
          dir="ltr"
          placeholder="05XXXXXXXX"
          required
          className="flex-1 min-w-48 text-center"
        />
        <button className="btn" disabled={pending}>
          {pending ? "جارٍ البحث…" : "عرض بيانات ابني"}
        </button>
      </form>

      {state.message && !state.ok && (
        <div className="text-red-500 text-sm">{state.message}</div>
      )}

      {state.ok && state.reports && (
        <div className="space-y-4">
          {state.reports.map((r, i) => (
            <div key={i} className="rounded-xl bg-brandsoft/40 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="font-bold text-lg">{r.name}</div>
                <div className="text-muted text-sm">{r.className}</div>
              </div>

              {/* الدرجات */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-sm">
                <Cell label={`القرآن (${r.w.quran})`} value={r.quran ?? "—"} />
                <Cell
                  label={`الشفهي والتحريري (${r.w.oralWritten})`}
                  value={r.oralWritten ?? "—"}
                />
                <Cell
                  label={`الواجبات (${r.w.homework})`}
                  value={r.homeworkScore}
                />
                <Cell
                  label={`المشاركة (${r.w.participation})`}
                  value={r.participationGrade}
                />
                <div className="rounded-lg bg-brand text-white p-2">
                  <div className="text-xl font-bold">{r.total ?? "—"}</div>
                  <div className="text-xs opacity-90">المجموع /100</div>
                </div>
              </div>

              {/* الواجبات */}
              <div className="text-sm">
                <span className="font-bold">الواجبات المرصودة: </span>
                {r.homeworkDone} من {r.homeworkCount}
                {r.missing.length > 0 && (
                  <span className="text-red-500">
                    {"  —  غير المرصودة: "}
                    {r.missing.join("، ")}
                  </span>
                )}
              </div>

              {/* الملاحظات */}
              <div className="space-y-1">
                <div className="font-bold text-sm">الملاحظات السلوكية</div>
                {r.notes.length === 0 ? (
                  <div className="text-muted text-sm">لا توجد ملاحظات.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="text-sm w-full">
                      <tbody>
                        {r.notes.map((n) => (
                          <tr key={n.id}>
                            <td className="whitespace-nowrap text-muted">
                              {n.date}
                            </td>
                            <td className="font-medium">{n.type}</td>
                            <td className="text-muted">{n.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Cell({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-card p-2">
      <div className="text-lg font-bold text-brand">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
