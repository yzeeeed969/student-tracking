import { redirect } from "next/navigation";

export default async function YoutubePage() {
  redirect("/library?view=videos");
}
