import { db } from "@/db";
import { worksheets } from "@/db/schema";
import { asc } from "drizzle-orm";
import { saveWorksheet, addWorksheet, deleteWorksheet } from "./actions";
import ToastForm from "@/components/ToastForm";

export const dynamic = "force-dynamic";

type Link = { label: string; url: string };

function linksToText(raw: string): string {
  try {
    const arr: Link[] = JSON.parse(raw || "[]");
    return arr.map((l) => `${l.label} | ${l.url}`).join("\n");
  } catch {
    return "";
  }
}

export default async function WorksheetsPage() {
  const sheets = await db
    .select()
    .from(worksheets)
    .orderBy(asc(worksheets.order), asc(worksheets.num));

  const publishedCount = sheets.filter((s) => s.published).length;
  const nextNum =
    sheets.reduce((mx, s) => Math.max(mx, s.num), 0) + 1 || 1;

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">أوراق العمل</h1>
          <span className="text-muted text-sm">
            {sheets.length} ورقة · المنشورة: {publishedCount}
          </span>
        </div>

        <div className="card p-4 text-sm text-muted">
          لكل درس ورقة عمل. ضع عنوانًا ورابطًا (أو أكثر)، وفعّل «منشورة» لتظهر
          لأولياء الأمور في صفحة العرض. درجات الطلاب تُرصد من تبويب «أوراق العمل»
          في صفحة الرصد.
          <div className="mt-1">
            صيغة الروابط: رابط في كل سطر، ويمكن كتابة{" "}
            <span dir="ltr" className="font-mono">
              العنوان | https://...
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {sheets.map((s) => (
            <div key={s.id} className="card p-4 space-y-3">
              <ToastForm
                action={saveWorksheet}
                toast="تم الحفظ"
                className="space-y-3"
              >
                <input type="hidden" name="id" value={s.id} />
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-bold">الدرس {s.num}</div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      name="published"
                      value="1"
                      defaultChecked={s.published}
                      className="w-5 h-5"
                    />
                    منشورة لولي الأمر
                  </label>
                </div>
                <label className="block space-y-1">
                  <span className="text-sm text-muted">عنوان الورقة</span>
                  <input
                    name="title"
                    defaultValue={s.title}
                    placeholder={`الدرس ${s.num}`}
                    className="w-full"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm text-muted">
                    الروابط (رابط في كل سطر)
                  </span>
                  <textarea
                    name="links"
                    rows={2}
                    dir="ltr"
                    defaultValue={linksToText(s.links)}
                    placeholder="ورقة العمل | https://drive.google.com/..."
                    className="w-full text-sm"
                  />
                </label>
                <button className="btn text-sm">حفظ</button>
              </ToastForm>
              <ToastForm action={deleteWorksheet} toast="تم الحذف">
                <input type="hidden" name="id" value={s.id} />
                <button className="text-red-500 text-xs hover:underline">
                  حذف الورقة
                </button>
              </ToastForm>
            </div>
          ))}
        </div>

        <ToastForm
          action={addWorksheet}
          toast="تمت الإضافة"
          className="card p-4 space-y-3"
        >
          <h2 className="font-bold">إضافة ورقة/درس جديد</h2>
          <div className="grid grid-cols-2 gap-2">
            <input
              name="num"
              type="number"
              min={1}
              defaultValue={nextNum}
              placeholder="رقم الدرس"
              required
            />
            <input name="title" placeholder="عنوان الورقة (اختياري)" />
          </div>
          <button className="btn">إضافة</button>
        </ToastForm>
      </main>
    </div>
  );
}
