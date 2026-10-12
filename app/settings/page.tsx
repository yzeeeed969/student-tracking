import { getSettings, weights, parentView } from "@/lib/settings";
import { saveSettings } from "./actions";
import TemplatesEditor from "@/components/TemplatesEditor";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await getSettings();
  const w = weights(s);
  const types: string[] = JSON.parse(s.behavior_types || "[]");
  const pv = parentView(s);
  let customTemplates: { label: string; body: string }[] = [];
  try {
    customTemplates = JSON.parse(s.custom_templates || "[]");
  } catch {
    customTemplates = [];
  }
  const sum = w.quran + w.oralWritten + w.homework + w.participation;

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-4">
        <h1 className="text-xl font-bold">الإعدادات</h1>
        <form action={saveSettings} className="space-y-4">
          <div className="card p-4 space-y-3">
            <h2 className="font-bold">بيانات المعلم</h2>
            <div className="grid md:grid-cols-3 gap-2">
              <Field name="teacher" label="اسم المعلم" value={s.teacher} />
              <Field name="subject" label="المادة" value={s.subject} />
              <Field name="school" label="المدرسة" value={s.school} />
              <Field
                name="teacher_whatsapp"
                label="جوال المعلم (واتساب) — لزر التواصل في صفحة العرض"
                value={s.teacher_whatsapp}
              />
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
            <h2 className="font-bold">نافذة ولي الأمر (صفحة العرض)</h2>
            <p className="text-muted text-sm">
              تحكّم في البيانات التي تظهر لولي الأمر عند إدخاله رقم جواله. (رقم
              الجوال لا يظهر أبدًا.)
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              <Check name="parent_show_quran" label="القرآن (السور ودرجاتها)" checked={pv.quran} />
              <Check
                name="parent_show_homework"
                label="الواجبات (مع صفحات التقويم)"
                checked={pv.homework}
              />
              <Check
                name="parent_show_exam_w1"
                label="اختبار الفترة الأولى (تحريري ١)"
                checked={pv.examW1}
              />
              <Check
                name="parent_show_exam_w2"
                label="اختبار الفترة الثانية (تحريري ٢)"
                checked={pv.examW2}
              />
              <Check
                name="parent_show_exam_o1"
                label="الاختبار الشفهي الأول"
                checked={pv.examO1}
              />
              <Check
                name="parent_show_exam_o2"
                label="الاختبار الشفهي الثاني"
                checked={pv.examO2}
              />
              <Check
                name="parent_show_participation"
                label="المشاركة"
                checked={pv.participation}
              />
              <Check
                name="parent_show_total"
                label="المجموع (100)"
                checked={pv.total}
              />
              <Check
                name="parent_show_notes"
                label="الملاحظات والسلوك"
                checked={pv.notes}
              />
            </div>
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
              المتغيّرات: {"{student} {subject} {teacher} {school} {date} {lesson} {violation} {solved} {unsolved}"}
            </div>
            <TplField name="tpl_taazeez" label="قالب التعزيز" value={s.tpl_taazeez} />
            <TplField
              name="tpl_homework"
              label="قالب عدم الإجابة"
              value={s.tpl_homework}
            />
            <TplField
              name="tpl_homework_status"
              label="قالب حالة الواجبات (المحلولة/غير المحلولة) — يستخدم {solved} و {unsolved}"
              value={s.tpl_homework_status}
            />
            <TplField
              name="tpl_violation"
              label="قالب المخالفة"
              value={s.tpl_violation}
            />
            <div className="pt-2 border-t border-black/10 dark:border-white/10 space-y-2">
              <h3 className="font-bold text-sm">قوالب إضافية (تُرسَل من صفحة الطلاب)</h3>
              <TemplatesEditor initial={customTemplates} />
            </div>
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

function Check({
  name,
  label,
  checked,
}: {
  name: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer card p-3">
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={checked}
        className="w-5 h-5"
      />
      <span className="text-sm">{label}</span>
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
