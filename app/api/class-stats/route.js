import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = Number(searchParams.get("classId"));
    if (!classId) return Response.json({ error: "classId required" }, { status: 400 });

    const studyPlans = await prisma.study_plan.findMany({
      where: { class_id: classId },
      include: { subjects: { select: { name: true } } },
    });

    const scheduleRows = await prisma.schedule.findMany({
      where: { class_id: classId },
      include: { subjects: { select: { name: true } } },
      orderBy: { schedule_id: "asc" },
    });

    // Для каждого слота (day+lesson_num) узнаём все subject_id
    const slotSubjectIds = {}; // slotKey -> Set<subject_id>
    for (const row of scheduleRows) {
      const key = `${row.day_of_week}_${row.lesson_num}`;
      if (!slotSubjectIds[key]) slotSubjectIds[key] = new Set();
      slotSubjectIds[key].add(row.subject_id);
    }

    // Для каждого предмета собираем слоты и их тип
    // "full" = предмет — единственный в слоте (или занимает все места)
    // "shared" = предмет делит слот с другим предметом (подгруппа)
    const bySubject = {}; // subject_id -> { name, fullSlots: Set, sharedSlots: Set }
    for (const row of scheduleRows) {
      const sid = row.subject_id;
      const key = `${row.day_of_week}_${row.lesson_num}`;
      if (!bySubject[sid]) bySubject[sid] = { name: row.subjects.name, fullSlots: new Set(), sharedSlots: new Set() };
      const othersInSlot = [...slotSubjectIds[key]].filter(s => s !== sid);
      if (othersInSlot.length === 0) {
        bySubject[sid].fullSlots.add(key);
      } else {
        bySubject[sid].sharedSlots.add(key);
      }
    }

    // Считаем эффективные уроки:
    // - Каждый "full" слот = 1 урок
    // - "shared" слоты: если предмет X делит слот с предметом Y,
    //   то это подгруппная структура. 
    //   Каждый такой shared слот = 1 урок (подгруппа класса всё равно имеет урок).
    //   НО: если предмет встречается в 2 shared слотах с ОДНИМ И ТЕМ ЖЕ партнёром —
    //   это значит подгруппы разнесены (П1 в слоте А, П2 в слоте Б) = считаем как 1 урок.

    const computeActual = (info, sid) => {
      let count = info.fullSlots.size;

      // Для shared слотов: группируем по "партнёру" (другому предмету в слоте)
      // Если 2 shared слота имеют одинакового партнёра — это пара подгрупп = 1 урок
      // Если 2 shared слота имеют разных партнёров — это 2 разных урока
      const partnerToSlots = {}; // partnerSubjectId -> [slotKeys]
      for (const slotKey of info.sharedSlots) {
        const partners = [...slotSubjectIds[slotKey]].filter(s => s !== sid);
        const partnerKey = partners.sort().join(",");
        if (!partnerToSlots[partnerKey]) partnerToSlots[partnerKey] = [];
        partnerToSlots[partnerKey].push(slotKey);
      }

      for (const [, slots] of Object.entries(partnerToSlots)) {
        // Каждая пара слотов с одним партнёром = 1 урок (разнесённые подгруппы)
        // Одиночный слот без пары = 1 урок
        // Т.е. ceil(slots.length / 2) уроков
        count += Math.ceil(slots.length / 2);
      }

      return count;
    };

    const subjects = studyPlans.map((sp) => {
      const planned = Number(sp.hours_per_week);
      const info = bySubject[sp.subject_id] || { fullSlots: new Set(), sharedSlots: new Set() };
      const actual = computeActual(info, sp.subject_id);
      const isBiweekly = planned % 1 !== 0;
      const effectivePlanned = isBiweekly ? Math.ceil(planned) : planned;
      const diff = actual - effectivePlanned;
      const ok = diff === 0;
      return { subject_id: sp.subject_id, name: sp.subjects.name, planned, actual, diff, ok, biweekly: isBiweekly };
    });

    const planSubjectIds = new Set(studyPlans.map((sp) => sp.subject_id));
    const extra = Object.entries(bySubject)
      .filter(([sid]) => !planSubjectIds.has(Number(sid)))
      .map(([sid, info]) => {
        const actual = computeActual(info, Number(sid));
        return { subject_id: Number(sid), name: info.name, planned: 0, actual, diff: actual, ok: false, biweekly: false };
      });

    const allSubjects = [...subjects, ...extra];
    const totalPlanned = allSubjects.reduce((s, x) => s + x.planned, 0);
    const allSlots = new Set();
    for (const row of scheduleRows) allSlots.add(`${row.subject_id}_${row.day_of_week}_${row.lesson_num}`);
    const totalActual = allSlots.size;
    const issuesCount = allSubjects.filter((x) => !x.ok).length;

    return Response.json({ success: true, subjects: allSubjects, totalPlanned, totalActual, issuesCount });
  } catch (err) {
    console.error("class-stats GET error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}