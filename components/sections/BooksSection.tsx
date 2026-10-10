import { db } from "@/db";
import { books } from "@/db/schema";
import { desc } from "drizzle-orm";
import ToastForm from "@/components/ToastForm";
import BookViewer from "@/components/BookViewer";
import { deleteBook } from "@/app/books/actions";

export default async function BooksSection({ e }: { e?: string }) {
  const list = await db
    .select({
      id: books.id,
      title: books.title,
      size: books.size,
      createdAt: books.createdAt,
    })
    .from(books)
    .orderBy(desc(books.createdAt));

  return (
    <div className="space-y-5">
      <div className="card p-4 space-y-3">
        <h2 className="font-bold">إضافة كتاب (PDF)</h2>
        {e === "nofile" && (
          <div className="text-red-500 text-sm">لم تختر ملفًا.</div>
        )}
        <form
          action="/api/book-upload"
          method="post"
          encType="multipart/form-data"
          className="flex gap-2 items-center flex-wrap"
        >
          <input
            name="title"
            placeholder="عنوان الكتاب (اختياري)"
            className="flex-1 min-w-48"
          />
          <input
            type="file"
            name="file"
            accept="application/pdf,.pdf"
            required
            className="flex-1 min-w-48"
          />
          <button className="btn">رفع الكتاب</button>
        </form>
        <p className="text-muted text-xs">
          يمكنك إضافة أكثر من كتاب. تُحفظ الملفات بشكل دائم داخل قاعدة البيانات.
        </p>
      </div>

      {list.length === 0 && (
        <div className="card p-6 text-center text-muted">
          لا توجد كتب بعد — ارفع أول كتاب.
        </div>
      )}

      <div className="space-y-3">
        {list.map((b) => (
          <div key={b.id} className="space-y-1">
            <BookViewer id={b.id} title={b.title} size={b.size} />
            <div className="flex justify-end">
              <ToastForm action={deleteBook} toast="تم حذف الكتاب">
                <input type="hidden" name="id" value={b.id} />
                <button className="text-red-500 text-xs hover:underline">
                  حذف الكتاب
                </button>
              </ToastForm>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
