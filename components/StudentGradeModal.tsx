"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getStudentFull,
  addParticipationQuick,
  type StudentFull,
} from "@/app/student-grades/actions";
import { setQuranCell } from "@/app/quran/actions";
import { setHomeworkCell } from "@/app/homework/actions";
import { setWorksheetCell } from "@/app/worksheets/actions";
import { setExamCell } from "@/app/exams/actions";
import { fireToast } from "./useSelection";

const QURAN_OPTS = [
  { v: "", l: "—" },
  { v: "3", l: "ممتاز" },
  { v: "2", l: "جيد جدًا" },
  { v: "1", l: "جيد" },
];
const HW_OPTS = [
  { v: "", l: "—" },
  { v: "1", l: "1" },
  { v: "0.5", l: "0.5" },
];

export default function StudentGradeModal() {
  const router = useRouter();
  const [id, setId] = useState<number | null>(null);
  const [data, setData] = useState<StudentFull | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (sid: number) => {
    setLoading(true);
    try {
      const d = await getStudentFull(sid);
      setData(d);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent).detail as { id: number };
      if (detail?.id) {
        setId(detail.id);
        setData(null);
        load(detail.id);
      }
    }
    window.addEventListener("open-student", onOpen);
    return () => window.removeEventListener("open-student", onOpen);
  }, [load]);

  function close() {
    setId(null);
    setData(null);
    router.refresh();
  }

  // تغليف أي حفظ: نفّذ ثم أعِد تحميل بيانات الطالب (لتحديث المجاميع)
  async function save(fn: () => Promise<unknown>) {
    try {
      await fn();
      fireToast("تم الحفظ ✓");
      if (id) await load(id);
      router.refresh();
    } catch {
      fireToast("تعذّر الحفظ، حاول مجددًا");
    }
  }

  if (id == null) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-3 overflow-auto"
      onClick={close}
    >
      <div
        className="card w-full max-w-lg my-6 p-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
          <div className="font-bold text-lg text-brand">
            {data?.name ?? "تحميل…"}
          </div>
          <button
            type="button"
            onClick={close}
            className="text-muted hover:text-red-500 text-xl leading-none px-2"
          >
            ✕
          </button>
        </div>

        {loading && !data ? (
          <div className="text-center text-muted py-6">جارٍ التحميل…</div>
        ) : data ? (
          <>
            {/* ملخّص الدرجات المحسوبة */}
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <Mini label="القرآن" v={data.computed.quran} />
              <Mini label="الشفهي/التحريري" v={data.computed.oralWritten} />
              <Mini label="الواجبات" v={data.computed.homeworkScore} />
              <Mini label="أوراق العمل" v={data.computed.worksheetsGrade} />
              <Mini label="المشاركة" v={data.computed.participationGrade} />
              <Mini label="المجموع" v={data.computed.total} highlight />
            </div>

            {/* الاختبارات */}
            <Group title="الاختبارات (كل اختبار /10)">
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["o1", "شفهي 1", data.exams.o1],
                  ["o2", "شفهي 2", data.exams.o2],
                  ["w1", "تحريري 1", data.exams.w1],
                  ["w2", "تحريري 2", data.exams.w2],
                ] as const).map(([f, label, val]) => (
                  <label key={f} className="text-sm space-y-1">
                    <span className="text-muted">{label}</span>
                    <NumberCell
                      defaultValue={val}
                      max={10}
                      step={0.25}
                      onSave={(v) =>
                        save(() => setExamCell(data.id, f, v))
                      }
                    />
                  </label>
                ))}
              </div>
            </Group>

            {/* أوراق العمل */}
            {data.worksheets.length > 0 && (
              <Group title="أوراق العمل (كل ورقة /10)">
                <div className="grid grid-cols-2 gap-2">
                  {data.worksheets.map((ws) => (
                    <label key={ws.id} className="text-sm space-y-1">
                      <span className="text-muted">{ws.title}</span>
                      <NumberCell
                        defaultValue={ws.score}
                        max={10}
                        step={1}
                        onSave={(v) =>
                          save(() => setWorksheetCell(data.id, ws.id, v))
                        }
                      />
                    </label>
                  ))}
                </div>
              </Group>
            )}

            {/* الواجبات */}
            <Group title="الواجبات (التقاويم)">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {data.homework.map((h) => (
                  <label key={h.num} className="text-xs space-y-1 text-center">
                    <span className="text-muted">{h.num}</span>
                    <SelectCell
                      defaultValue={h.score != null ? String(h.score) : ""}
                      options={HW_OPTS}
                      onSave={(v) =>
                        save(() => setHomeworkCell(data.id, h.num, v))
                      }
                    />
                  </label>
                ))}
              </div>
            </Group>

            {/* القرآن */}
            <Group title="القرآن (حفظ السور)">
              <div className="grid grid-cols-2 gap-2">
                {data.surahs.map((su) => (
                  <label
                    key={su.num}
                    className="text-sm flex items-center justify-between gap-2"
                  >
                    <span className="text-muted flex-1">{su.name}</span>
                    <SelectCell
                      defaultValue={su.points != null ? String(su.points) : ""}
                      options={QURAN_OPTS}
                      className="w-24"
                      onSave={(v) =>
                        save(() => setQuranCell(data.id, su.num, v))
                      }
                    />
                  </label>
                ))}
              </div>
            </Group>

            {/* المشاركة */}
            <Group title="المشاركة">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm text-muted">
                  مجموع النقاط الحالي: <b className="text-brand">{data.participationRaw}</b>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => save(() => addParticipationQuick(data.id, 1))}
                    className="rounded-md bg-brand text-white text-sm px-3 py-1 hover:opacity-90"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => save(() => addParticipationQuick(data.id, 2))}
                    className="rounded-md bg-brand text-white text-sm px-3 py-1 hover:opacity-90"
                  >
                    +2
                  </button>
                  <button
                    type="button"
                    onClick={() => save(() => addParticipationQuick(data.id, -1))}
                    className="rounded-md bg-red-600/15 text-red-600 text-sm px-3 py-1 hover:bg-red-600/25"
                  >
                    −1
                  </button>
                </div>
              </div>
            </Group>
          </>
        ) : (
          <div className="text-center text-muted py-6">تعذّر تحميل بيانات الطالب.</div>
        )}
      </div>
    </div>
  );
}

function Mini({
  label,
  v,
  highlight,
}: {
  label: string;
  v: number | null;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-2 ${
        highlight ? "bg-brand text-white" : "bg-card/60"
      }`}
    >
      <div className="font-bold">{v ?? "—"}</div>
      <div className={`text-[10px] ${highlight ? "opacity-90" : "text-muted"}`}>
        {label}
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="rounded-lg border border-[var(--border)] overflow-hidden" open>
      <summary className="cursor-pointer select-none px-3 py-2 font-bold text-sm bg-brandsoft/50">
        {title}
      </summary>
      <div className="p-3">{children}</div>
    </details>
  );
}

function NumberCell({
  defaultValue,
  onSave,
  max,
  step = 1,
}: {
  defaultValue: number | null;
  onSave: (v: string) => void;
  max: number;
  step?: number;
}) {
  const [val, setVal] = useState(defaultValue != null ? String(defaultValue) : "");
  const [saved, setSaved] = useState(val);
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={max}
      step={step}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        if (val !== saved) {
          setSaved(val);
          onSave(val);
        }
      }}
      className="w-full text-center"
    />
  );
}

function SelectCell({
  defaultValue,
  options,
  onSave,
  className,
}: {
  defaultValue: string;
  options: { v: string; l: string }[];
  onSave: (v: string) => void;
  className?: string;
}) {
  const [val, setVal] = useState(defaultValue);
  return (
    <select
      value={val}
      onChange={(e) => {
        const v = e.target.value;
        setVal(v);
        onSave(v);
      }}
      className={className ?? "w-full text-center text-sm"}
    >
      {options.map((o) => (
        <option key={o.v} value={o.v}>
          {o.l}
        </option>
      ))}
    </select>
  );
}
