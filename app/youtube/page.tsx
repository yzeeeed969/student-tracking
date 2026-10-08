import Nav from "@/components/Nav";
import { db } from "@/db";
import { videoFolders, videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { youtubeId } from "@/lib/youtube";
import ToastForm from "@/components/ToastForm";
import YoutubeEmbed from "@/components/YoutubeEmbed";
import { addFolder, deleteFolder, addVideo, deleteVideo } from "./actions";

export const dynamic = "force-dynamic";

export default async function YoutubePage() {
  const folders = await db
    .select()
    .from(videoFolders)
    .orderBy(videoFolders.order, videoFolders.id);
  const foldersWithVideos = await Promise.all(
    folders.map(async (f) => ({
      folder: f,
      items: await db
        .select()
        .from(videos)
        .where(eq(videos.folderId, f.id))
        .orderBy(videos.order, videos.id),
    }))
  );

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="p-4 space-y-5">
        <h1 className="text-xl font-bold">مكتبة المقاطع (يوتيوب)</h1>

        {/* إضافة مجلد */}
        <ToastForm
          action={addFolder}
          toast="تمت إضافة المجلد"
          className="card p-4 flex gap-2 items-center flex-wrap"
        >
          <h2 className="font-bold">مجلد جديد</h2>
          <input name="name" placeholder="اسم المجلد (مثال: التجويد)" className="flex-1 min-w-48" required />
          <button className="btn">إضافة مجلد</button>
        </ToastForm>

        {foldersWithVideos.length === 0 && (
          <div className="card p-6 text-center text-muted">
            لا توجد مجلدات بعد — أضف مجلدًا ثم أضف المقاطع بداخله.
          </div>
        )}

        {foldersWithVideos.map(({ folder, items }) => (
          <div key={folder.id} className="card p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-bold text-lg">
                {folder.name}{" "}
                <span className="text-muted text-sm">({items.length} مقطع)</span>
              </h2>
              <ToastForm action={deleteFolder} toast="تم حذف المجلد">
                <input type="hidden" name="id" value={folder.id} />
                <button className="text-red-500 text-sm hover:underline">
                  حذف المجلد
                </button>
              </ToastForm>
            </div>

            {/* إضافة مقطع */}
            <ToastForm
              action={addVideo}
              toast="تمت إضافة المقطع"
              className="flex gap-2 items-center flex-wrap bg-brandsoft/40 rounded-lg p-2"
            >
              <input type="hidden" name="folderId" value={folder.id} />
              <input name="title" placeholder="عنوان المقطع" className="flex-1 min-w-40" required />
              <input name="url" placeholder="رابط يوتيوب" dir="ltr" className="flex-1 min-w-48 text-right" required />
              <button className="btn text-sm">إضافة مقطع</button>
            </ToastForm>

            {/* شبكة المقاطع */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((v) => {
                const vid = youtubeId(v.url);
                return (
                  <div key={v.id} className="space-y-1">
                    {vid ? (
                      <YoutubeEmbed id={vid} title={v.title} />
                    ) : (
                      <a
                        href={v.url}
                        target="_blank"
                        className="block aspect-video rounded-lg bg-black/10 flex items-center justify-center text-muted text-xs"
                      >
                        رابط غير معروف — افتح خارجيًا
                      </a>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{v.title}</span>
                      <ToastForm action={deleteVideo} toast="تم حذف المقطع">
                        <input type="hidden" name="id" value={v.id} />
                        <button className="text-red-500 text-xs">حذف</button>
                      </ToastForm>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
