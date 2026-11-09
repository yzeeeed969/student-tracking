"use client";
import { useRef, useState } from "react";

// مشغّل صوتي كامل لتسميع الطالب (للمعلم) + زر تسريع ×1.5
export default function AudioPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [fast, setFast] = useState(false);

  function applyRate(f: boolean) {
    if (ref.current) ref.current.playbackRate = f ? 1.5 : 1;
  }

  function toggleSpeed() {
    const next = !fast;
    setFast(next);
    applyRate(next);
  }

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={ref}
        src={src}
        controls
        preload="none"
        onPlay={() => applyRate(fast)}
        className="flex-1 min-w-0 h-10"
      />
      <button
        type="button"
        onClick={toggleSpeed}
        title="تسريع الصوت ×1.5"
        className={
          "flex-none rounded-lg px-2.5 py-1.5 text-sm font-bold whitespace-nowrap border transition " +
          (fast
            ? "bg-brand text-white border-brand"
            : "bg-brand/10 text-brand border-transparent hover:bg-brand/20")
        }
      >
        ×١٫٥
      </button>
    </div>
  );
}
