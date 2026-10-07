import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/token";

const PUBLIC = ["/login", "/showcase"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ملفات ثابتة وواجهات عامة
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/favicon") ||
    PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("st_session")?.value;
  if (!(await verifyToken(token))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
