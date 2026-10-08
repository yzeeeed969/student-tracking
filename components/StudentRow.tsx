"use client";
import { useState } from "react";
import ToastForm from "./ToastForm";
import RowSaveButton from "./RowSaveButton";
import SendMenu from "./SendMenu";
import ReadingBadge, { READING_LEVELS } from "./ReadingBadge";

type S = {
  id: number;
  code: string;
  name: string;
  guardianName: string;
  phone: string;
  classId: number;
  readingLevel: number;
};

export default function StudentRow({
  s,
  classes,
  updateStudent,
  deleteStudent,
  templates = [],
}: {
  s: S;
  classes: { id: number; name: string }[];
  updateStudent: (fd: FormData) => Promise<void>;
  deleteStudent: (fd: FormData) => Promise<void>;
  templates?: { label: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const sendOptions = [
    { label: "تعزيز", kind: "عام" },
    ...templates.map((t, i) => ({ label: t.label, tpl: i })),
  ];

  if (editing) {
    return (
      <tr data-name={s.name}>
        <td colSpan={6}>
          <form className="flex flex-wrap items-center gap-2 py-1">
            <input type="hidden" name="id" value={s.id} />
            <input
              name="name"
              defaultValue={s.name}
              placeholder="الاسم"
              className="w-44"
            />
            <input
              name="guardianName"
              defaultValue={s.guardianName}
              placeholder="ولي الأمر"
              className="w-44"
            />
            <input
              name="phone"
              defaultValue={s.phone}
              placeholder="الجوال (05...)"
              dir="ltr"
              className="w-36 text-right"
            />
            <select name="classId" defaultValue={s.classId} className="w-28">
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select name="readingLevel" defaultValue={s.readingLevel} className="w-32" title="مستوى القراءة">
              {READING_LEVELS.map((l) => (
                <option key={l.v} value={l.v}>
                  {l.label}
                </option>
              ))}
            </select>
            <RowSaveButton
              action={updateStudent}
              toast="تم حفظ التعديل"
              className="btn text-xs px-3 py-1"
              onDone={() => setEditing(false)}
            >
              حفظ
            </RowSaveButton>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-muted text-xs px-2"
            >
              إلغاء
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr data-name={s.name}>
      <td>
        <input type="checkbox" className="rowchk" value={s.id} />
      </td>
      <td>{s.code}</td>
      <td>
        {s.name} <ReadingBadge level={s.readingLevel} />
      </td>
      <td>{s.guardianName}</td>
      <td dir="ltr" className="text-right">
        {s.phone}
      </td>
      <td>
        <div className="flex gap-3 items-center">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-brand text-sm hover:underline"
          >
            تعديل
          </button>
          {s.phone && <SendMenu studentId={s.id} options={sendOptions} />}
          <ToastForm action={deleteStudent} toast="تم حذف الطالب">
            <input type="hidden" name="id" value={s.id} />
            <button
              className="text-red-500 text-sm hover:underline"
              onClick={(e) => {
                if (!confirm(`تأكيد حذف الطالب: ${s.name}؟`))
                  e.preventDefault();
              }}
            >
              حذف
            </button>
          </ToastForm>
        </div>
      </td>
    </tr>
  );
}
