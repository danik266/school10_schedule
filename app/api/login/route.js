import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const ADMIN_USERNAME = "admin";
let HASHED_PASSWORD;

// Хэшируем пароль один раз при загрузке модуля
(async () => {
  HASHED_PASSWORD = await bcrypt.hash("bigass", 10);
})();

export async function POST(req) {
  const { username, password } = await req.json();

  // Проверяем логин
  if (username !== ADMIN_USERNAME) {
    return NextResponse.json({ success: false, message: "Неверный логин" }, { status: 401 });
  }

  // Проверяем пароль
  const isValid = await bcrypt.compare(password, HASHED_PASSWORD);
  if (!isValid) {
    return NextResponse.json({ success: false, message: "Неверный пароль" }, { status: 401 });
  }

  // Если всё ок — создаём токен
  const token = Buffer.from(`${username}:${Date.now()}`).toString("base64");

  const res = NextResponse.json({ success: true });
  res.cookies.set("token", token, { httpOnly: true, path: "/" });
  return res;
}
  