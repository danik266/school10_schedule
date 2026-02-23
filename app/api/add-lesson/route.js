import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(request) {
  try {
    const { class_id, subject_id, teacher_id, room_id, day_of_week, lesson_num, year } = await request.json();

    if (!class_id || !subject_id || !day_of_week || !lesson_num) {
      return NextResponse.json({ success: false, error: "Недостаточно данных" }, { status: 400 });
    }

    // ── Проверяем: сколько уже уроков в этом слоте у этого класса ──
    const existing = await prisma.schedule.findMany({
      where: {
        class_id:    Number(class_id),
        day_of_week: day_of_week,
        lesson_num:  Number(lesson_num),
      },
    });

    if (existing.length >= 2) {
      return NextResponse.json({
        success: false,
        error: "В этом уроке уже 2 подгруппы — нельзя добавить ещё один урок"
      }, { status: 400 });
    }

    // ── Проверяем: не занят ли учитель в этот слот у другого класса ──
    if (teacher_id) {
      const teacherBusy = await prisma.schedule.findFirst({
        where: {
          teacher_id:  Number(teacher_id),
          day_of_week: day_of_week,
          lesson_num:  Number(lesson_num),
        },
      });
      if (teacherBusy) {
        return NextResponse.json({
          success: false,
          error: "Этот учитель уже занят в данный урок"
        }, { status: 400 });
      }
    }

    const newLesson = await prisma.schedule.create({
      data: {
        class_id:    Number(class_id),
        subject_id:  Number(subject_id),
        teacher_id:  Number(teacher_id),
        room_id:     Number(room_id),
        day_of_week,
        lesson_num:  Number(lesson_num),
        year:        year || new Date().getFullYear(),
      },
    });

    return NextResponse.json({ success: true, lesson: newLesson });
  } catch (error) {
    console.error("Ошибка add-lesson:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}