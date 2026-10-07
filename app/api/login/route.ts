import { NextResponse } from "next/server";
import { makeToken, SESSION_COOKIE } from "@/lib/token";

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") || "");
  const expected = process.env.AUTH_PASSWORD || "admin123";

  if (password !== expected) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: "/login?e=1" },
    });
  }

  const token = await makeToken();
  const res = new NextResponse(null, {
    status: 303,
    headers: { Location: "/" },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
