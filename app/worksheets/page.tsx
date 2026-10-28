import { db } from "@/db";
import { worksheets } from "@/db/schema";
import { asc } from "drizzle-orm";
import { saveWorksheet } from "./actions";
import ToastForm from "@/components/ToastForm";

export const dynamic = "force-dynamic";

export default async function WorksheetsPage() {
  const sheets = await db
    .select()
    .from(worksheets)
    .orderBy(asc(worksheets.order), asc(worksheets.num));

  const publishedCount = sheets.filter((s) => s.published).length;

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">أوراق العمل</h1>
          <span className="text-muted text-sm">
            {sheets.length} درسًا · المنشورة: {publishedCount}
          </span>
        </div>

        <div className="card p-4 text-sm text-muted">
          لكل درس بطاقة واحدة: ضع رابط ورقة العمل لثالث أول ورابطها لثالث ثاني،
          وفعّل «منشورة» لتظهر لأولياء الأمور. درجات الطلاب تُرصد من تبويب «أوراق
          العمل» في صفحة الرصد.
        </div>

        <div className="space-y-3">
          {sheets.map((s) => (
            <ToastForm
              key={s.id}
              action={saveWorksheet}
              toast="تم الحفظ"
              className="card p-4 space-y-3"
            >
              <input type="hidden" name="id" value={s.id} />
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="font-bold">
                  ورقة عمل درس {s.title}
                  <span className="text-muted font-normal text-sm">
                    {" "}
                    (ص {s.page})
                  </span>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    name="published"
                    value="1"
                    defaultChecked={s.published}
                    className="w-5 h-5"
                  />
                  منشورة لأولياء الأمور
                </label>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-sm text-muted">رابط ثالث أول</span>
                  <input
                    name="urlC1"
                    defaultValue={s.urlC1}
                    dir="ltr"
                    placeholder="https://..."
                    className="w-full text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm text-muted">رابط ثالث ثاني</span>
                  <input
                    name="urlC2"
                    defaultValue={s.urlC2}
                    dir="ltr"
                    placeholder="https://..."
                    className="w-full text-sm"
                  />
                </label>
              </div>
              <button className="btn text-sm">حفظ</button>
            </ToastForm>
          ))}
        </div>
      </main>
    </div>
  );
}
