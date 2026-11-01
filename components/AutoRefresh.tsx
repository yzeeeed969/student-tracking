"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// تحديث الصفحة تلقائيًا كل فترة (لمتابعة المشاركات الجديدة أولًا بأول)
// يتوقّف عندما تكون الصفحة غير ظاهرة لتخفيف الضغط على الخادم
export default function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
