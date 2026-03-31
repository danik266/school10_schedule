import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(req) {
  try {
    let classId = null;
    try { const body = await req.json(); classId = body.classId || null; } catch {}

    const all = await prisma.schedule.findMany({
      where: classId ? { class_id: Number(classId) } : {},
      orderBy: { schedule_id: "asc" }
    });

    // Шаг 1: группируем по слоту
    const slotMap = {}; // `classId|day|num` -> [lessons]
    for (const lesson of all) {
      const key = `${lesson.class_id}|${lesson.day_of_week}|${lesson.lesson_num}`;
      if (!slotMap[key]) slotMap[key] = [];
      slotMap[key].push(lesson);
    }

    const toDelete = [];

    // Удаляем лишние если > 2 в слоте (берём самые новые)
    for (const lessons of Object.values(slotMap)) {
      if (lessons.length > 2) {
        toDelete.push(...lessons.slice(2).map(l => l.schedule_id));
      }
    }

    if (toDelete.length > 0) {
      await prisma.schedule.deleteMany({ where: { schedule_id: { in: toDelete } } });
    }

    return NextResponse.json({ success: true, deleted: toDelete.length });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}