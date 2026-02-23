import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Хранение настроек в памяти (в реальном проекте — в БД или файле)
// Используем глобальный объект для persistence между hot-reload
if (!globalForPrisma.scheduleSettings) {
  globalForPrisma.scheduleSettings = {
    max_lessons_junior: 8,
    max_lessons_senior: 9,
    hard_subjects_first: true,
    allow_windows: false,
    max_windows_per_day: 1,
  };
}

export async function GET() {
  return Response.json(globalForPrisma.scheduleSettings);
}

export async function POST(req) {
  try {
    const body = await req.json();
    globalForPrisma.scheduleSettings = {
      ...globalForPrisma.scheduleSettings,
      ...body,
    };
    return Response.json({ success: true, settings: globalForPrisma.scheduleSettings });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
