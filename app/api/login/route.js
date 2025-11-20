import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { login, password } = await req.json();

    if (!login || !password) {
      return NextResponse.json({ success: false, message: "Пустой логин или пароль" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({ where: { login } });

    if (!user) {
      return NextResponse.json({ success: false, message: "Неверный логин или пароль" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ success: false, message: "Неверный логин или пароль" }, { status: 401 });
    }

    // Возвращаем просто success, без cookie
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return NextResponse.json({ success: false, message: "Ошибка сервера" }, { status: 500 });
  }
}
