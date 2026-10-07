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
      <main className="p-4">
        <div className="card p-6 max-w-xl mx-auto space-y-4">
          <h1 className="text-xl font-bold">استيراد الطلاب</h1>
          <p className="text-muted text-sm leading-7">
            ارفع ملف البيانات (بصيغة JSON) الذي أرسله لك المساعد. سيضيف النظام
            الطلاب والفصول ودرجاتهم دفعة واحدة. الطلاب الموجودون مسبقًا لن
            يتكرّروا.
          </p>
          {e === "nofile" && (
            <div className="text-red-500 text-sm">لم تختر ملفًا.</div>
          )}
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
            <button className="btn w-full">رفع واستيراد</button>
          </form>
        </div>
      </main>
    </div>
  );
}
