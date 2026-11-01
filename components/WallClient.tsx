"use client";
import { useEffect, useRef, useState, useCallback } from "react";

type Post = {
  id: number;
  name: string;
  text: string;
  cell: number | null;
  hasImage: boolean;
  createdAt: string;
};

const TEXT_MAX = 500;
const NAME_MAX = 40;
const COOLDOWN = 30; // ثوانٍ بين مشاركة وأخرى من نفس الجهاز
const MAX_BYTES = 1_400_000; // ~1.4 ميجابايت كحد أقصى للصورة بعد الضغط

// إنشاء/جلب رمز الجهاز (للحدّ من التكرار السريع)
function deviceToken(): string {
  try {
    let t = localStorage.getItem("wall_device");
    if (!t) {
      t = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("wall_device", t);
    }
    return t;
  } catch {
    return "anon";
  }
}

// ضغط الصورة داخل المتصفح قبل الرفع (تصغير الأبعاد + JPEG)
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("img"));
      img.onload = () => {
        const maxDim = 1600;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("ctx"));
        ctx.drawImage(img, 0, 0, width, height);
        let q = 0.82;
        let out = canvas.toDataURL("image/jpeg", q);
        while (out.length * 0.75 > MAX_BYTES && q > 0.4) {
          q -= 0.1;
          out = canvas.toDataURL("image/jpeg", q);
        }
        resolve(out);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString("ar-SA-u-nu-latn", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

export default function WallClient({
  slug,
  title,
  goal,
  open,
  moderated,
  cells,
}: {
  slug: string;
  title: string;
  goal: string;
  open: boolean;
  moderated: boolean;
  cells: number;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [capacity, setCapacity] = useState(cells);
  const [composerCell, setComposerCell] = useState<number | null>(null); // المربّع الجاري ملؤه
  const [viewer, setViewer] = useState<Post | null>(null); // عرض مشاركة بالتفصيل

  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"none" | "image" | "draw">("none");
  const [preview, setPreview] = useState<string | null>(null); // dataURL لصورة مرفوعة
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );
  const [cooldown, setCooldown] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // استعادة اسم الطالب + حالة التهدئة
  useEffect(() => {
    try {
      const n = localStorage.getItem("wall_name");
      if (n) setName(n);
      const until = Number(localStorage.getItem("wall_cool_" + slug) || 0);
      const left = Math.ceil((until - Date.now()) / 1000);
      if (left > 0) setCooldown(left);
    } catch {}
  }, [slug]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // جلب المشاركات — مع حمايات تمنع إرهاق الخادم:
  // 1) لا طلب جديد قبل اكتمال السابق  2) توقّف عندما تكون الصفحة غير ظاهرة
  const inFlight = useRef(false);
  const loadFeed = useCallback(async () => {
    if (inFlight.current) return;
    if (typeof document !== "undefined" && document.hidden) return;
    inFlight.current = true;
    try {
      const r = await fetch(`/api/wall/${slug}/feed`, { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      setPosts(data.posts || []);
      if (typeof data.cells === "number") setCapacity(data.cells);
    } catch {
    } finally {
      inFlight.current = false;
    }
  }, [slug]);

  useEffect(() => {
    loadFeed();
    const t = setInterval(loadFeed, 15000);
    const onVis = () => {
      if (!document.hidden) loadFeed();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [loadFeed]);

  // خريطة: رقم المربّع ← المشاركة
  const byCell = new Map<number, Post>();
  for (const p of posts) if (p.cell != null) byCell.set(p.cell, p);

  // ——— لوحة الرسم ———
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const drew = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const initCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    drew.current = false;
  }, []);

  useEffect(() => {
    if (mode === "draw") initCanvas();
  }, [mode, initCanvas]);

  function canvasPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (c.width / r.width),
      y: (e.clientY - r.top) * (c.height / r.height),
    };
  }
  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    drawing.current = true;
    last.current = canvasPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && last.current) {
      ctx.beginPath();
      ctx.arc(last.current.x, last.current.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#1f2937";
      ctx.fill();
      drew.current = true;
    }
  }
  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    const p = canvasPos(e);
    if (ctx && last.current) {
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      drew.current = true;
    }
    last.current = p;
  }
  function onUp() {
    drawing.current = false;
    last.current = null;
  }

  // ——— فتح/إغلاق نافذة الكتابة ———
  function openComposer(cell: number) {
    setComposerCell(cell);
    setText("");
    setMode("none");
    setPreview(null);
    setMsg(null);
    if (fileRef.current) fileRef.current.value = "";
  }
  function closeComposer() {
    setComposerCell(null);
    setMode("none");
    setPreview(null);
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setMsg({ kind: "err", text: "الملف المختار ليس صورة." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const dataUrl = await compressImage(f);
      setPreview(dataUrl);
      setMode("image");
    } catch {
      setMsg({ kind: "err", text: "تعذّر تجهيز الصورة، جرّب صورة أخرى." });
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (composerCell == null) return;
    const nm = name.trim();
    const tx = text.trim();

    // تحديد الصورة/الرسم إن وُجد
    let image: string | null = null;
    if (mode === "draw" && drew.current && canvasRef.current) {
      image = canvasRef.current.toDataURL("image/jpeg", 0.85);
    } else if (mode === "image" && preview) {
      image = preview;
    }

    if (!nm) {
      setMsg({ kind: "err", text: "اكتب اسمك أولًا." });
      return;
    }
    if (!tx && !image) {
      setMsg({ kind: "err", text: "اكتب نصًا أو أضف صورة أو ارسم شيئًا." });
      return;
    }
    if (cooldown > 0) {
      setMsg({ kind: "err", text: `انتظر ${cooldown} ثانية قبل مشاركة جديدة.` });
      return;
    }
    setBusy(true);
    try {
      try {
        localStorage.setItem("wall_name", nm);
      } catch {}
      const r = await fetch(`/api/wall/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nm,
          text: tx,
          device: deviceToken(),
          image,
          cell: composerCell,
        }),
      });
      if (r.ok) {
        const until = Date.now() + COOLDOWN * 1000;
        try {
          localStorage.setItem("wall_cool_" + slug, String(until));
        } catch {}
        setCooldown(COOLDOWN);
        closeComposer();
        setMsg({
          kind: "ok",
          text: moderated
            ? "تم الإرسال! ستظهر مشاركتك بعد موافقة المعلم."
            : "تمت إضافة مشاركتك ✓",
        });
        loadFeed();
      } else if (r.status === 409) {
        setMsg({
          kind: "err",
          text: "هذا المربّع حُجز للتو، اختر مربّعًا آخر.",
        });
        closeComposer();
        loadFeed();
      } else if (r.status === 429) {
        const d = await r.json().catch(() => ({}));
        const left = Number(d.wait || COOLDOWN);
        setCooldown(left);
        setMsg({ kind: "err", text: `انتظر ${left} ثانية قبل مشاركة جديدة.` });
      } else if (r.status === 413) {
        setMsg({ kind: "err", text: "حجم الصورة كبير، اختر صورة أصغر." });
      } else if (r.status === 403) {
        setMsg({ kind: "err", text: "الحائط مغلق ولا يستقبل مشاركات." });
      } else {
        setMsg({ kind: "err", text: "تعذّر الإرسال، حاول مرة أخرى." });
      }
    } catch {
      setMsg({ kind: "err", text: "تعذّر الاتصال، تحقّق من الإنترنت." });
    } finally {
      setBusy(false);
    }
  }

  const filled = byCell.size;

  return (
    <main className="max-w-5xl mx-auto p-4 space-y-4">
      <header className="text-center space-y-1 pt-2">
        <h1 className="text-2xl font-bold text-brand">{title}</h1>
        {goal && <p className="text-muted text-sm">{goal}</p>}
        <p className="text-xs text-muted">
          {filled} من {capacity} مكان ممتلئ
          {open ? " · اضغط مربّعًا فارغًا لتضيف مشاركتك" : " · الحائط مغلق"}
        </p>
      </header>

      {!open && (
        <div className="card p-3 text-center text-muted text-sm">
          🔒 هذا الحائط مغلق حاليًا ولا يستقبل مشاركات جديدة.
        </div>
      )}

      {/* رسالة عامة */}
      {msg && !composerCell && (
        <div
          className={`text-sm rounded-lg px-3 py-2 text-center ${
            msg.kind === "ok"
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* اللوحة: شبكة المربّعات */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))",
        }}
      >
        {Array.from({ length: capacity }, (_, i) => {
          const p = byCell.get(i);
          if (p) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => setViewer(p)}
                className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-brandsoft text-right hover:ring-2 hover:ring-brand transition"
                title={p.name}
              >
                {p.hasImage && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/api/wall/${slug}/image/${p.id}`}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                {!p.hasImage && p.text && (
                  <span className="absolute inset-0 p-2 text-xs leading-snug overflow-hidden flex items-center justify-center text-center">
                    {p.text}
                  </span>
                )}
                <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[11px] px-1 py-0.5 truncate">
                  {p.name || "طالب"}
                </span>
              </button>
            );
          }
          return (
            <button
              key={i}
              type="button"
              disabled={!open}
              onClick={() => open && openComposer(i)}
              className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] text-muted hover:border-brand hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
            >
              <span className="text-2xl leading-none">+</span>
              <span className="text-[11px]">مكان فارغ</span>
            </button>
          );
        })}
      </div>

      {/* نافذة الكتابة */}
      {composerCell != null && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3"
          onClick={closeComposer}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="card p-4 space-y-3 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold">مشاركتك في المربّع {composerCell + 1}</h2>
              <button
                type="button"
                onClick={closeComposer}
                className="text-muted hover:text-red-500 text-xl leading-none px-1"
              >
                ✕
              </button>
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
              placeholder="اسمك"
              className="w-full text-sm"
            />

            <div className="space-y-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, TEXT_MAX))}
                placeholder="اكتب مشاركتك هنا… (اختياري إن أضفت صورة أو رسمة)"
                rows={3}
                className="w-full text-sm resize-y"
              />
              <div className="text-xs text-muted text-left" dir="ltr">
                {text.length}/{TEXT_MAX}
              </div>
            </div>

            {/* اختيار نوع المرفق */}
            <div className="flex items-center gap-2">
              <label
                className={`btn-ghost btn text-sm cursor-pointer ${
                  mode === "image" ? "ring-2 ring-brand" : ""
                }`}
              >
                📷 صورة
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onPickFile}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  if (fileRef.current) fileRef.current.value = "";
                  setMode("draw");
                }}
                className={`btn-ghost btn text-sm ${
                  mode === "draw" ? "ring-2 ring-brand" : ""
                }`}
              >
                ✏️ رسم
              </button>
              {mode !== "none" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("none");
                    setPreview(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="text-xs text-muted hover:text-red-500 ms-auto"
                >
                  إزالة المرفق
                </button>
              )}
            </div>

            {/* معاينة الصورة */}
            {mode === "image" && preview && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={preview}
                alt=""
                className="rounded-lg max-h-56 w-auto border border-[var(--border)]"
              />
            )}

            {/* لوحة الرسم */}
            {mode === "draw" && (
              <div className="space-y-2">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={420}
                  onPointerDown={onDown}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  onPointerLeave={onUp}
                  className="w-full rounded-lg border border-[var(--border)] bg-white touch-none"
                  style={{ touchAction: "none" }}
                />
                <button
                  type="button"
                  onClick={initCanvas}
                  className="text-xs text-muted hover:text-brand"
                >
                  مسح الرسم والبدء من جديد
                </button>
              </div>
            )}

            {msg && composerCell != null && (
              <div
                className={`text-sm rounded-lg px-3 py-2 ${
                  msg.kind === "ok"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                }`}
              >
                {msg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || cooldown > 0}
              className="btn w-full disabled:opacity-50"
            >
              {busy
                ? "جارٍ الإرسال…"
                : cooldown > 0
                ? `انتظر ${cooldown} ثانية`
                : "نشر في هذا المربّع"}
            </button>
          </form>
        </div>
      )}

      {/* نافذة عرض مشاركة */}
      {viewer && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3"
          onClick={() => setViewer(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card p-4 space-y-3 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-brand">
                {viewer.name || "طالب"}
              </span>
              <button
                type="button"
                onClick={() => setViewer(null)}
                className="text-muted hover:text-red-500 text-xl leading-none px-1"
              >
                ✕
              </button>
            </div>
            {viewer.text && (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {viewer.text}
              </p>
            )}
            {viewer.hasImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`/api/wall/${slug}/image/${viewer.id}`}
                alt=""
                className="rounded-lg max-h-[70vh] w-auto mx-auto"
              />
            )}
            <div className="text-xs text-muted">{fmt(viewer.createdAt)}</div>
          </div>
        </div>
      )}
    </main>
  );
}
