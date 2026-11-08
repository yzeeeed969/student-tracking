"use client";
import { useActionState, useRef, useState, useEffect } from "react";
import {
  reciteLookup,
  type ReciteLookupState,
  type ReciteChild,
} from "@/app/recite/actions";
import { LEVELS } from "@/lib/surahs";

function levelLabel(points: number | null): string | null {
  if (points == null) return null;
  const l = LEVELS.find((x) => x.points === points);
  return l ? l.label : String(points);
}

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

export default function ReciteClient() {
  const [state, action, pending] = useActionState<ReciteLookupState | null, FormData>(
    reciteLookup,
    null
  );

  const children: ReciteChild[] =
    state && state.ok ? state.children : [];
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    if (children.length === 1) setActiveId(children[0].id);
  }, [children]);

  // ===== مرحلة إدخال الرقم =====
  if (!state || !state.ok) {
    return (
      <div className="max-w-md mx-auto p-4" dir="rtl">
        <Header />
        <form action={action} className="card p-4 space-y-3">
          <div className="font-bold">ادخل برقم جوال ولي الأمر</div>
          <input
            name="phone"
            inputMode="numeric"
            placeholder="05XXXXXXXX"
            className="form-input w-full text-center"
            dir="ltr"
          />
          <button type="submit" disabled={pending} className="btn w-full">
            {pending ? "جارٍ الدخول…" : "دخول"}
          </button>
          {state && !state.ok && (
            <div className="text-red-600 text-sm text-center">
              {state.message}
            </div>
          )}
        </form>
      </div>
    );
  }

  const child = children.find((c) => c.id === activeId) || null;

  // ===== اختيار الطالب (عند تعدّد الأبناء) =====
  if (!child) {
    return (
      <div className="max-w-md mx-auto p-4" dir="rtl">
        <Header />
        <div className="card p-4 space-y-3">
          <div className="font-bold">اختر الطالب</div>
          <div className="grid grid-cols-1 gap-2">
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className="text-right px-3 py-2 rounded bg-muted/10 hover:bg-brand/10"
              >
                {c.name} <span className="text-muted text-sm">— {c.className}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <RecitePanel
      child={child}
      multiChild={children.length > 1}
      onBack={() => setActiveId(null)}
    />
  );
}

function RecitePanel({
  child,
  multiChild,
  onBack,
}: {
  child: ReciteChild;
  multiChild: boolean;
  onBack: () => void;
}) {
  // الحالة المحلية لكل سورة بعد الإرسال (recorded)
  const [recordedLocal, setRecordedLocal] = useState<Record<number, boolean>>(
    {}
  );
  const [openSurah, setOpenSurah] = useState<{ num: number; name: string } | null>(
    null
  );

  return (
    <div className="max-w-md mx-auto p-4 space-y-4" dir="rtl">
      <Header />
      <div className="card p-3 flex items-center justify-between text-sm">
        <span>
          الطالب: <b>{child.name}</b> — {child.className}
        </span>
        {multiChild && (
          <button onClick={onBack} className="text-brand underline">
            تغيير
          </button>
        )}
      </div>

      <div className="text-muted text-sm px-1">
        اختر السورة المطلوبة واضغط «تسجيل التسميع». تأكّد أن صوتك واضح ومسموع.
      </div>

      <div className="grid grid-cols-1 gap-2">
        {child.surahs.map((s) => {
          const graded = s.graded != null;
          const recorded = s.recorded || recordedLocal[s.num];
          return (
            <div
              key={s.num}
              className="card p-3 flex items-center justify-between gap-2"
            >
              <div className="font-bold">
                سورة {s.name}
                {graded && (
                  <span className="text-green-600 text-sm font-normal mr-2">
                    ✓ رُصدت ({levelLabel(s.graded)})
                  </span>
                )}
                {!graded && recorded && (
                  <span className="text-amber-600 text-sm font-normal mr-2">
                    ⏺ بانتظار المعلم
                  </span>
                )}
              </div>
              {!graded && (
                <button
                  onClick={() => setOpenSurah({ num: s.num, name: s.name })}
                  className="text-sm bg-brand text-white rounded-lg px-3 py-1.5 whitespace-nowrap hover:opacity-90"
                >
                  🎙 {recorded ? "إعادة التسجيل" : "تسجيل التسميع"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {openSurah && (
        <Recorder
          studentId={child.id}
          surah={openSurah}
          onClose={() => setOpenSurah(null)}
          onDone={() => {
            setRecordedLocal((m) => ({ ...m, [openSurah.num]: true }));
            setOpenSurah(null);
          }}
        />
      )}
    </div>
  );
}

function Recorder({
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
  const [level, setLevel] = useState(0); // 0..1
  const [peak, setPeak] = useState(0); // أعلى مستوى وصل إليه
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

  const LOW = 0.045; // أقل من هذا = صوت منخفض

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

    // مقياس الصوت الحيّ
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
    const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
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
      const res = await fetch("/api/recite-submit", { method: "POST", body: fd });
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

        {/* مقياس الصوت */}
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
            {String(Math.floor(elapsed / 60)).padStart(1, "0")}:
            {String(elapsed % 60).padStart(2, "0")}
          </div>
        )}

        {blobUrl && phase !== "recording" && (
          <audio src={blobUrl} controls className="w-full" />
        )}

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        {/* الأزرار */}
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

function Header() {
  return (
    <div className="text-center pt-2 pb-3">
      <div className="text-3xl mb-1">📖</div>
      <div className="text-lg font-bold">تسميع القرآن الكريم</div>
    </div>
  );
}
