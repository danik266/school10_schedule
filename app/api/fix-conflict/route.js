import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Проверка совпадения предмета учителя с предметом урока
const subjectMatch = (teacherSubject, lessonSubject) => {
  if (!teacherSubject || !lessonSubject) return false;
  const t = teacherSubject.toLowerCase().trim();
  const l = lessonSubject.toLowerCase().trim();
  if (t === l || t.includes(l) || l.includes(t)) return true;
  const groups = [
    ["математик", "алгебр", "геометр", "анализ"],
    ["қазақ тіл", "қазақ әдеб", "казахск"],
    ["орыс тіл", "русск", "рус.яз", "орыс әдеб"],
    ["ағылшын", "шетел тіл", "английск", "foreign"],
    ["информатик", "ивт"],
    ["дене шыны", "физическ культ", "физкульт", "физра"],
    ["көркем еңбек", "труд", "технолог"],
    ["биолог"],
    ["тарих", "истор"],
    ["физик"],
    ["химия", "хими"],
    ["геогр"],
    ["музык"],
    ["жаратылыстану", "природовед"],
  ];
  for (const g of groups) {
    if (g.some(k => t.includes(k)) && g.some(k => l.includes(k))) return true;
  }
  return false;
};

const isTeacherFree = (cache, teacherId, day, num, excludeId) =>
  !cache.some(s => s.teacher_id === teacherId && s.day_of_week === day && s.lesson_num === num && s.schedule_id !== excludeId);

const isRoomFree = (cache, allCabinets, roomId, day, num, excludeId) => {
  const rn = ((allCabinets.find(c => c.room_id === roomId)?.room_name || "") +
              (allCabinets.find(c => c.room_id === roomId)?.room_number || "")).toLowerCase();
  const isGym = rn.includes("спортзал") || rn.includes("зал");
  if (isGym) {
    return cache.filter(s => s.room_id === roomId && s.day_of_week === day && s.lesson_num === num && s.schedule_id !== excludeId).length < 4;
  }
  return !cache.some(s => s.room_id === roomId && s.day_of_week === day && s.lesson_num === num && s.schedule_id !== excludeId);
};

const isClassFree = (cache, classId, day, num, excludeId) =>
  !cache.some(s => s.class_id === classId && s.day_of_week === day && s.lesson_num === num && s.schedule_id !== excludeId);

// Проверка: нет дубля предмета в этот день.
// Для подгрупп (2 записи на один слот) — считаем уникальные слоты, не строки.
// Если сдвигаемый урок — подгруппа, разрешаем ровно 1 уникальный слот в день (второй — это мы сами).
const noSubjectDoubleInDay = (cache, classId, subjectId, day, excludeId) => {
  const existing = cache.filter(
    s => s.class_id === classId && s.subject_id === subjectId &&
         s.day_of_week === day && s.schedule_id !== excludeId
  );
  // Смотрим на уникальные слоты (день+номер), не строки
  const uniqueSlots = new Set(existing.map(s => s.lesson_num));
  return uniqueSlots.size === 0;
};

// ── Проверка учебного плана ──────────────────────────────────────────────────
// studyPlanMap: Map<classId, Map<subjectId, hoursPerWeek>>
// Считаем сколько уникальных слотов (день+номер) уже занято этим предметом,
// не считая excludeId. Если >=plan — нельзя добавлять.
const withinStudyPlan = (cache, studyPlanMap, classId, subjectId, excludeId) => {
  const plan = studyPlanMap.get(classId)?.get(subjectId);
  if (plan === undefined) return true; // предмет не в плане — не ограничиваем здесь
  const effectivePlan = Math.ceil(plan); // 0.5 → 1
  // Считаем уникальные слоты без excludeId
  const slots = new Set(
    cache
      .filter(s => s.class_id === classId && s.subject_id === subjectId && s.schedule_id !== excludeId)
      .map(s => `${s.day_of_week}_${s.lesson_num}`)
  );
  // slots.size — это сколько слотов останется после удаления excludeId.
  // Когда мы ПЕРЕМЕЩАЕМ урок, excludeId убирается из старого места и добавляется в новое.
  // Итого после перемещения: slots.size + 1 (новый слот).
  // Условие: slots.size + 1 <= effectivePlan
  return slots.size + 1 <= effectivePlan;
};

// Обновить кэш после изменения
const updateCache = (cache, scheduleId, changes) => {
  const i = cache.findIndex(s => s.schedule_id === scheduleId);
  if (i !== -1) cache[i] = { ...cache[i], ...changes };
};

/**
 * Умный фикс конкретного урока с учётом учебного плана:
 * 1. Найти свободного учителя ТОГО ЖЕ предмета в этом же слоте → сменить учителя
 *    (план не меняется — урок остаётся в том же слоте)
 * 2. Найти слот где текущий учитель свободен → переставить урок
 * 3. Найти слот где есть учитель того же предмета → переставить + сменить учителя
 * 4. Любой свободный слот (крайний случай)
 *
 * При ПЕРЕМЕЩЕНИИ (шаги 2-4) проверяем:
 *  - класс свободен в новом слоте
 *  - нет второго урока ЭТОГО предмета в тот же день
 *  - перемещение не превысит норму часов из учебного плана
 */
const smartFix = async (lesson, cache, allTeachers, allCabinets, studyPlanMap) => {
  const { schedule_id, class_id, subject_id, teacher_id, day_of_week, lesson_num, room_id } = lesson;
  const subjectName = lesson.subjects?.name || "";

  const sameSubjectTeachers = allTeachers.filter(t => t.teacher_id !== teacher_id && subjectMatch(t.subject, subjectName));

  // ── 1. Свободный учитель того же предмета в ЭТОМ слоте ──────────────────
  // Урок остаётся на месте — план не нарушается, проверять withinStudyPlan не нужно
  const freeInSlot = sameSubjectTeachers.find(t => isTeacherFree(cache, t.teacher_id, day_of_week, lesson_num, schedule_id));
  if (freeInSlot) {
    await prisma.schedule.update({ where: { schedule_id }, data: { teacher_id: freeInSlot.teacher_id } });
    updateCache(cache, schedule_id, { teacher_id: freeInSlot.teacher_id });
    return { action: "teacher_replaced", teacher: freeInSlot.full_name };
  }

  // Вспомогательная: проверить все условия для перемещения в слот (d, n)
  const canMoveTo = (d, n, newTeacherId = teacher_id) => {
    if (d === day_of_week && n === lesson_num) return false;
    if (!isTeacherFree(cache, newTeacherId, d, n, schedule_id)) return false;
    if (!isClassFree(cache, class_id, d, n, schedule_id)) return false;
    if (!noSubjectDoubleInDay(cache, class_id, subject_id, d, schedule_id)) return false;
    // ── Проверка учебного плана ──
    if (!withinStudyPlan(cache, studyPlanMap, class_id, subject_id, schedule_id)) return false;
    return true;
  };

  // ── 2. Переставить урок в слот где ТЕКУЩИЙ учитель свободен ─────────────
  for (const d of DAYS) {
    for (let n = 1; n <= 8; n++) {
      if (!canMoveTo(d, n, teacher_id)) continue;
      const freeRoom = allCabinets.find(c => isRoomFree(cache, allCabinets, c.room_id, d, n, schedule_id));
      const newRoomId = freeRoom?.room_id || room_id;
      await prisma.schedule.update({ where: { schedule_id }, data: { day_of_week: d, lesson_num: n, room_id: newRoomId } });
      updateCache(cache, schedule_id, { day_of_week: d, lesson_num: n, room_id: newRoomId });
      return { action: "moved", day: d, lesson_num: n };
    }
  }

  // ── 3. Найти слот с учителем того же предмета ────────────────────────────
  for (const t of sameSubjectTeachers) {
    for (const d of DAYS) {
      for (let n = 1; n <= 8; n++) {
        if (!canMoveTo(d, n, t.teacher_id)) continue;
        const freeRoom = allCabinets.find(c => isRoomFree(cache, allCabinets, c.room_id, d, n, schedule_id));
        const newRoomId = freeRoom?.room_id || room_id;
        await prisma.schedule.update({ where: { schedule_id }, data: { day_of_week: d, lesson_num: n, teacher_id: t.teacher_id, room_id: newRoomId } });
        updateCache(cache, schedule_id, { day_of_week: d, lesson_num: n, teacher_id: t.teacher_id, room_id: newRoomId });
        return { action: "moved_with_subject_teacher", teacher: t.full_name, day: d, lesson_num: n };
      }
    }
  }

  // ── 4. Любой свободный слот (крайний случай) — план всё равно проверяем ──
  for (const d of DAYS) {
    for (let n = 1; n <= 8; n++) {
      if (d === day_of_week && n === lesson_num) continue;
      if (!isClassFree(cache, class_id, d, n, schedule_id)) continue;
      if (!noSubjectDoubleInDay(cache, class_id, subject_id, d, schedule_id)) continue;
      if (!withinStudyPlan(cache, studyPlanMap, class_id, subject_id, schedule_id)) continue;
      const freeRoom = allCabinets.find(c => isRoomFree(cache, allCabinets, c.room_id, d, n, schedule_id));
      const newRoomId = freeRoom?.room_id || room_id;
      await prisma.schedule.update({ where: { schedule_id }, data: { day_of_week: d, lesson_num: n, room_id: newRoomId } });
      updateCache(cache, schedule_id, { day_of_week: d, lesson_num: n, room_id: newRoomId });
      return { action: "moved_any_slot", day: d, lesson_num: n };
    }
  }

  return null;
};

// Строим Map<classId, Map<subjectId, hoursPerWeek>> из учебного плана
const buildStudyPlanMap = async () => {
  const plans = await prisma.study_plan.findMany();
  const map = new Map();
  for (const p of plans) {
    if (!map.has(p.class_id)) map.set(p.class_id, new Map());
    map.get(p.class_id).set(p.subject_id, Number(p.hours_per_week));
  }
  return map;
};

export async function POST(req) {
  try {
    const { type, day, lesson_num, class_name } = await req.json();

    // Загружаем всё в кэш — обновляем его в памяти чтобы не создавать новые конфликты
    const cache = await prisma.schedule.findMany({
      include: { classes: true, subjects: true, teachers: true, cabinets: true },
    });
    const allCabinets = await prisma.cabinets.findMany();
    const allTeachers = await prisma.teachers.findMany();

    // ── Загружаем учебный план ──────────────────────────────────────────────
    const studyPlanMap = await buildStudyPlanMap();

    const results = [];

    if (type === "teacher_double") {
      const inSlot = cache.filter(s => s.day_of_week === day && s.lesson_num === lesson_num);
      const byTeacher = {};
      for (const s of inSlot) {
        if (!byTeacher[s.teacher_id]) byTeacher[s.teacher_id] = [];
        byTeacher[s.teacher_id].push(s);
      }
      for (const group of Object.values(byTeacher)) {
        if (group.length < 2) continue;
        for (let i = 1; i < group.length; i++) {
          results.push(await smartFix(group[i], cache, allTeachers, allCabinets, studyPlanMap));
        }
      }
    }

    else if (type === "room_double") {
      const inSlot = cache.filter(s => s.day_of_week === day && s.lesson_num === lesson_num);
      const byRoom = {};
      for (const s of inSlot) {
        if (!byRoom[s.room_id]) byRoom[s.room_id] = [];
        byRoom[s.room_id].push(s);
      }
      for (const [rid, group] of Object.entries(byRoom)) {
        const rn = ((allCabinets.find(c => c.room_id === parseInt(rid))?.room_name || "") +
                    (allCabinets.find(c => c.room_id === parseInt(rid))?.room_number || "")).toLowerCase();
        const limit = (rn.includes("спортзал") || rn.includes("зал")) ? 4 : 1;
        if (group.length <= limit) continue;
        for (let i = limit; i < group.length; i++) {
          // Сначала просто другой кабинет (план не меняется)
          const freeRoom = allCabinets.find(c =>
            c.room_id !== parseInt(rid) &&
            isRoomFree(cache, allCabinets, c.room_id, day, lesson_num, group[i].schedule_id)
          );
          if (freeRoom) {
            await prisma.schedule.update({ where: { schedule_id: group[i].schedule_id }, data: { room_id: freeRoom.room_id } });
            updateCache(cache, group[i].schedule_id, { room_id: freeRoom.room_id });
            results.push({ action: "room_changed" });
          } else {
            // Кабинет не нашли — переставляем урок
            results.push(await smartFix(group[i], cache, allTeachers, allCabinets, studyPlanMap));
          }
        }
      }
    }

    else if (type === "room_conflict") {
      const cls = cache.find(s => s.classes?.class_name === class_name);
      if (!cls) return new Response(JSON.stringify({ success: false, error: "Класс не найден" }), { status: 404 });
      const subgroups = cache.filter(s => s.class_id === cls.class_id && s.day_of_week === day && s.lesson_num === lesson_num);
      const seen = {};
      for (const s of subgroups) {
        if (seen[s.room_id]) {
          const freeRoom = allCabinets.find(c => c.room_id !== s.room_id && isRoomFree(cache, allCabinets, c.room_id, day, lesson_num, s.schedule_id));
          if (freeRoom) {
            await prisma.schedule.update({ where: { schedule_id: s.schedule_id }, data: { room_id: freeRoom.room_id } });
            updateCache(cache, s.schedule_id, { room_id: freeRoom.room_id });
            results.push({ action: "room_changed" });
          }
        } else { seen[s.room_id] = s; }
      }
    }

    else if (type === "teacher_conflict") {
      const cls = cache.find(s => s.classes?.class_name === class_name);
      if (!cls) return new Response(JSON.stringify({ success: false, error: "Класс не найден" }), { status: 404 });
      const subgroups = cache.filter(s => s.class_id === cls.class_id && s.day_of_week === day && s.lesson_num === lesson_num);
      const seen = {};
      for (const s of subgroups) {
        if (seen[s.teacher_id]) {
          results.push(await smartFix(s, cache, allTeachers, allCabinets, studyPlanMap));
        } else { seen[s.teacher_id] = s; }
      }
    }

    else if (type === "subgroups_overflow") {
      const cls = cache.find(s => s.classes?.class_name === class_name);
      if (!cls) return new Response(JSON.stringify({ success: false, error: "Класс не найден" }), { status: 404 });
      const subgroups = cache.filter(s => s.class_id === cls.class_id && s.day_of_week === day && s.lesson_num === lesson_num);
      const toDelete = subgroups.slice(2).map(s => s.schedule_id);
      if (toDelete.length > 0) await prisma.schedule.deleteMany({ where: { schedule_id: { in: toDelete } } });
      results.push({ action: "deleted_overflow", count: toDelete.length });
    }

    const fixed = results.filter(Boolean).length;

    // ── Фаза: убираем дыры — переупаковываем lesson_num по порядку ──────────
    // Для каждой пары (class_id, day_of_week) сортируем уроки по lesson_num
    // и переназначаем 1, 2, 3... без пропусков.
    // Подгруппы (два урока с одинаковым lesson_num) получают одинаковый новый номер.
    try {
      const allSchedule = await prisma.schedule.findMany({
        orderBy: [{ class_id: "asc" }, { day_of_week: "asc" }, { lesson_num: "asc" }],
      });

      // Группируем по class_id + day_of_week
      const grouped = {};
      for (const row of allSchedule) {
        const key = `${row.class_id}__${row.day_of_week}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
      }

      const updates = [];
      for (const rows of Object.values(grouped)) {
        // Уникальные слоты в отсортированном порядке
        const uniqueSlots = [...new Set(rows.map(r => r.lesson_num))].sort((a, b) => a - b);
        // Если нет дыр — пропускаем
        const hasgaps = uniqueSlots.some((slot, idx) => slot !== idx + 1);
        if (!hasgaps) continue;

        // Строим карту переназначения: старый номер → новый
        const remap = {};
        uniqueSlots.forEach((oldSlot, idx) => { remap[oldSlot] = idx + 1; });

        for (const row of rows) {
          const newNum = remap[row.lesson_num];
          if (newNum !== row.lesson_num) {
            updates.push({ id: row.schedule_id, lesson_num: newNum });
          }
        }
      }

      // Применяем все обновления
      for (const u of updates) {
        await prisma.schedule.update({
          where: { schedule_id: u.id },
          data: { lesson_num: u.lesson_num },
        });
      }
    } catch (compactErr) {
      console.error("compaction error:", compactErr);
      // Не прерываем ответ — фикс уже применён
    }

    return new Response(JSON.stringify({ success: true, fixed, results }), { status: 200 });

  } catch (err) {
    console.error("fix-conflict error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}