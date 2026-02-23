import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET(req) {
  try {
    const schedule = await prisma.schedule.findMany({
      select: {
        schedule_id: true,
        lesson_num: true,
        day_of_week: true,
        year: true,
        class_id: true,
        teacher_id: true,
        subject_id: true,
        classes:  { select: { class_name: true } },
        subjects: { select: { name: true } },
        teachers: { select: { full_name: true } },
        cabinets: { select: { room_number: true } },
      },
      orderBy: [{ classes: { class_name: "asc" } }, { lesson_num: "asc" }],
    });

    const formatted = schedule.map((item) => ({
      id: item.schedule_id,
      schedule_id: item.schedule_id,
      class_id: item.class_id,
      teacher_id: item.teacher_id,
      subject_id: item.subject_id,
      group: item.classes.class_name,
      day_of_week: item.day_of_week,
      lesson_number: item.lesson_num,
      subject_name: item.subjects.name,
      teacher_name: item.teachers.full_name,
      room_number: item.cabinets.room_number,
    }));

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return new Response(
      JSON.stringify({ error: "Не удалось загрузить расписание" }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { class_id, subject_id, teacher_id, room_id, year, weekData } = data;

    const entries = Object.entries(weekData).flatMap(([day, count]) => {
      const num = Number(count);
      if (!num || num <= 0) return [];
      return Array.from({ length: num }, (_, i) => ({
        class_id,
        subject_id,
        teacher_id,
        room_id,
        year,
        day_of_week: day,
        lesson_num: i + 1,
      }));
    });

    if (entries.length === 0) {
      return new Response(JSON.stringify({ error: "Нет уроков" }), { status: 400 });
    }

    const created = await prisma.schedule.createMany({ data: entries });
    return new Response(JSON.stringify({ success: true, created }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) {
      return new Response(
        JSON.stringify({ error: "id не указан" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    await prisma.schedule.delete({ where: { schedule_id: Number(id) } });
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Ошибка при удалении" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}