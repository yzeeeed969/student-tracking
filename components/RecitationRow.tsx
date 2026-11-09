"use client";
import { useState } from "react";
import { setQuranCell } from "@/app/quran/actions";
import { LEVELS } from "@/lib/surahs";
import AudioPlayer from "@/components/AudioPlayer";
import { fireToast } from "./useSelection";

// صفّ تسميع واحد في صندوق المعلم: استماع + رصد مباشر (ينعكس في درجة القرآن ويحذف التسجيل)
export default function RecitationRow({
  studentId,
  surah,
  surahName,
  studentName,
  className,
}: {
  studentId: number;
  surah: number;
  surahName: string;
  studentName: string;
  className: string;
}) {
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function grade(points: number, label: string) {
    if (pending) return;
    setPending(true);
    try {
      await setQuranCell(studentId, surah, String(points));
      setDone(label);
      fireToast(`تم رصد «${label}» ✓`);
    } catch {
      fireToast("تعذّر الرصد، حاول مجددًا");
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="card p-3 flex items-center justify-between text-sm opacity-70">
        <span>
          {studentName} — سورة {surahName}
        </span>
        <span className="text-green-600 font-bold">✓ رُصد: {done}</span>
      </div>
    );
  }

  return (
    <div className="card p-3 space-y-3">
      <div>
        <div className="font-bold">{studentName}</div>
        <div className="text-muted text-xs">
          {className} • سورة {surahName}
        </div>
      </div>
      <AudioPlayer
        src={`/api/recite-audio?studentId=${studentId}&surah=${surah}`}
      />
      <div className="flex items-center gap-2">
        <span className="text-muted text-xs whitespace-nowrap">الدرجة:</span>
        {LEVELS.map((l) => (
          <button
            key={l.points}
            type="button"
            disabled={pending}
            onClick={() => grade(l.points, l.label)}
            className="flex-1 rounded-lg bg-brand/10 text-brand font-bold py-2 text-sm hover:bg-brand hover:text-white disabled:opacity-50 transition"
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
