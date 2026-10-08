"use client";
import { useState } from "react";

export default function BookViewer({
  id,
  title,
  size,
}: {
  id: number;
  title: string;
  size: number;
}) {
  const [open, setOpen] = useState(false);
  const mb = (size / (1024 * 1024)).toFixed(1);
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-bold flex-1">{title}</span>
        <span className="text-muted text-xs">{mb} م.ب</span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="btn-ghost btn text-xs"
        >
          {open ? "إخفاء" : "عرض داخل الموقع"}
        </button>
        <a
          href={`/api/book/${id}`}
          target="_blank"
          className="text-brand text-xs hover:underline"
        >
          فتح في تبويب جديد
        </a>
      </div>
      {open && (
        <iframe
          src={`/api/book/${id}`}
          className="w-full h-[75vh] rounded-lg border border-black/10 dark:border-white/10"
          title={title}
        />
      )}
    </div>
  );
}
