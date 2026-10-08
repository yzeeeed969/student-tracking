"use client";
import { useTransition } from "react";
import { useSelectedIds, fireToast } from "./useSelection";
import { READING_LEVELS } from "./ReadingBadge";

const BAR =
  "card p-3 flex items-center gap-2 flex-wrap sticky top-2 z-30 border-2 border-brand shadow-lg";

export default function StudentsBulk({
  classes,
  bulkMove,
  bulkDelete,
  bulkSetReading,
}: {
  classes: { id: number; name: string }[];
  bulkMove: (fd: FormData) => Promise<void>;
  bulkDelete: (fd: FormData) => Promise<void>;
  bulkSetReading: (fd: FormData) => Promise<void>;
}) {
  const { ids, clear } = useSelectedIds();
  const [pending, start] = useTransition();
  if (!ids.length) return null;

  const run = (
    action: (fd: FormData) => Promise<void>,
    extra: Record<string, string>,
    msg: string
  ) => {
    const fd = new FormData();
    fd.set("ids", ids.join(","));
    for (const k in extra) fd.set(k, extra[k]);
    start(async () => {
      await action(fd);
      fireToast(msg);
      clear();
    });
  };

  return (
    <div className={BAR}>
      <span className="font-bold text-sm">المحدّدون: {ids.length}</span>
      <select id="bulkClass" className="text-sm">
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run(
            bulkMove,
            {
              classId: (
                document.getElementById("bulkClass") as HTMLSelectElement
              ).value,
            },
            "تم نقل المحدّدين"
          )
        }
        className="btn text-xs"
      >
        نقل إلى الفصل
      </button>
      <span className="text-muted text-xs">|</span>
      <select id="bulkReading" className="text-sm">
        {READING_LEVELS.filter((l) => l.v > 0).map((l) => (
          <option key={l.v} value={l.v}>
            {l.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run(
            bulkSetReading,
            {
              readingLevel: (
                document.getElementById("bulkReading") as HTMLSelectElement
              ).value,
            },
            "تم تعيين مستوى القراءة"
          )
        }
        className="btn text-xs"
      >
        تعيين مستوى القراءة
      </button>
      <span className="text-muted text-xs">|</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm(`تأكيد حذف ${ids.length} طالبًا؟`))
            run(bulkDelete, {}, "تم حذف المحدّدين");
        }}
        className="text-red-600 text-xs px-2"
      >
        حذف المحدّدين
      </button>
      <button type="button" onClick={clear} className="text-muted text-xs">
        إلغاء التحديد
      </button>
    </div>
  );
}
