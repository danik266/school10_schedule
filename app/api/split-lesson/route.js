import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(req) {
  const { schedule_id } = await req.json();
  if (!schedule_id) return new Response(JSON.stringify({ success: false, error: "Нет schedule_id" }), { status: 400 });

  try {
    const lesson = await prisma.schedule.findUnique({ where: { schedule_id } });
    if (!lesson) return new Response(JSON.stringify({ success: false, error: "Урок не найден" }), { status: 404 });

    // ── Проверяем: сколько уже подгрупп в этом слоте ──
    const existing = await prisma.schedule.findMany({
      where: {
        class_id:    lesson.class_id,
        day_of_week: lesson.day_of_week,
        lesson_num:  lesson.lesson_num,
      },
    });

    if (existing.length >= 2) {
      return new Response(
        JSON.stringify({ success: false, error: "Нельзя иметь больше 2 подгрупп в одном уроке" }),
        { status: 400 }
      );
    }

    // Находим другой кабинет для второй подгруппы
    const allCabinets = await prisma.cabinets.findMany();
    const otherRoom = allCabinets.find(c => c.room_id !== lesson.room_id) || { room_id: lesson.room_id };

    await prisma.schedule.create({
      data: {
        class_id:    lesson.class_id,
        subject_id:  lesson.subject_id,
        teacher_id:  lesson.teacher_id,
        room_id:     otherRoom.room_id,
        day_of_week: lesson.day_of_week,
        lesson_num:  lesson.lesson_num,
        year:        lesson.year,
      },
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}