import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// GET /api/class-stats?classId=123
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = Number(searchParams.get("classId"));

    if (!classId) {
      return Response.json({ error: "classId required" }, { status: 400 });
    }

    const studyPlans = await prisma.study_plan.findMany({
      where: { class_id: classId },
      include: { subjects: { select: { name: true } } },
    });

    const scheduleRows = await prisma.schedule.findMany({
      where: { class_id: classId },
      include: { subjects: { select: { name: true } } },
    });

    // Считаем уникальные слоты (день + номер урока) по subject_id.
    // Подгруппы дают 2 строки на один слот — считаем слот один раз.
    const actualBySubject = {};
    for (const row of scheduleRows) {
      const sid = row.subject_id;
      if (!actualBySubject[sid]) {
        actualBySubject[sid] = { name: row.subjects.name, slots: new Set() };
      }
      actualBySubject[sid].slots.add(`${row.day_of_week}_${row.lesson_num}`);
    }

    const subjects = studyPlans.map((sp) => {
      const planned = Number(sp.hours_per_week);
      const actual = actualBySubject[sp.subject_id]?.slots.size || 0;

      // Дробные часы (0.5 = раз в 2 недели):
      // Если план дробный и факт >= 1 — считаем нормой (урок стоит раз в неделю
      // чередуясь, 1 слот в расписании — это корректно)
      const isBiweekly = planned % 1 !== 0; // не целое число
      const effectivePlanned = isBiweekly ? Math.ceil(planned) : planned;
      const diff = actual - effectivePlanned;
      const ok = diff === 0;

      return {
        subject_id: sp.subject_id,
        name: sp.subjects.name,
        planned,           // оригинальное значение из БД (может быть 0.5)
        actual,
        diff,
        ok,
        biweekly: isBiweekly, // флаг для фронтенда
      };
    });

    // Предметы в расписании, которых нет в учебном плане
    const planSubjectIds = new Set(studyPlans.map((sp) => sp.subject_id));
    const extra = Object.entries(actualBySubject)
      .filter(([sid]) => !planSubjectIds.has(Number(sid)))
      .map(([sid, v]) => ({
        subject_id: Number(sid),
        name: v.name,
        planned: 0,
        actual: v.slots.size,
        diff: v.slots.size,
        ok: false,
        biweekly: false,
      }));

    const allSubjects = [...subjects, ...extra];
    const totalPlanned = allSubjects.reduce((s, x) => s + x.planned, 0);

    const allSlots = new Set();
    for (const row of scheduleRows) {
      allSlots.add(`${row.subject_id}_${row.day_of_week}_${row.lesson_num}`);
    }
    const totalActual = allSlots.size;
    const issuesCount = allSubjects.filter((x) => !x.ok).length;

    return Response.json({
      success: true,
      subjects: allSubjects,
      totalPlanned,
      totalActual,
      issuesCount,
    });
  } catch (err) {
    console.error("class-stats GET error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}