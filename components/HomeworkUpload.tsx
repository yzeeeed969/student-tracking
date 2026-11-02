"use client";

import { useRef, useState } from "react";

// رمز جهاز ثابت للحدّ من التكرار السريع (يُحفظ محليًا على جهاز الطالب)
function deviceId(): string {
  try {
    let d = localStorage.getItem("hw_device");
    if (!d) {
      d = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("hw_device", d);
    }
    return d;
  } catch {
    return "";
  }
}

// ضغط الصورة في المتصفح قبل الرفع: أقصى بُعد 1400 بكسل، JPEG بجودة 0.72
async function compress(file: File): Promise<string> {
  const dataUrl: string = await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = () => rej(new Error("read"));
    fr.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error("img"));
    im.src = dataUrl;
  });
  const MAX = 1400;
  let { width, height } = img;
  if (width > MAX || height > MAX) {
    const r = Math.min(MAX / width, MAX / height);
    width = Math.round(width * r);
    height = Math.round(height * r);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export default function HomeworkUpload({
  studentId,
  phone,
  num,
  alreadyDone,
}: {
  studentId: number;
  phone: string;
  num: number;
  alreadyDone: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<
    "idle" | "working" | "ok" | "err"
  >("idle");
  const [msg, setMsg] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // اسمح بإعادة اختيار نفس الملف لاحقًا
    if (!file) return;
    setStatus("working");
    setMsg("جارٍ رفع الصورة…");
    try {
      const image = await compress(file);
      const r = await fetch("/api/hw-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, studentId, num, image, device: deviceId() }),
      });
      if (r.ok) {
        setStatus("ok");
        setMsg("✓ تم استلام الواجب بنجاح");
        return;
      }
      let err: { error?: string; wait?: number } = {};
      try {
        err = await r.json();
      } catch {
        /* تجاهل */
      }
      setStatus("err");
      if (r.status === 429)
        setMsg(`انتظر ${err.wait ?? 5} ثانية ثم أعد المحاولة.`);
      else if (r.status === 413) setMsg("الصورة كبيرة جدًا، جرّب صورة أخرى.");
      else if (r.status === 403)
        setMsg("رقم الجوال لا يطابق هذا الطالب.");
      else setMsg("تعذّر الرفع، أعد المحاولة.");
    } catch {
      setStatus("err");
      setMsg("تعذّر تجهيز الصورة، جرّب صورة أخرى.");
    }
  }

  if (status === "ok")
    return <span className="text-xs text-brand font-bold">{msg}</span>;

  return (
    <span className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPick}
      />
      <button
        type="button"
        disabled={status === "working"}
        onClick={() => inputRef.current?.click()}
        className="text-xs rounded-md bg-brand text-white px-2 py-0.5 hover:opacity-90 disabled:opacity-60"
      >
        {status === "working"
          ? "جارٍ…"
          : alreadyDone
          ? "📷 إعادة رفع"
          : "📷 رفع صورة الواجب"}
      </button>
      {status === "err" && <span className="text-[11px] text-red-500">{msg}</span>}
    </span>
  );
}
