import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const ADMIN_USERNAME = "admin";
let HASHED_PASSWORD;

export async function POST(req) {
  const { username, password } = await req.json();

  // если хэш ещё не создан — создаём
  if (!HASHED_PASSWORD) {
    HASHED_PASSWORD = await bcrypt.hash("bigass", 10);
  }

  if (username !== ADMIN_USERNAME) {
    return NextResponse.json({ success: false, message: "Неверный логин" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, HASHED_PASSWORD);
  if (!isValid) {
    return NextResponse.json({ success: false, message: "Неверный пароль" }, { status: 401 });
  }

  const token = Buffer.from(`${username}:${Date.now()}`).toString("base64");
  const res = NextResponse.json({ success: true });
  res.cookies.set("token", token, { httpOnly: true, path: "/" });
  return res;
}
