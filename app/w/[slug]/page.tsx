import { db } from "@/db";
import { walls } from "@/db/schema";
import { eq } from "drizzle-orm";
import WallClient from "@/components/WallClient";

export const dynamic = "force-dynamic";

export default async function PublicWallPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [wall] = await db.select().from(walls).where(eq(walls.slug, slug));

  if (!wall) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-6 text-center max-w-sm">
          <div className="text-2xl mb-2">🔗</div>
          <div className="font-bold mb-1">الحائط غير موجود</div>
          <div className="text-muted text-sm">
            تأكّد من الرابط، أو اطلب من المعلم رابطًا جديدًا.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" dir="rtl">
      <WallClient
        slug={wall.slug}
        title={wall.title}
        goal={wall.goal}
        open={wall.open}
        moderated={wall.moderated}
        cells={wall.cells}
      />
    </div>
  );
}
