"use client";
import { useState } from "react";

type Tpl = { label: string; body: string };

// محرّر قوالب واتساب الإضافية — يُسلسل القائمة في حقل مخفي يُرسل مع نموذج الإعدادات
export default function TemplatesEditor({ initial }: { initial: Tpl[] }) {
  const [list, setList] = useState<Tpl[]>(initial);

  const update = (i: number, field: keyof Tpl, val: string) =>
    setList((l) => l.map((t, idx) => (idx === i ? { ...t, [field]: val } : t)));
  const add = () => setList((l) => [...l, { label: "", body: "" }]);
  const remove = (i: number) => setList((l) => l.filter((_, idx) => idx !== i));

  const clean = list.filter((t) => t.label.trim() || t.body.trim());

  return (
    <div className="space-y-3">
      <input type="hidden" name="custom_templates" value={JSON.stringify(clean)} />
      {list.map((t, i) => (
        <div key={i} className="border border-black/10 dark:border-white/10 rounded-lg p-2 space-y-2">
          <div className="flex gap-2 items-center">
            <input
              value={t.label}
              onChange={(e) => update(i, "label", e.target.value)}
              placeholder="اسم القالب (مثال: تذكير باختبار)"
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-red-500 text-sm px-2"
            >
              حذف
            </button>
          </div>
          <textarea
            value={t.body}
            onChange={(e) => update(i, "body", e.target.value)}
            rows={4}
            placeholder="نص الرسالة…"
            className="w-full"
          />
        </div>
      ))}
      <button type="button" onClick={add} className="btn-ghost btn text-sm">
        + إضافة قالب جديد
      </button>
      <div className="text-muted text-xs">
        المتغيّرات المتاحة: {"{student} {subject} {teacher} {school} {date}"}
      </div>
    </div>
  );
}
