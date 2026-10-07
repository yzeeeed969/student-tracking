import Nav from "@/components/Nav";
import { getSettings, weights } from "@/lib/settings";
import { saveSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await getSettings();
  const w = weights(s);
  const types: string[] = JSON.parse(s.behavior_types || "[]");
  const sum = w.quran + w.oralWritten + w.homework + w.participation;

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="p-4 space-y-4">
        <h1 className="text-xl font-bold">الإعدادات</h1>
        <form action={saveSettings} className="space-y-4">
          <div className="card p-4 space-y-3">
            <h2 className="font-bold">بيانات المعلم</h2>
            <div className="grid md:grid-cols-3 gap-2">
              <Field name="teacher" label="اسم المعلم" value={s.teacher} />
              <Field name="subject" label="المادة" value={s.subject} />
              <Field name="school" label="المدرسة" value={s.school} />
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <h2 className="font-bold">
              توزيع الدرجات{" "}
              <span
                className={sum === 100 ? "text-brand" : "text-red-500"}
              >
                (المجموع = {sum})
              </span>
            </h2>
            <div className="grid md:grid-cols-4 gap-2">
              <Field name="w_quran" label="القرآن" value={String(w.quran)} type="number" />
              <Field
                name="w_oral_written"
                label="الشفهي والتحريري"
                value={String(w.oralWritten)}
                type="number"
              />
              <Field
                name="w_homework"
                label="الواجبات"
                value={String(w.homework)}
                type="number"
              />
              <Field
                name="w_participation"
                label="المشاركة"
                value={String(w.participation)}
                type="number"
              />
            </div>
            <Field
              name="homework_count"
              label="عدد الواجبات"
              value={s.homework_count ?? "18"}
              type="number"
            />
          </div>

          <div className="card p-4 space-y-3">
            <h2 className="font-bold">قائمة السلوك السيّئ (سطر لكل نوع)</h2>
            <textarea
              name="behavior_types"
              rows={types.length + 2}
              className="w-full"
              defaultValue={types.join("\n")}
            />
          </div>

          <div className="card p-4 space-y-3">
            <h2 className="font-bold">قوالب رسائل واتساب</h2>
            <div className="text-muted text-sm">
              المتغيّرات: {"{student} {subject} {teacher} {school} {date} {lesson} {violation}"}
            </div>
            <TplField name="tpl_taazeez" label="قالب التعزيز" value={s.tpl_taazeez} />
            <TplField
              name="tpl_homework"
              label="قالب عدم الإجابة"
              value={s.tpl_homework}
            />
            <TplField
              name="tpl_violation"
              label="قالب المخالفة"
              value={s.tpl_violation}
            />
          </div>

          <div className="flex justify-end">
            <button className="btn">حفظ الإعدادات</button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({
  name,
  label,
  value,
  type = "text",
}: {
  name: string;
  label: string;
  value?: string;
  type?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-muted">{label}</span>
      <input name={name} type={type} defaultValue={value ?? ""} className="w-full" />
    </label>
  );
}

function TplField({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-muted">{label}</span>
      <textarea name={name} rows={6} defaultValue={value ?? ""} className="w-full" />
    </label>
  );
}
