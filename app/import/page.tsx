import Nav from "@/components/Nav";

export const dynamic = "force-dynamic";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="p-4 space-y-4">
        <h1 className="text-xl font-bold">استيراد الطلاب</h1>

        {/* استيراد من Excel */}
        <div className="card p-6 max-w-xl space-y-4">
          <h2 className="font-bold text-brand">استيراد / مطابقة من Excel</h2>
          <p className="text-muted text-sm leading-7">
            ارفع ملف Excel يحتوي أعمدة: <b>الاسم</b> و<b>الفصل</b> و
            <b>ولي الأمر</b> و<b>الجوال</b> (تكفي الأعمدة المتوفرة). النظام
            يطابق كل اسم مع الطلاب الحاليين فيحدّث فصلهم وجوالهم واسم وليّهم، ومن
            لم يكن موجودًا يُضيفه. الحقول الفارغة في الملف لا تمسح القيم الحالية.
          </p>
          {e === "badexcel" && (
            <div className="text-red-500 text-sm">
              تعذّر قراءة ملف Excel — تأكّد أنه بصيغة .xlsx صحيحة.
            </div>
          )}
          {e === "nofile" && (
            <div className="text-red-500 text-sm">لم تختر ملفًا.</div>
          )}
          <form
            action="/api/import-excel"
            method="post"
            encType="multipart/form-data"
            className="space-y-4"
          >
            <input
              type="file"
              name="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              required
              className="w-full"
            />
            <button className="btn w-full">رفع ومطابقة</button>
          </form>
        </div>

        {/* استيراد من JSON (الإعداد الأولي) */}
        <div className="card p-6 max-w-xl space-y-4">
          <h2 className="font-bold">استيراد أولي من JSON</h2>
          <p className="text-muted text-sm leading-7">
            لملف البيانات الأولي (JSON) الذي يجهّزه المساعد — يضيف الطلاب
            والفصول ودرجاتهم دفعة واحدة. الطلاب الموجودون مسبقًا لا يتكرّرون.
          </p>
          {e === "badjson" && (
            <div className="text-red-500 text-sm">
              الملف غير صالح — تأكّد أنه ملف JSON الصحيح.
            </div>
          )}
          <form
            action="/api/import"
            method="post"
            encType="multipart/form-data"
            className="space-y-4"
          >
            <input
              type="file"
              name="file"
              accept=".json,application/json"
              required
              className="w-full"
            />
            <button className="btn-ghost btn w-full">رفع واستيراد (JSON)</button>
          </form>
        </div>
      </main>
    </div>
  );
}
