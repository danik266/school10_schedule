import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(req) {
  try {
    const { swapPairs, swapOrder } = await req.json();

    if (!swapPairs || !Array.isArray(swapPairs) || swapPairs.length < 2) {
      return Response.json({ success: false, error: "Нужно передать минимум 2 пары" }, { status: 400 });
    }

    // swapOrder: true — меняем СОДЕРЖИМОЕ двух записей в одном слоте местами
    // (subject, teacher, room), а не их позиции
    if (swapOrder) {
      const ids = swapPairs.map(p => Number(p.id));
      const lessons = await prisma.schedule.findMany({ where: { schedule_id: { in: ids } } });
      if (lessons.length !== 2) {
        return Response.json({ success: false, error: "Нужно ровно 2 урока для swap order" }, { status: 400 });
      }
      const [a, b] = lessons;
      await prisma.$transaction([
        prisma.schedule.update({
          where: { schedule_id: a.schedule_id },
          data: { subject_id: b.subject_id, teacher_id: b.teacher_id, room_id: b.room_id },
        }),
        prisma.schedule.update({
          where: { schedule_id: b.schedule_id },
          data: { subject_id: a.subject_id, teacher_id: a.teacher_id, room_id: a.room_id },
        }),
      ]);
      return Response.json({ success: true });
    }

    // Обычный swap: меняем позиции (day, lesson_num) атомарно
    const ids = swapPairs.map(p => Number(p.id));
    const lessons = await prisma.schedule.findMany({ where: { schedule_id: { in: ids } } });
    if (lessons.length !== ids.length) {
      return Response.json({ success: false, error: "Один или несколько уроков не найдены" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Шаг 1: временно перемещаем в несуществующие слоты
      for (let i = 0; i < swapPairs.length; i++) {
        await tx.schedule.update({
          where: { schedule_id: Number(swapPairs[i].id) },
          data: { lesson_num: 9990 + i, day_of_week: "Monday" },
        });
      }
      // Шаг 2: финальные позиции
      for (const pair of swapPairs) {
        await tx.schedule.update({
          where: { schedule_id: Number(pair.id) },
          data: { day_of_week: pair.day, lesson_num: Number(pair.lesson_num) },
        });
      }
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("swap-subgroup error:", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}