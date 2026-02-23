import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST() {
  try {
    const all = await prisma.schedule.findMany({ orderBy: { schedule_id: "asc" } });
    const slots = {};
    for (const lesson of all) {
      const key = `${lesson.class_id}|${lesson.day_of_week}|${lesson.lesson_num}`;
      if (!slots[key]) slots[key] = [];
      slots[key].push(lesson.schedule_id);
    }
    const toDelete = [];
    for (const ids of Object.values(slots)) {
      if (ids.length > 2) toDelete.push(...ids.slice(2));
    }
    if (toDelete.length > 0) {
      await prisma.schedule.deleteMany({ where: { schedule_id: { in: toDelete } } });
    }
    return NextResponse.json({ success: true, deleted: toDelete.length });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}