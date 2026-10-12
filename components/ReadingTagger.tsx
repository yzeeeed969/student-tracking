"use client";
import { useState, useTransition } from "react";
import { fireToast } from "./useSelection";
import { setReading } from "@/app/students/actions";

type Stu = { id: number; name: string; classId: number; readingLevel: number };

// حالتان: 1 لا يقرأ، 3 يقرأ، 0 غير محدد. (2 القديمة تُحسب «يقرأ»)
function canRead(level: number) {
  return level === 3 || level === 2;
}

export default function ReadingTagger({
  classes,
  students,
}: {
  classes: { id: number; name: string }[];
  students: Stu[];
}) {
  const [levels, setLevels] = useState<Map<number, number>>(
    new Map(students.map((s) => [s.id, s.readingLevel]))
  );
  const [, start] = useTransition();

  function set(id: number, target: number) {
    const current = levels.get(id) ?? 0;
    // النقر على الحالة نفسها يلغيها (يرجع إلى «غير محدد»)
    const next = normalize(current) === target ? 0 : target;
    const prev = new Map(levels);
    const optimistic = new Map(levels);
    optimistic.set(id, next);
    setLevels(optimistic);
    start(async () => {
      try {
        await setReading(id, next);
      } catch {
        setLevels(prev);
        fireToast("تعذّر الحفظ، حاول مجددًا");
      }
    });
  }

  // يحوّل القيمة القديمة 2 إلى 3 عند المقارنة
  function normalize(level: number) {
    return level === 2 ? 3 : level;
  }

  return (
    <div className="space-y-5">
      <div className="card p-3 text-sm text-muted">
        اضغط <b className="text-green-600">يقرأ</b> أو{" "}
        <b className="text-red-600">لا يقرأ</b> أمام كل طالب — يُحفظ فورًا. اضغط
        على نفس الزر مرة أخرى لإلغائه. هذه الشاشة خاصة بك (لا تظهر للطلاب ولا
        لأولياء الأمور).
      </div>

      {classes.map((c) => {
        const rows = students.filter((s) => s.classId === c.id);
        const read = rows.filter((s) => canRead(levels.get(s.id) ?? 0)).length;
        const no = rows.filter((s) => (levels.get(s.id) ?? 0) === 1).length;
        const unset = rows.length - read - no;
        return (
          <div key={c.id} className="card p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-bold">{c.name}</h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-green-600">🟢 يقرأ: {read}</span>
                <span className="text-red-600">🔴 لا يقرأ: {no}</span>
                <span className="text-muted">⚪ غير محدد: {unset}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              {rows.map((s) => {
                const lvl = normalize(levels.get(s.id) ?? 0);
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-card/60 px-3 py-2"
                  >
                    <span className="flex-1 text-sm font-medium">{s.name}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => set(s.id, 3)}
                        className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                          lvl === 3
                            ? "bg-green-600 text-white"
                            : "bg-green-600/10 text-green-700 dark:text-green-400 hover:bg-green-600/20"
                        }`}
                      >
                        يقرأ
                      </button>
                      <button
                        type="button"
                        onClick={() => set(s.id, 1)}
                        className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                          lvl === 1
                            ? "bg-red-600 text-white"
                            : "bg-red-600/10 text-red-700 dark:text-red-400 hover:bg-red-600/20"
                        }`}
                      >
                        لا يقرأ
                      </button>
                    </div>
                  </div>
                );
              })}
              {rows.length === 0 && (
                <div className="text-center text-muted text-sm py-2">
                  لا يوجد طلاب في هذا الفصل
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
