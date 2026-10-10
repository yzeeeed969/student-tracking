import { getClasses } from "@/lib/grades";
import SubTabs from "@/components/SubTabs";
import GradesSection from "@/components/sections/GradesSection";
import HomeworkSection from "@/components/sections/HomeworkSection";
import QuranSection from "@/components/sections/QuranSection";
import ParticipationSection from "@/components/sections/ParticipationSection";

export const dynamic = "force-dynamic";

const TABS = [
  { view: "grades", label: "الدرجات" },
  { view: "homework", label: "الواجبات" },
  { view: "quran", label: "القرآن" },
  { view: "participation", label: "المشاركة" },
];

export default async function RecordPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; class?: string; date?: string }>;
}) {
  const classes = await getClasses();
  const sp = await searchParams;
  const activeId = Number(sp.class) || classes[0]?.id;
  const view = TABS.some((t) => t.view === sp.view) ? sp.view! : "grades";

  return (
    <div className="min-h-screen">
      <main className="p-4 space-y-4">
        <h1 className="text-xl font-bold">الرصد</h1>
        <SubTabs tabs={TABS} active={view} base="/record" classId={activeId} />

        {view === "grades" && (
          <GradesSection classes={classes} activeId={activeId} />
        )}
        {view === "homework" && (
          <HomeworkSection classes={classes} activeId={activeId} />
        )}
        {view === "quran" && (
          <QuranSection classes={classes} activeId={activeId} />
        )}
        {view === "participation" && (
          <ParticipationSection
            classes={classes}
            activeId={activeId}
            date={sp.date}
          />
        )}
      </main>
    </div>
  );
}
