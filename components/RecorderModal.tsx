"use client";
import { useRef, useState, useEffect } from "react";

function pickMime(): string {
  const cands = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const c of cands) {
    try {
      if (
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported(c)
      )
        return c;
    } catch {
      /* ignore */
    }
  }
  return "";
}

// نافذة تسجيل تسميع سورة لطالب — مقياس صوت حيّ + إرسال للمعلم
export default function RecorderModal({
  studentId,
  surah,
  onClose,
  onDone,
}: {
  studentId: number;
  surah: { num: number; name: string };
  onClose: () => void;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<
    "idle" | "recording" | "preview" | "uploading"
  >("idle");
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const startRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const LOW = 0.045;

  function cleanupMeter() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (ctxRef.current) {
      try {
        ctxRef.current.close();
      } catch {
        /* ignore */
      }
      ctxRef.current = null;
    }
  }
  function stopTracks() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }
  useEffect(() => {
    return () => {
      cleanupMeter();
      stopTracks();
      if (timerRef.current) clearInterval(timerRef.current);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setError("");
    setPeak(0);
    setElapsed(0);
    chunksRef.current = [];
    blobRef.current = null;
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("لم نتمكّن من الوصول للميكروفون. اسمح بالإذن ثم حاول مجددًا.");
      return;
    }
    streamRef.current = stream;

    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setLevel(rms);
        setPeak((p) => Math.max(p, rms));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* المقياس اختياري */
    }

    const mime = pickMime();
    const rec = mime
      ? new MediaRecorder(stream, { mimeType: mime })
      : new MediaRecorder(stream);
    mediaRef.current = rec;
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const type = rec.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      blobRef.current = blob;
      setBlobUrl(URL.createObjectURL(blob));
      setPhase("preview");
      cleanupMeter();
      stopTracks();
      setLevel(0);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    rec.start();
    startRef.current = Date.now();
    timerRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      250
    );
    setPhase("recording");
  }

  function stop() {
    try {
      mediaRef.current?.stop();
    } catch {
      /* ignore */
    }
  }

  async function submit() {
    if (!blobRef.current) return;
    setPhase("uploading");
    setError("");
    try {
      const fd = new FormData();
      fd.append("studentId", String(studentId));
      fd.append("surah", String(surah.num));
      fd.append("durationMs", String(elapsed * 1000));
      const ext = (blobRef.current.type.includes("mp4") && "m4a") || "webm";
      fd.append("audio", blobRef.current, `recite.${ext}`);
      const res = await fetch("/api/recite-submit", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error === "too big"
            ? "التسجيل طويل جدًا. سجّل السورة وحدها."
            : "تعذّر الإرسال، حاول مجددًا."
        );
        setPhase("preview");
        return;
      }
      onDone();
    } catch {
      setError("تعذّر الاتصال، تأكّد من الإنترنت وحاول مجددًا.");
      setPhase("preview");
    }
  }

  const pct = Math.min(100, Math.round(level * 320));
  const peakOk = peak >= LOW;
  const nowLow = phase === "recording" && level < LOW;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-3">
      <div className="card p-5 w-full max-w-md space-y-4" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="font-bold text-lg">تسميع سورة {surah.name}</div>
          <button onClick={onClose} className="text-muted hover:text-brand">
            ✕
          </button>
        </div>

        <div className="space-y-1">
          <div className="h-5 rounded-full bg-muted/15 overflow-hidden">
            <div
              className={
                "h-full transition-all duration-75 " +
                (nowLow ? "bg-amber-400" : "bg-green-500")
              }
              style={{ width: `${pct}%` }}
            />
          </div>
          {phase === "recording" && (
            <div
              className={
                "text-sm text-center font-bold " +
                (nowLow ? "text-amber-600" : "text-green-600")
              }
            >
              {nowLow ? "ارفع صوتك قليلًا 🔊" : "صوتك واضح ✓"}
            </div>
          )}
        </div>

        {phase === "recording" && (
          <div className="text-center text-2xl font-bold tabular-nums">
            {Math.floor(elapsed / 60)}:
            {String(elapsed % 60).padStart(2, "0")}
          </div>
        )}

        {blobUrl && phase !== "recording" && (
          <audio src={blobUrl} controls className="w-full" />
        )}

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        {phase === "idle" && (
          <button onClick={start} className="btn w-full text-lg py-3">
            🎙 ابدأ التسجيل
          </button>
        )}
        {phase === "recording" && (
          <button
            onClick={stop}
            className="w-full text-lg py-3 rounded-xl bg-red-500 text-white font-bold hover:opacity-90"
          >
            ⏹ إيقاف
          </button>
        )}
        {phase === "preview" && (
          <div className="space-y-2">
            {!peakOk && (
              <div className="text-amber-600 text-sm text-center">
                كان صوتك منخفضًا. يُفضّل إعادة التسجيل بصوت أوضح.
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={start}
                className="flex-1 py-2.5 rounded-xl bg-muted/15 font-bold hover:bg-muted/25"
              >
                إعادة التسجيل
              </button>
              <button onClick={submit} className="flex-1 btn py-2.5">
                إرسال للمعلم
              </button>
            </div>
          </div>
        )}
        {phase === "uploading" && (
          <button disabled className="btn w-full opacity-60 py-3">
            جارٍ الإرسال…
          </button>
        )}
      </div>
    </div>
  );
}
