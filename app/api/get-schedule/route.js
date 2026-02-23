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

    const formatted = {};
    for (const lesson of schedule) {
      const className = lesson.classes.class_name;
      const day = lesson.day_of_week;

      if (!formatted[className]) formatted[className] = { class_name: className, class_id: lesson.class_id, days: {} };
      if (!formatted[className].days[day]) formatted[className].days[day] = [];

formatted[className].days[day].push({
  schedule_id: lesson.schedule_id,
  class_id: lesson.class_id,
  subject: lesson.subjects.name,
  teacher: lesson.teachers?.full_name || "—",
  teacher_id: lesson.teacher_id,
  room_id: lesson.room_id,
  room_number: lesson.cabinets?.room_number || "—",
  room_name: lesson.cabinets?.room_name || "",
  lesson_num: lesson.lesson_num,
});

    }

    // Сортировка по урокам
    for (const cls of Object.values(formatted)) {
      for (const day of Object.keys(cls.days)) {
        cls.days[day].sort((a, b) => a.lesson_num - b.lesson_num);
      }
    }

    return new Response(JSON.stringify({ success: true, schedule: formatted, teachers }), { status: 200 });
  } catch (error) {
    console.error("Ошибка в /api/get-schedule:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}