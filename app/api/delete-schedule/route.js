import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// DELETE /api/delete-schedule — удаляет всё расписание
export async function DELETE() {
  try {
    const { count } = await prisma.schedule.deleteMany({});
    return new Response(JSON.stringify({ success: true, deleted: count }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}