"use client";
import { useState } from "react";

// زر صغير ينسخ مسارًا (يُضاف لأصل الموقع) إلى الحافظة ويُظهر تأكيدًا قصيرًا
export default function CopyLinkButton({
  path,
  className,
  label = "📋 نسخ الرابط",
}: {
  path: string;
  className?: string;
  label?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        const url =
          typeof window !== "undefined"
            ? window.location.origin + path
            : path;
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          // بعض المتصفحات تمنع النسخ بلا تفاعل
        }
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? "✓ تم النسخ" : label}
    </button>
  );
}
