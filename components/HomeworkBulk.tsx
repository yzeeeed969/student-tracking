"use client";
import { useTransition } from "react";
import { useSelectedIds, fireToast } from "./useSelection";

const BAR =
  "card p-3 flex items-center gap-2 flex-wrap sticky top-2 z-30 border-2 border-brand shadow-lg";

export default function HomeworkBulk({
  count,
  bulkSetHomework,
}: {
  count: number;
  bulkSetHomework: (fd: FormData) => Promise<void>;
}) {
  const { ids, clear } = useSelectedIds();
  const [pending, start] = useTransition();
  if (!ids.length) return null;

  const nums = Array.from({ length: count }, (_, i) => i + 1);

  const run = () => {
    const num = (document.getElementById("bulkNum") as HTMLSelectElement).value;
    const score = (document.getElementById("bulkScore") as HTMLSelectElement).value;
    const fd = new FormData();
    fd.set("ids", ids.join(","));
    fd.set("num", num);
    fd.set("score", score);
    start(async () => {
      await bulkSetHomework(fd);
      fireToast("تم تطبيق الدرجة على المحدّدين");
      clear();
    });
  };

  return (
    <div className={BAR}>
      <span className="font-bold text-sm">المحدّدون: {ids.length}</span>
      <span className="text-xs text-muted">واجب رقم</span>
      <select id="bulkNum" className="text-sm">
        {nums.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <select id="bulkScore" className="text-sm">
        <option value="1">1</option>
        <option value="0.5">0.5</option>
        <option value="">— (مسح)</option>
      </select>
      <button type="button" disabled={pending} onClick={run} className="btn text-xs">
        تطبيق على المحدّدين
      </button>
      <button type="button" onClick={clear} className="text-muted text-xs">
        إلغاء التحديد
      </button>
    </div>
  );
}
