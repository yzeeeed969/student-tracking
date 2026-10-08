"use client";
import { useTransition } from "react";
import { useSelectedIds, fireToast } from "./useSelection";

const BAR =
  "card p-3 flex items-center gap-2 flex-wrap sticky top-2 z-30 border-2 border-brand shadow-lg";

export default function QuranBulk({
  surahs,
  levels,
  bulkSetSurah,
}: {
  surahs: { num: number; name: string }[];
  levels: { label: string; points: number }[];
  bulkSetSurah: (fd: FormData) => Promise<void>;
}) {
  const { ids, clear } = useSelectedIds();
  const [pending, start] = useTransition();
  if (!ids.length) return null;

  const run = () => {
    const surah = (document.getElementById("bulkSurah") as HTMLSelectElement).value;
    const points = (document.getElementById("bulkLevel") as HTMLSelectElement).value;
    const fd = new FormData();
    fd.set("ids", ids.join(","));
    fd.set("surah", surah);
    fd.set("points", points);
    start(async () => {
      await bulkSetSurah(fd);
      fireToast("تم تطبيق الدرجة على المحدّدين");
      clear();
    });
  };

  return (
    <div className={BAR}>
      <span className="font-bold text-sm">المحدّدون: {ids.length}</span>
      <select id="bulkSurah" className="text-sm">
        {surahs.map((s) => (
          <option key={s.num} value={s.num}>
            {s.name}
          </option>
        ))}
      </select>
      <select id="bulkLevel" className="text-sm">
        {levels.map((l) => (
          <option key={l.points} value={l.points}>
            {l.label}
          </option>
        ))}
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
