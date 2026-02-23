import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// GET /api/snapshots — список всех снапшотов
export async function GET() {
  try {
    const snapshots = await prisma.schedule_snapshots.findMany({
      select: { id: true, name: true, created_at: true, rows_count: true },
      orderBy: { created_at: "desc" },
    });
    return new Response(JSON.stringify({ success: true, snapshots }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// POST /api/snapshots — сохранить текущее расписание как снапшот
// Body: { name: "Моё расписание" }
export async function POST(req) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return new Response(JSON.stringify({ error: "Укажите название" }), { status: 400 });
    }
    const rows = await prisma.schedule.findMany({
      select: {
        class_id: true, subject_id: true, teacher_id: true,
        room_id: true, day_of_week: true, lesson_num: true, year: true,
      },
    });
    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: "Расписание пустое — нечего сохранять" }), { status: 400 });
    }
    const snapshot = await prisma.schedule_snapshots.create({
      data: { name: name.trim(), rows_count: rows.length, data: rows },
    });
    return new Response(JSON.stringify({ success: true, id: snapshot.id }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// DELETE /api/snapshots — удалить снапшот
// Body: { id: 5 }
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    await prisma.schedule_snapshots.delete({ where: { id: Number(id) } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}