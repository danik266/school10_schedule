import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req) {
  const { schedule_id } = await req.json();
  if (!schedule_id) return new Response(JSON.stringify({ success: false, error: "Нет schedule_id" }), { status: 400 });

  try {
    const lesson = await prisma.schedule.findUnique({ where: { schedule_id } });
    if (!lesson) return new Response(JSON.stringify({ success: false, error: "Урок не найден" }), { status: 404 });

    // создаём вторую подгруппу с тем же предметом и учителем
    await prisma.schedule.create({
      data: {
        class_id: lesson.class_id,
        subject_id: lesson.subject_id,
        teacher_id: lesson.teacher_id,
        room_id: lesson.room_id,
        day_of_week: lesson.day_of_week,
        lesson_num: lesson.lesson_num,
        year: lesson.year,
      }
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
