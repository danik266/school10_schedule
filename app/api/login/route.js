import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const ADMIN_USERNAME = "admin";
let HASHED_PASSWORD;

export async function POST(req) {
  const { username, password } = await req.json();

  // создаём хэш, если ещё не создан
  if (!HASHED_PASSWORD) {
    HASHED_PASSWORD = await bcrypt.hash("bigass", 10);
  }

  // проверяем логин
  if (username !== ADMIN_USERNAME) {
    return NextResponse.json(
      { success: false, message: "Неверный логин" },
      { status: 401 }
    );
  }

  // проверяем пароль
  const isValid = await bcrypt.compare(password, HASHED_PASSWORD);
  if (!isValid) {
    return NextResponse.json(
      { success: false, message: "Неверный пароль" },
      { status: 401 }
    );
  }

  // создаём токен
  const token = Buffer.from(`${username}:${Date.now()}`).toString("base64");

  // создаём ответ и сразу ставим cookie
  const res = NextResponse.json({ success: true });
  res.cookies.set({
    name: "token",
    value: token,
    httpOnly: true,
    path: "/",
    sameSite: "strict", // рекомендуемая настройка для безопасности
  });

  return res;
}
