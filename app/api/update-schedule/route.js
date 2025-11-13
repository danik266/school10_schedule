import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { schedule_id, day_of_week, lesson_num, teacher_id, room_id } = await req.json();

    if (!schedule_id || !day_of_week || !lesson_num) {
      return new Response(
        JSON.stringify({ success: false, error: "Недостаточно данных" }),
        { status: 400 }
      );
    }

    const mainLesson = await prisma.schedule.findUnique({
      where: { schedule_id: Number(schedule_id) },
    });

    if (!mainLesson) {
      return new Response(
        JSON.stringify({ success: false, error: "Урок не найден" }),
        { status: 404 }
      );
    }

    // Ищем все подгруппы одного урока
    const relatedLessons = await prisma.schedule.findMany({
      where: {
        class_id: mainLesson.class_id,
        subject_id: mainLesson.subject_id,
        lesson_num: mainLesson.lesson_num,
        day_of_week: mainLesson.day_of_week,
      },
    });

    // Обновляем все подгруппы сразу
    await Promise.all(
      relatedLessons.map(l =>
        prisma.schedule.update({
          where: { schedule_id: l.schedule_id },
          data: {
            day_of_week,
            lesson_num,
            teacher_id: teacher_id ? Number(teacher_id) : l.teacher_id,
            room_id: room_id ? Number(room_id) : l.room_id,
          },
        })
      )
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Ошибка обновления:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
