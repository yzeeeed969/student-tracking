"use client";
import { useState } from "react";
import ToastForm from "@/components/ToastForm";

// زر «تعديل» يُظهر/يُخفي نموذج تعديل الحائط (العنوان + الوصف + عدد المربّعات)
// معبّأً بالقيم الحالية، ويستدعي إجراء updateWall عبر ToastForm.
export default function WallEdit({
  id,
  title,
  goal,
  cells,
  action,
}: {
  id: number;
  title: string;
  goal: string;
  cells: number;
  action: (fd: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost btn text-sm"
      >
        {open ? "إلغاء التعديل" : "تعديل"}
      </button>

      {open && (
        <ToastForm
          action={action}
          toast="تم تعديل الحائط"
          className="card p-4 space-y-3 w-full mt-2 bg-black/5 dark:bg-white/5"
        >
          <input type="hidden" name="id" value={id} />
          <div className="font-bold text-sm">تعديل الحائط</div>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-sm text-muted">عنوان الحائط *</span>
              <input
                name="title"
                required
                defaultValue={title}
                className="w-full text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-muted">وصف/تعليمات (اختياري)</span>
              <input
                name="goal"
                defaultValue={goal}
                maxLength={300}
                className="w-full text-sm"
              />
            </label>
          </div>
          <label className="block space-y-1 max-w-xs">
            <span className="text-sm text-muted">
              عدد الأماكن (المربّعات) على اللوحة
            </span>
            <input
              type="number"
              name="cells"
              defaultValue={cells}
              min={6}
              max={100}
              className="w-full text-sm"
            />
            <span className="text-xs text-muted">
              بين 6 و100. لا يمكن تنقيص العدد دون أعلى مربّع مُستخدَم (احذف
              مشاركاته أولًا).
            </span>
          </label>
          <button className="btn text-sm">حفظ التعديل</button>
        </ToastForm>
      )}
    </>
  );
}
