import { redirect } from "next/navigation";

export default async function HomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const sp = await searchParams;
  redirect(`/record?view=homework${sp.class ? `&class=${sp.class}` : ""}`);
}
