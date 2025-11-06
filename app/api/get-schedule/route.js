import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const schedule = await prisma.schedule.findMany({
      include: {
        classes: true,
        teachers: true,
        cabinets: true,
        subjects: true,
      },
    });

    const teachers = await prisma.teachers.findMany();

    // Формируем удобную структуру для фронта
    const formatted = {};

    for (const lesson of schedule) {
      const className = lesson.classes.class_name;
      const day = lesson.day_of_week;

      if (!formatted[className]) {
        formatted[className] = { class_name: className, days: {} };
      }
      if (!formatted[className].days[day]) {
        formatted[className].days[day] = [];
      }

      formatted[className].days[day].push({
        schedule_id: lesson.schedule_id,
        subject: lesson.subjects.name,
        teacher: lesson.teachers?.name || "—",
        teacher_id: lesson.teacher_id,
        room: lesson.cabinets?.room_number || "—",
        lesson_num: lesson.lesson_num,
      });
    }

    // Сортируем по номеру урока
    for (const cls of Object.values(formatted)) {
      for (const day of Object.keys(cls.days)) {
        cls.days[day].sort((a, b) => a.lesson_num - b.lesson_num);
      }
    }

    return new Response(
      JSON.stringify({ success: true, schedule: formatted, teachers }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Ошибка в /api/get-schedule:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
