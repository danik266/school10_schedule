const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const LESSON_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];
const CURRENT_YEAR = new Date().getFullYear();

async function generateSchedule() {
  // Шаг 1: Очистить существующий schedule для года
  await prisma.schedule.deleteMany({ where: { year: CURRENT_YEAR } });

  // Шаг 2: Получить все данные
  const classes = await prisma.classes.findMany();
  const subjects = await prisma.subjects.findMany();
  const teachers = await prisma.teachers.findMany();
  const cabinets = await prisma.cabinets.findMany();

  // Группируем учителей по предметам
  const teachersBySubject = {};
  teachers.forEach(t => {
    if (!teachersBySubject[t.subject]) teachersBySubject[t.subject] = [];
    teachersBySubject[t.subject].push(t);
  });

  // Шаг 3: Для каждого класса генерируем расписание
  for (const cls of classes) {
    const studyPlan = await prisma.study_plan.findMany({ where: { class_id: cls.class_id } });

    // Собираем уроки для класса: {subjectId: hours}
    const lessonsToPlace = {};
    studyPlan.forEach(plan => {
      lessonsToPlace[plan.subject_id] = Math.floor(plan.hours_per_week); // Предполагаем integer
    });

    // Шаг 4: Распределяем уроки равномерно по дням
    const dailyLessons = {};
    DAYS.forEach(day => dailyLessons[day] = []);

    Object.entries(lessonsToPlace).forEach(([subjectId, totalHours]) => {
      const hoursPerDay = Math.floor(totalHours / DAYS.length);
      const extraDays = totalHours % DAYS.length;
      let dayIndex = 0;
      for (let i = 0; i < totalHours; i++) {
        const day = DAYS[dayIndex % DAYS.length];
        const entry = dailyLessons[day].find(e => e.subject_id === parseInt(subjectId));
        if (entry) entry.count++;
        else dailyLessons[day].push({ subject_id: parseInt(subjectId), count: 1 });
        dayIndex++;
      }
    });

    // Шаг 5: Размещаем уроки в слотах, избегая конфликтов
    for (const day of DAYS) {
      const dayLessons = dailyLessons[day];
      let slotIndex = 0;
      for (const lesson of dayLessons) {
        for (let i = 0; i < lesson.count; i++) {
          let placed = false;
          while (!placed && slotIndex < LESSON_SLOTS.length) {
            const lessonNum = LESSON_SLOTS[slotIndex];
            slotIndex++;

            // Проверяем конфликты
            const existing = await prisma.schedule.findMany({
              where: { day_of_week: day, lesson_num: lessonNum, year: CURRENT_YEAR },
            });

            const subject = subjects.find(s => s.subject_id === lesson.subject_id);
            if (!subject) continue;

            // Выбираем учителя (первый доступный)
            const availableTeachers = teachersBySubject[subject.name] || [];
            let teacher = null;
            for (const t of availableTeachers) {
              if (!existing.some(e => e.teacher_id === t.teacher_id)) {
                teacher = t;
                break;
              }
            }
            if (!teacher) continue;

            // Выбираем кабинет (первый свободный)
            let cabinet = null;
            for (const c of cabinets) {
              if (!existing.some(e => e.room_id === c.room_id)) {
                cabinet = c;
                break;
              }
            }
            if (!cabinet) continue;

            // Создаем запись
            await prisma.schedule.create({
              data: {
                class_id: cls.class_id,
                subject_id: lesson.subject_id,
                teacher_id: teacher.teacher_id,
                room_id: cabinet.room_id,
                day_of_week: day,
                lesson_num: lessonNum,
                year: CURRENT_YEAR,
              },
            });
            placed = true;
          }
          if (!placed) {
            console.error(`Не удалось разместить урок для класса ${cls.class_name}, предмет ${lesson.subject_id} в день ${day}`);
          }
        }
      }
    }
  }

  return { message: 'Расписание сгенерировано' };
}

module.exports = { generateSchedule };