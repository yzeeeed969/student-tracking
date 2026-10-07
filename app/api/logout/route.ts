import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/token";

export async function POST() {
  const res = new NextResponse(null, {
    status: 303,
    headers: { Location: "/login" },
  });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
