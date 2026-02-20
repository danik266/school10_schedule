import { NextResponse } from "next/server";

export function middleware(req) {

  const userId = req.cookies.get("user_id")?.value;
  const userRole = req.cookies.get("user_role")?.value;

  if (req.nextUrl.pathname.startsWith("/schedule-view")) {
    if (!userId) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }
  }

  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!userId || userRole !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/schedule-view/:path*", "/admin/:path*"],
};
