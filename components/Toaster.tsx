"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function Toaster() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [msg, setMsg] = useState<string | null>(null);
  const [kind, setKind] = useState<"ok" | "err">("ok");

  useEffect(() => {
    const ok = sp.get("ok");
    const err = sp.get("err");
    if (!ok && !err) return;
    setKind(err ? "err" : "ok");
    setMsg(err || ok);
    // أزل المعامل من الرابط حتى لا يتكرر الإشعار
    const params = new URLSearchParams(Array.from(sp.entries()));
    params.delete("ok");
    params.delete("err");
    const q = params.toString();
    router.replace(pathname + (q ? `?${q}` : ""), { scroll: false });
    const t = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(t);
  }, [sp, pathname, router]);

  if (!msg) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 pointer-events-none">
      <div
        className={`pointer-events-auto rounded-xl px-5 py-3 shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
          kind === "err" ? "bg-red-600" : "bg-green-600"
        }`}
      >
        <span>{kind === "err" ? "✕" : "✓"}</span>
        <span>{msg}</span>
      </div>
    </div>
  );
}
