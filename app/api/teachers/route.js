import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// GET — получить список учителей
export async function GET() {
  try {
    const teachers = await prisma.teachers.findMany({
      orderBy: { teacher_id: "asc" },
    });
    return NextResponse.json(teachers);
  } catch (error) {
    console.error("ОШИБКА GET:", error);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

// POST — добавить учителя (с ФИО и Предметом)
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: "Имя обязательно" },
        { status: 400 },
      );
    }

    const newTeacher = await prisma.teachers.create({
      data: {
        full_name: body.name.trim(),
        subject: body.subject ? body.subject.trim() : null, // Добавляем предмет
      },
    });

    return NextResponse.json({
      success: true,
      teacher: newTeacher,
    });
  } catch (error) {
    console.error("ОШИБКА POST:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка сохранения" },
      { status: 500 },
    );
  }
}

// DELETE — удалить учителя
export async function DELETE(request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "ID обязателен" },
        { status: 400 },
      );
    }
    await prisma.teachers.delete({
      where: { teacher_id: Number(body.id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ОШИБКА DELETE:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка удаления" },
      { status: 500 },
    );
  }
}
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, name, subject, classroom } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID обязателен" },
        { status: 400 },
      );
    }

    const updatedTeacher = await prisma.teachers.update({
      where: { teacher_id: Number(id) },
      data: {
        full_name: name.trim(),
        subject: subject ? subject.trim() : null,
        classroom: classroom ? classroom.trim() : null,
      },
    });

    return NextResponse.json({ success: true, teacher: updatedTeacher });
  } catch (error) {
    console.error("ОШИБКА PATCH:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка при обновлении" },
      { status: 500 },
    );
  }
}