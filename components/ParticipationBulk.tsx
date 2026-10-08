"use client";
import { useTransition } from "react";
import { useSelectedIds, fireToast } from "./useSelection";

const BAR =
  "card p-3 flex items-center gap-2 flex-wrap sticky top-2 z-30 border-2 border-brand shadow-lg";

export default function ParticipationBulk({
  date,
  bulkParticipation,
}: {
  date: string;
  bulkParticipation: (fd: FormData) => Promise<void>;
}) {
  const { ids, clear } = useSelectedIds();
  const [pending, start] = useTransition();
  if (!ids.length) return null;

  const run = (points: number, msg: string) => {
    const fd = new FormData();
    fd.set("ids", ids.join(","));
    fd.set("date", date);
    fd.set("points", String(points));
    start(async () => {
      await bulkParticipation(fd);
      fireToast(msg);
      clear();
    });
  };

  return (
    <div className={BAR}>
      <span className="font-bold text-sm">المحدّدون: {ids.length}</span>
      <button type="button" disabled={pending} onClick={() => run(1, "تم +1 للمحدّدين")} className="btn text-xs">
        +1
      </button>
      <button type="button" disabled={pending} onClick={() => run(2, "تم +2 للمحدّدين")} className="btn text-xs">
        +2
      </button>
      <button type="button" disabled={pending} onClick={() => run(-1, "تم خصم 1 من المحدّدين")} className="btn text-xs text-red-600">
        −1
      </button>
      <button type="button" onClick={clear} className="text-muted text-xs">
        إلغاء التحديد
      </button>
    </div>
  );
}
