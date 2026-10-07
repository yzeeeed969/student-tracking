import { NextResponse } from "next/server";
import { makeToken, SESSION_COOKIE } from "@/lib/token";

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") || "");
  const expected = process.env.AUTH_PASSWORD || "admin123";

  if (password !== expected) {
    const url = new URL("/login?e=1", req.url);
    return NextResponse.redirect(url, 303);
  }

  const token = await makeToken();
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
