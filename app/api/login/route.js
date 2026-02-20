import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { login, password } = await req.json();

    if (!login || !password) {
      return NextResponse.json(
        { success: false, message: "Пустой логин или пароль" },
        { status: 400 },
      );
    }

    const user = await prisma.users.findUnique({ where: { login } });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Неверный логин или пароль" },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Неверный логин или пароль" },
        { status: 401 },
      );
    }

    // Отдаем на фронтенд еще и роль на всякий случай
    const response = NextResponse.json({ success: true, role: user.role });

    // Кука с ID пользователя
    response.cookies.set({
      name: "user_id",
      value: String(user.id),
      path: "/",
      maxAge: 3600, // 1 час
    });

    // НОВАЯ КУКА: сохраняем роль пользователя
    response.cookies.set({
      name: "user_role",
      value: String(user.role || "user"),
      path: "/",
      maxAge: 3600, // 1 час
    });

    return response;
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Ошибка сервера" },
      { status: 500 },
    );
  }
}
