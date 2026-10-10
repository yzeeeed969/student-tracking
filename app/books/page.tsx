import { redirect } from "next/navigation";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const sp = await searchParams;
  redirect(`/library?view=books${sp.e ? `&e=${sp.e}` : ""}`);
}
