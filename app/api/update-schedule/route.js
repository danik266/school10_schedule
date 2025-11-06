import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { schedule_id, teacher_id, day_of_week, lesson_num } = await req.json();

    // ✅ Преобразуем teacher_id и schedule_id в числа
    const teacherId = Number(teacher_id);
    const scheduleId = Number(schedule_id);

    // Проверяем, занят ли уже этот преподаватель в то же время
    const conflict = await prisma.schedule.findFirst({
      where: {
        teacher_id: teacherId,
        day_of_week,
        lesson_num,
      },
      include: {
        classes: true,
        teachers: true,
      },
    });

    if (conflict) {
      return new Response(
        JSON.stringify({
          success: false,
          conflict: {
            class_name: conflict.classes.class_name,
            teacher_name: conflict.teachers.name,
          },
        }),
        { status: 400 }
      );
    }

    // Обновляем учителя в расписании
    await prisma.schedule.update({
      where: { schedule_id: scheduleId },
      data: { teacher_id: teacherId },
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Ошибка обновления:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
