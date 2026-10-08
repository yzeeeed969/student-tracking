"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function Toaster() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [msg, setMsg] = useState<string | null>(null);
  const [kind, setKind] = useState<"ok" | "err">("ok");
  const [seq, setSeq] = useState(0);

  // عند وجود رسالة في الرابط: اعرضها ثم نظّف الرابط
  useEffect(() => {
    const ok = sp.get("ok");
    const err = sp.get("err");
    if (!ok && !err) return;
    setKind(err ? "err" : "ok");
    setMsg(err || ok);
    setSeq((s) => s + 1);
    const params = new URLSearchParams(Array.from(sp.entries()));
    params.delete("ok");
    params.delete("err");
    const q = params.toString();
    router.replace(pathname + (q ? `?${q}` : ""), { scroll: false });
  }, [sp, pathname, router]);

  // إشعارات داخل الصفحة (دون إعادة تحميل) عبر حدث مخصّص
  useEffect(() => {
    function onToast(e: Event) {
      const d = (e as CustomEvent).detail || {};
      setKind(d.kind === "err" ? "err" : "ok");
      setMsg(d.msg || "تم");
      setSeq((s) => s + 1);
    }
    window.addEventListener("app:toast", onToast as EventListener);
    return () =>
      window.removeEventListener("app:toast", onToast as EventListener);
  }, []);

  // مؤقّت الإخفاء — يُعاد ضبطه مع كل إشعار جديد
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(t);
  }, [msg, seq]);

  if (!msg) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 pointer-events-none"
      onClick={() => setMsg(null)}
    >
      <div
        className={`pointer-events-auto cursor-pointer rounded-xl px-5 py-3 shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
          kind === "err" ? "bg-red-600" : "bg-green-600"
        }`}
      >
        <span>{kind === "err" ? "✕" : "✓"}</span>
        <span>{msg}</span>
      </div>
    </div>
  );
}
