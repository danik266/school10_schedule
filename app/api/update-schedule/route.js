import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { schedule_id, teacher_id, room, day_of_week, lesson_num } = await req.json();

    const scheduleId = Number(schedule_id);
    const updates = {};

    // Обновляем преподавателя
    if (teacher_id !== undefined) {
      const teacherId = Number(teacher_id);
      const conflict = await prisma.schedule.findFirst({
        where: {
          teacher_id: teacherId,
          day_of_week,
          lesson_num,
          NOT: { schedule_id: scheduleId },
        },
        include: { classes: true, teachers: true },
      });

      if (conflict) {
        return new Response(JSON.stringify({
          success: false,
          conflict: {
            class_name: conflict.classes.class_name,
            teacher_name: conflict.teachers.full_name,
          },
        }), { status: 400 });
      }

      updates.teacher_id = teacherId;
    }

    // Обновляем кабинет
    if (room !== undefined) {
      const cabinet = await prisma.cabinets.findUnique({ where: { room_id: Number(room) } });
      if (!cabinet) {
        return new Response(JSON.stringify({ success: false, error: "Кабинет не найден" }), { status: 400 });
      }

      const isGym = (cabinet.room_name || "").toLowerCase().includes("спортзал");

      if (!isGym) {
        const roomConflict = await prisma.schedule.findFirst({
          where: {
            room_id: cabinet.room_id,
            day_of_week,
            lesson_num,
            NOT: { schedule_id: scheduleId },
          },
          include: { classes: true },
        });

        if (roomConflict) {
          return new Response(JSON.stringify({
            success: false,
            error: `Кабинет "${cabinet.room_number}" уже занят у класса ${roomConflict.classes.class_name} на этом уроке`,
          }), { status: 400 });
        }
      }

      updates.room_id = cabinet.room_id;
    }

    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Нет данных для обновления" }), { status: 400 });
    }

    await prisma.schedule.update({
      where: { schedule_id: scheduleId },
      data: updates,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error("Ошибка обновления:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
