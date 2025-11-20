import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    const login = username?.trim();
    const pass = password?.trim();

    if (!login || !pass) {
      return NextResponse.json(
        { success: false, message: "Пустой логин или пароль" },
        { status: 400 }
      );
    }

    // ищем пользователя без учета регистра
    const user = await prisma.users.findFirst({
      where: { login: { equals: login, mode: "insensitive" } },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    // сравниваем пароли строго
    if (user.password.trim() !== pass) {
      return NextResponse.json(
        { success: false, message: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    // создаем токен
    const token = Buffer.from(`${login}:${Date.now()}`).toString("base64");

    const response = NextResponse.json({ success: true });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
