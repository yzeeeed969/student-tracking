"use client";
import { useRef, useState } from "react";

// زر استماع لتسجيل تسميع الطالب (للمعلم)
export default function RecitePlay({
  studentId,
  surah,
}: {
  studentId: number;
  surah: number;
}) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function toggle() {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    const a = new Audio(`/api/recite-audio?studentId=${studentId}&surah=${surah}`);
    audioRef.current = a;
    a.onended = () => setPlaying(false);
    a.onerror = () => setPlaying(false);
    a.play().then(
      () => setPlaying(true),
      () => setPlaying(false)
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title="استماع لتسميع الطالب"
      className="block w-full text-center text-amber-600 text-base leading-none"
    >
      {playing ? "⏸" : "🎧"}
    </button>
  );
}
