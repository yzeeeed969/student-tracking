import { redirect } from "next/navigation";

export default async function ParticipationPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const q = [
    sp.class ? `class=${sp.class}` : "",
    sp.date ? `date=${sp.date}` : "",
  ]
    .filter(Boolean)
    .join("&");
  redirect(`/record?view=participation${q ? `&${q}` : ""}`);
}
