"use client";
import { useState } from "react";

// عرض رابط الحائط العام مع زر نسخ
export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // في حال عدم توفّر الحافظة: تحديد النص يدويًا
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        readOnly
        value={url}
        dir="ltr"
        onFocus={(e) => e.currentTarget.select()}
        className="flex-1 min-w-[12rem] text-sm bg-brandsoft rounded-lg px-3 py-2"
      />
      <button
        type="button"
        onClick={copy}
        className="btn text-sm whitespace-nowrap"
      >
        {copied ? "تم النسخ ✓" : "نسخ الرابط"}
      </button>
    </div>
  );
}
