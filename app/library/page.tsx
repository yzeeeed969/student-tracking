import SubTabs from "@/components/SubTabs";
import BooksSection from "@/components/sections/BooksSection";
import VideosSection from "@/components/sections/VideosSection";

export const dynamic = "force-dynamic";

const TABS = [
  { view: "books", label: "الكتب" },
  { view: "videos", label: "المقاطع" },
];

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; e?: string }>;
}) {
  const sp = await searchParams;
  const view = TABS.some((t) => t.view === sp.view) ? sp.view! : "books";

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-5">
        <h1 className="text-xl font-bold">المكتبة</h1>
        <SubTabs tabs={TABS} active={view} base="/library" />

        {view === "books" && <BooksSection e={sp.e} />}
        {view === "videos" && <VideosSection />}
      </main>
    </div>
  );
}
