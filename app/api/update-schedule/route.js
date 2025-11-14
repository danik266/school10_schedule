import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export async function POST(req) {
  try {
    const { schedule_id, day_of_week, lesson_num, teacher_id, room_id } = await req.json();

    if (!schedule_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Недостаточно данных" }),
        { status: 400 }
      );
    }

    const lesson = await prisma.schedule.findUnique({
      where: { schedule_id: Number(schedule_id) },
    });

    if (!lesson) {
      return new Response(
        JSON.stringify({ success: false, error: "Урок не найден" }),
        { status: 404 }
      );
    }

    await prisma.schedule.update({
      where: { schedule_id: Number(schedule_id) },
      data: {
        day_of_week: day_of_week || lesson.day_of_week,
        lesson_num: lesson_num || lesson.lesson_num,
        teacher_id: teacher_id ? Number(teacher_id) : lesson.teacher_id,
        room_id: room_id ? Number(room_id) : lesson.room_id,
      },
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Ошибка обновления:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
