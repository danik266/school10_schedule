import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// GET /api/workload — нагрузка учителей из таблицы schedule
export async function GET() {
  try {
    const teachers = await prisma.teachers.findMany({
      orderBy: { teacher_id: "asc" },
    });

    // Агрегируем уроки из schedule по teacher_id, subject_id, day_of_week
    const scheduleRows = await prisma.schedule.findMany({
      include: {
        subjects: { select: { name: true, type: true } },
        classes: { select: { class_name: true } },
      },
    });

    // Строим map: teacherId => { subjects: { subjectId => { name, type, days: {}, total } } }
    const workloadMap = {};

    for (const row of scheduleRows) {
      const tid = row.teacher_id;
      const sid = row.subject_id;
      if (!workloadMap[tid]) workloadMap[tid] = { subjects: {} };
      if (!workloadMap[tid].subjects[sid]) {
        workloadMap[tid].subjects[sid] = {
          subject_id: sid,
          name: row.subjects.name,
          type: row.subjects.type || "required",
          days: { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 },
          total_lessons: 0,
        };
      }
      const dayKey = row.day_of_week; // "Monday", "Tuesday"...
      if (workloadMap[tid].subjects[sid].days[dayKey] !== undefined) {
        workloadMap[tid].subjects[sid].days[dayKey]++;
      }
      workloadMap[tid].subjects[sid].total_lessons++;
    }

    // Формируем ответ
    const result = teachers.map((t) => {
      const subjMap = workloadMap[t.teacher_id]?.subjects || {};
      const subjects = Object.values(subjMap);
      const total_hours = subjects.reduce((s, subj) => s + subj.total_lessons, 0);
      return {
        teacher_id: t.teacher_id,
        full_name: t.full_name,
        subject: t.subject,
        classroom: t.classroom,
        nuances: t.nuances || "",
        subjects,
        total_hours,
      };
    });

    return Response.json(result);
  } catch (err) {
    console.error("Workload GET error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/workload — обновить nuances (примечания) учителя
export async function PATCH(req) {
  try {
    const { teacher_id, nuances } = await req.json();
    if (!teacher_id) {
      return Response.json({ error: "teacher_id required" }, { status: 400 });
    }

    const NUANCES_MAP = {
      none: null,
      no_friday: "no_friday",
      no_monday: "no_monday",
      morning_only: "morning_only",
      afternoon_only: "afternoon_only",
      no_first_lesson: "no_first_lesson",
      no_last_lesson: "no_last_lesson",
    };

    const validNuance = NUANCES_MAP[nuances] !== undefined ? NUANCES_MAP[nuances] : nuances;

    const updated = await prisma.teachers.update({
      where: { teacher_id: Number(teacher_id) },
      data: { nuances: validNuance },
    });

    return Response.json({ success: true, teacher: updated });
  } catch (err) {
    console.error("Workload PATCH error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
