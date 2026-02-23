import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Map JS getDay() (0=Sun) to schedule day names
const DAY_MAP = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

/**
 * Returns the set of day names (e.g. ["Monday", "Wednesday"]) that fall
 * within [startDate, endDate] (inclusive). Only weekdays are included.
 */
function getWeekdaysInRange(startDate, endDate) {
  const days = new Set();
  const current = new Date(startDate);
  const end = new Date(endDate);

  // Guard: no more than 30 days to avoid infinite loops
  let iterations = 0;
  while (current <= end && iterations < 30) {
    const dayNum = current.getDay();
    if (DAY_MAP[dayNum]) {
      days.add(DAY_MAP[dayNum]);
    }
    current.setDate(current.getDate() + 1);
    iterations++;
  }
  return Array.from(days);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { teacherId, startDate, endDate } = body;

    if (!teacherId || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: "Не указан учитель или период" },
        { status: 400 }
      );
    }

    const teacherIdNum = Number(teacherId);

    // 1. Get sick teacher info
    const sickTeacher = await prisma.teachers.findUnique({
      where: { teacher_id: teacherIdNum },
    });

    if (!sickTeacher) {
      return NextResponse.json(
        { success: false, message: "Учитель не найден" },
        { status: 404 }
      );
    }

    // 2. Determine which weekdays fall in the absence period
    const absentDays = getWeekdaysInRange(startDate, endDate);

    if (absentDays.length === 0) {
      return NextResponse.json(
        { success: false, message: "В указанном периоде нет рабочих дней (пн–пт)" },
        { status: 400 }
      );
    }

    // 3. Find all schedule entries for the sick teacher on those days
    const sickLessons = await prisma.schedule.findMany({
      where: {
        teacher_id: teacherIdNum,
        day_of_week: { in: absentDays },
      },
      include: { subjects: true },
    });

    if (sickLessons.length === 0) {
      return NextResponse.json({
        success: false,
        message: `У учителя ${sickTeacher.full_name} нет уроков в указанный период (${absentDays.join(", ")})`,
      });
    }

    // 4. For each lesson, find a free substitute teacher
    const allTeachers = await prisma.teachers.findMany();

    // Загружаем все активные замены — учителя которые сами сейчас на замене
    // (их teacher_id стоит вместо больного учителя в расписании)
    const activeLogs = await prisma.substitute_logs.findMany({
      where: { status: "success" },
      select: { sick_teacher_id: true, details: true },
    });
    // Собираем ID всех учителей-заместителей из активных замен
    const currentSubstituteIds = new Set();
    for (const log of activeLogs) {
      const details = log.details;
      if (details?.substitutions && Array.isArray(details.substitutions)) {
        for (const s of details.substitutions) {
          if (s.substituteTeacherId) currentSubstituteIds.add(s.substituteTeacherId);
        }
      }
    }

    // We load ALL schedule for these days and mutate it in-memory as we assign,
    // so we don't double-book a substitute teacher within the same run.
    const allSchedule = await prisma.schedule.findMany({
      where: { day_of_week: { in: absentDays } },
    });
    // busySlots tracks newly assigned substitutes: "teacherId|day|lessonNum"
    const busySlots = new Set();

    const substitutions = [];
    const failed = [];

    // Aliases: subjects in schedule that map to teacher subject fields
    // e.g. "Алгебра" and "Геометрия" are taught by "Математика" teachers
    const SUBJECT_ALIASES = {
      "алгебра": "математика",
      "геометрия": "математика",
      "алгебра және анализ бастамалары": "математика",
      "шетел тілі": "ағылшын тілі",
      "foreign language": "ағылшын тілі",
    };

    // Normalize a subject name to its canonical form for matching
    const normalizeSubject = (name) => {
      const lower = name.toLowerCase().trim();
      return SUBJECT_ALIASES[lower] || lower;
    };

    const subjectMatches = (teacherSubject, lessonSubject) => {
      const ts = normalizeSubject(teacherSubject);
      const ls = normalizeSubject(lessonSubject);
      return ts === ls || ls.includes(ts) || ts.includes(ls);
    };

    // Check if a teacher is free at a given day+lessonNum
    // (not in existing schedule for OTHER lessons, and not in busySlots from this run)
    const isFree = (teacher, day, lessonNum, excludeScheduleId) => {
      const slotKey = `${teacher.teacher_id}|${day}|${lessonNum}`;
      if (busySlots.has(slotKey)) return false;
      return !allSchedule.some(
        (s) =>
          s.teacher_id === teacher.teacher_id &&
          s.day_of_week === day &&
          s.lesson_num === lessonNum &&
          s.schedule_id !== excludeScheduleId
      );
    };

    for (const lesson of sickLessons) {
      const lessonSubjectName = lesson.subjects?.name || "";

      // Priority 1: same subject teachers, исключаем тех кто сам сейчас на замене
      const sameSubjectTeachers = allTeachers.filter(
        (t) =>
          t.teacher_id !== teacherIdNum &&
          !currentSubstituteIds.has(t.teacher_id) &&
          subjectMatches(t.subject, lessonSubjectName)
      );

      let freeTeacher = sameSubjectTeachers.find((t) =>
        isFree(t, lesson.day_of_week, lesson.lesson_num, lesson.schedule_id)
      );

      // Priority 2: fallback — ANY teacher who is free at this slot
      // (они могут присматривать даже если не того же предмета),
      // но тоже исключаем тех кто сам на замене
      if (!freeTeacher) {
        freeTeacher = allTeachers.find(
          (t) =>
            t.teacher_id !== teacherIdNum &&
            !currentSubstituteIds.has(t.teacher_id) &&
            isFree(t, lesson.day_of_week, lesson.lesson_num, lesson.schedule_id)
        );
      }

      if (freeTeacher) {
        // Mark this slot as taken immediately so next iteration sees it
        busySlots.add(`${freeTeacher.teacher_id}|${lesson.day_of_week}|${lesson.lesson_num}`);
        const isSameSubject = subjectMatches(freeTeacher.subject, lessonSubjectName);
        substitutions.push({
          scheduleId: lesson.schedule_id,
          substituteTeacherId: freeTeacher.teacher_id,
          substituteName: freeTeacher.full_name,
          substituteSubject: freeTeacher.subject,
          day: lesson.day_of_week,
          lessonNum: lesson.lesson_num,
          subject: lessonSubjectName,
          isSameSubject,
        });
      } else {
        failed.push({
          day: lesson.day_of_week,
          lessonNum: lesson.lesson_num,
          subject: lessonSubjectName,
          reason: "Все учителя заняты в этот слот",
        });
      }
    }

    // 5. Apply substitutions in DB
    for (const sub of substitutions) {
      await prisma.schedule.update({
        where: { schedule_id: sub.scheduleId },
        data: { teacher_id: sub.substituteTeacherId },
      });
    }

    const message =
      substitutions.length > 0
        ? `Назначено замен: ${substitutions.length}. Не удалось найти замену для ${failed.length} урок(ов).`
        : `Не удалось найти замену ни для одного урока (${failed.length} уроков).`;

    // 6. Save log to DB
    try {
      await prisma.substitute_logs.create({
        data: {
          sick_teacher_id:   teacherIdNum,
          sick_teacher_name: sickTeacher.full_name,
          start_date:        startDate,
          end_date:          endDate,
          status:            substitutions.length > 0 ? "success" : "error",
          total_lessons:     sickLessons.length,
          substituted:       substitutions.length,
          failed:            failed.length,
          details:           { substitutions, failed },
        },
      });
    } catch (logErr) {
      console.error("Не удалось сохранить лог замены:", logErr.message);
    }

    return NextResponse.json({
      success: substitutions.length > 0,
      message,
      substitutions,
      failed,
    });
  } catch (error) {
    console.error("Ошибка substitute-teacher:", error);
    return NextResponse.json(
      { success: false, message: "Внутренняя ошибка сервера: " + error.message },
      { status: 500 }
    );
  }
}