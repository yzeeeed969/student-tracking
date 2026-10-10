import { redirect } from "next/navigation";

export default async function GradesPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const sp = await searchParams;
  redirect(`/record?view=grades${sp.class ? `&class=${sp.class}` : ""}`);
}
