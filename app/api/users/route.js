import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { login, password, role } = await req.json();

    if (!login || !password) {
      return NextResponse.json(
        { success: false, message: "Заполните все поля" },
        { status: 400 },
      );
    }

    // Проверяем, вдруг такой логин уже есть
    const existingUser = await prisma.users.findFirst({ where: { login } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Этот логин уже занят" },
        { status: 400 },
      );
    }

    // Правильно шифруем пароль средствами самого сайта
    const hashedPassword = await bcrypt.hash(password, 10);

    // Сохраняем в базу
    await prisma.users.create({
      data: {
        login,
        password: hashedPassword,
        role: role || "user",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Пользователь успешно создан!",
    });
  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Ошибка при создании" },
      { status: 500 },
    );
  }
}
// === ДОБАВЬ ЭТОТ КОД ВНИЗ ФАЙЛА ===

export async function GET() {
  try {
    // Получаем всех пользователей из базы данных
    const users = await prisma.users.findMany({
      select: {
        id: true,
        login: true,
        role: true,
        password: true, // Выведет зашифрованные пароли (хэши)
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return NextResponse.json(
      { message: "Ошибка при загрузке списка пользователей" },
      { status: 500 },
    );
  }
}
