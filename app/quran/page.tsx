import { redirect } from "next/navigation";

export default async function QuranPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const sp = await searchParams;
  redirect(`/record?view=quran${sp.class ? `&class=${sp.class}` : ""}`);
}
