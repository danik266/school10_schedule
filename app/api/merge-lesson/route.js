import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req) {
  const { schedule_id } = await req.json();
  if (!schedule_id) return new Response(JSON.stringify({ success: false, error: "Нет schedule_id" }), { status: 400 });

  try {
    const lesson = await prisma.schedule.findUnique({ where: { schedule_id } });
    if (!lesson) return new Response(JSON.stringify({ success: false, error: "Урок не найден" }), { status: 404 });

    const subgroups = await prisma.schedule.findMany({
      where: {
        class_id: lesson.class_id,
        day_of_week: lesson.day_of_week,
        lesson_num: lesson.lesson_num,
        subject_id: lesson.subject_id
      },
      orderBy: { schedule_id: "asc" }
    });

    if (subgroups.length <= 1) return new Response(JSON.stringify({ success: false, error: "Нет подгрупп для объединения" }), { status: 400 });

    const idsToDelete = subgroups.slice(1).map(s => s.schedule_id);
    await prisma.schedule.deleteMany({ where: { schedule_id: { in: idsToDelete } } });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
