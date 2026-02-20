import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// === ПОЛУЧЕНИЕ ВСЕХ КАБИНЕТОВ (И УЧИТЕЛЕЙ ДЛЯ ПРИВЯЗКИ) ===
export async function GET() {
  try {
    const cabinets = await prisma.cabinets.findMany({
      select: {
        room_id: true,
        room_number: true,
        room_name: true,
      },
      orderBy: { room_number: "asc" },
    });

    // Нам также нужно загрузить учителей, чтобы на странице кабинетов
    // мы видели, за кем закреплен кабинет
    const teachers = await prisma.teachers.findMany();

    // Возвращаем объект с success: true, чтобы фронтенд понял, что всё ок
    return NextResponse.json({ success: true, cabinets, teachers });
  } catch (error) {
    console.error("Ошибка при получении кабинетов:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка при загрузке кабинетов" },
      { status: 500 },
    );
  }
}

// === СОЗДАНИЕ НОВОГО КАБИНЕТА ===
export async function POST(req) {
  try {
    const data = await req.json();

    // Проверяем, нет ли уже кабинета с таким номером
    const existing = await prisma.cabinets.findFirst({
      where: { room_number: data.room_number },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Кабинет с таким номером уже существует" },
        { status: 400 },
      );
    }

    const cabinet = await prisma.cabinets.create({
      data: {
        room_number: data.room_number,
        room_name: data.room_name || null,
      },
    });

    return NextResponse.json({ success: true, cabinet });
  } catch (error) {
    console.error("Ошибка при добавлении кабинета:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка при добавлении кабинета" },
      { status: 500 },
    );
  }
}

// === ПРИВЯЗКА КАБИНЕТА К УЧИТЕЛЮ ===
export async function PUT(req) {
  try {
    const { room_number, teacher_id } = await req.json();

    if (!room_number) {
      return NextResponse.json(
        { success: false, error: "Не указан номер кабинета" },
        { status: 400 },
      );
    }

    // 1. Сначала отвязываем этот кабинет от всех других учителей (чтобы не было дублей)
    await prisma.teachers.updateMany({
      where: { classroom: room_number },
      data: { classroom: null },
    });

    // 2. Если передан teacher_id, привязываем кабинет к новому учителю
    if (teacher_id) {
      await prisma.teachers.update({
        where: { teacher_id: teacher_id },
        data: { classroom: room_number },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Кабинет успешно закреплен",
    });
  } catch (error) {
    console.error("Ошибка при закреплении кабинета:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка при привязке кабинета" },
      { status: 500 },
    );
  }
}

// === УДАЛЕНИЕ КАБИНЕТА ===
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const room_id = searchParams.get("room_id");
    const room_number = searchParams.get("room_number");

    if (!room_id) {
      return NextResponse.json(
        { success: false, error: "Не указан ID кабинета" },
        { status: 400 },
      );
    }

    // 1. Удаляем сам кабинет из базы
    await prisma.cabinets.delete({
      where: { room_id },
    });

    // 2. Если у кабинета был номер, отвязываем его от учителей, чтобы у них не висел "мертвый" кабинет
    if (room_number) {
      await prisma.teachers.updateMany({
        where: { classroom: room_number },
        data: { classroom: null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при удалении кабинета:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка при удалении кабинета" },
      { status: 500 },
    );
  }
}
// === РЕДАКТИРОВАНИЕ КАБИНЕТА ===
export async function PATCH(req) {
  try {
    const { room_id, new_room_number, new_room_name, old_room_number } =
      await req.json();

    if (!room_id || !new_room_number) {
      return NextResponse.json(
        { success: false, error: "Необходимы ID и номер кабинета" },
        { status: 400 },
      );
    }

    // Если номер кабинета меняется, проверяем, не занят ли новый номер
    if (new_room_number !== old_room_number) {
      const existing = await prisma.cabinets.findFirst({
        where: { room_number: new_room_number },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Кабинет с таким номером уже существует" },
          { status: 400 },
        );
      }
    }

    // Обновляем сам кабинет
    await prisma.cabinets.update({
      where: { room_id: room_id },
      data: {
        room_number: new_room_number,
        room_name: new_room_name || null,
      },
    });

    // Если номер кабинета изменился, нужно обновить поле classroom у учителей,
    // которые были к нему привязаны, чтобы привязка не слетела
    if (new_room_number !== old_room_number) {
      await prisma.teachers.updateMany({
        where: { classroom: old_room_number },
        data: { classroom: new_room_number },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при редактировании кабинета:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка сервера при обновлении" },
      { status: 500 },
    );
  }
}
