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

// GET — получить список учителей (с привязкой к классу)
export async function GET() {
  try {
    const teachers = await prisma.teachers.findMany({
      orderBy: { teacher_id: "asc" },
      include: {
        homeroom_class: {
          select: { class_id: true, class_name: true },
        },
        class_subjects: {
          include: {
            classes: {
              select: { class_id: true, class_name: true },
            },
            subjects: {
              select: { subject_id: true, name: true },
            },
          },
        },
      },
    });

    // Получаем все учебные планы для расчета часов
    const studyPlans = await prisma.study_plan.findMany({
      select: {
        class_id: true,
        subject_id: true,
        hours_per_week: true,
      },
    });

    // Создаем карту часов: "classId-subjectId" -> hours
    const hoursMap = {};
    studyPlans.forEach((plan) => {
      hoursMap[`${plan.class_id}-${plan.subject_id}`] = Number(plan.hours_per_week);
    });

    // Обогащаем данные учителей информацией о нагрузке
    const enrichedTeachers = teachers.map((t) => {
      let totalWorkload = 0;
      const subjectsInfo = t.class_subjects.map((cs) => {
        const hours = hoursMap[`${cs.class_id}-${cs.subject_id}`] || 0;
        totalWorkload += hours;
        return {
          class_name: cs.classes.class_name,
          subject_name: cs.subjects.name,
          hours: hours,
        };
      });

      return {
        ...t,
        total_workload: totalWorkload,
        subjects_info: subjectsInfo,
      };
    });

    return NextResponse.json(enrichedTeachers);
  } catch (error) {
    console.error("ОШИБКА GET:", error);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

// POST — добавить учителя
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
        subject: body.subject ? body.subject.trim() : "",
        classroom: body.classroom ? body.classroom.trim() : null,
        homeroom_class_id: body.homeroom_class_id ? Number(body.homeroom_class_id) : null,
      },
      include: {
        homeroom_class: {
          select: { class_id: true, class_name: true },
        },
      },
    });

    return NextResponse.json({ success: true, teacher: newTeacher });
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

// PATCH — обновить учителя
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, name, subject, classroom, homeroom_class_id } = body;

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
        subject: subject ? subject.trim() : "",
        classroom: classroom ? classroom.trim() : null,
        homeroom_class_id: homeroom_class_id ? Number(homeroom_class_id) : null,
      },
      include: {
        homeroom_class: {
          select: { class_id: true, class_name: true },
        },
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