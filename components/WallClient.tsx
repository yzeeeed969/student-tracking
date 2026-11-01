"use client";
import { useEffect, useRef, useState, useCallback } from "react";

type Post = {
  id: number;
  name: string;
  text: string;
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
        // تقليل الجودة تدريجيًا حتى نصل لحجم مقبول
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
}: {
  slug: string;
  title: string;
  goal: string;
  open: boolean;
  moderated: boolean;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<string | null>(null); // dataURL للصورة المضغوطة
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );
  const [cooldown, setCooldown] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // استعادة اسم الطالب المحفوظ محليًا
  useEffect(() => {
    try {
      const n = localStorage.getItem("wall_name");
      if (n) setName(n);
      const until = Number(localStorage.getItem("wall_cool_" + slug) || 0);
      const left = Math.ceil((until - Date.now()) / 1000);
      if (left > 0) setCooldown(left);
    } catch {}
  }, [slug]);

  // عدّاد التهدئة
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // جلب المشاركات (أول مرة + كل 5 ثوانٍ)
  const loadFeed = useCallback(async () => {
    try {
      const r = await fetch(`/api/wall/${slug}/feed`, { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      setPosts(data.posts || []);
    } catch {}
  }, [slug]);

  useEffect(() => {
    loadFeed();
    const t = setInterval(loadFeed, 5000);
    return () => clearInterval(t);
  }, [loadFeed]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setMsg({ kind: "err", text: "الملف المختار ليس صورة." });
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const dataUrl = await compressImage(f);
      setPreview(dataUrl);
    } catch {
      setMsg({ kind: "err", text: "تعذّر تجهيز الصورة، جرّب صورة أخرى." });
    } finally {
      setBusy(false);
    }
  }

  function clearImage() {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const nm = name.trim();
    const tx = text.trim();
    if (!nm) {
      setMsg({ kind: "err", text: "اكتب اسمك أولًا." });
      return;
    }
    if (!tx && !preview) {
      setMsg({ kind: "err", text: "اكتب شيئًا أو أرفق صورة." });
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
          image: preview,
        }),
      });
      if (r.ok) {
        setText("");
        clearImage();
        const until = Date.now() + COOLDOWN * 1000;
        try {
          localStorage.setItem("wall_cool_" + slug, String(until));
        } catch {}
        setCooldown(COOLDOWN);
        setMsg({
          kind: "ok",
          text: moderated
            ? "تم الإرسال! ستظهر مشاركتك بعد موافقة المعلم."
            : "تمت إضافة مشاركتك ✓",
        });
        if (!moderated) loadFeed();
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

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4">
      <header className="text-center space-y-1 pt-2">
        <h1 className="text-2xl font-bold text-brand">{title}</h1>
        {goal && <p className="text-muted text-sm">{goal}</p>}
      </header>

      {open ? (
        <form onSubmit={submit} className="card p-4 space-y-3">
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
              placeholder="اكتب مشاركتك هنا…"
              rows={3}
              className="w-full text-sm resize-y"
            />
            <div className="text-xs text-muted text-left" dir="ltr">
              {text.length}/{TEXT_MAX}
            </div>
          </div>

          {preview ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt=""
                className="rounded-lg max-h-48 w-auto border border-[var(--border)]"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-1 left-1 bg-black/60 text-white rounded-full w-7 h-7 text-sm"
                title="إزالة الصورة"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="btn-ghost btn text-sm cursor-pointer inline-block">
              📷 إضافة صورة (اختياري)
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPickFile}
                className="hidden"
              />
            </label>
          )}

          {msg && (
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
              : "مشاركة"}
          </button>
        </form>
      ) : (
        <div className="card p-4 text-center text-muted text-sm">
          🔒 هذا الحائط مغلق حاليًا ولا يستقبل مشاركات جديدة.
        </div>
      )}

      {/* المشاركات */}
      <section className="space-y-3">
        {posts.length === 0 ? (
          <div className="text-center text-muted text-sm py-6">
            لا توجد مشاركات بعد. كن أول المشاركين!
          </div>
        ) : (
          posts.map((p) => (
            <article key={p.id} className="card p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-brand">
                  {p.name || "طالب"}
                </span>
                <span className="text-xs text-muted">{fmt(p.createdAt)}</span>
              </div>
              {p.text && (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {p.text}
                </p>
              )}
              {p.hasImage && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/api/wall/${slug}/image/${p.id}`}
                  alt=""
                  loading="lazy"
                  className="rounded-lg max-h-96 w-auto"
                />
              )}
            </article>
          ))
        )}
      </section>
    </main>
  );
}
