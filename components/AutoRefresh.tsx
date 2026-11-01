"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// تحديث الصفحة تلقائيًا كل فترة (لمتابعة المشاركات الجديدة أولًا بأول)
export default function AutoRefresh({ seconds = 7 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
