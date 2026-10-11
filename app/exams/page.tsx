import { redirect } from "next/navigation";

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const sp = await searchParams;
  redirect(`/record?view=exams${sp.class ? `&class=${sp.class}` : ""}`);
}
