import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("token")?.value;

  // если токена нет — редиректим на логин
  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // токен есть — пускаем дальше
  return NextResponse.next();
}

export const config = {
  matcher: ["/schedule-view/:path*"],
};

