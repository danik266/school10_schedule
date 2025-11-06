import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const maxLessonsPerDay = 6;

export async function POST(req) {
  try {
    // Удаляем старое расписание
    await prisma.schedule.deleteMany({});

    // Получаем все данные
    const classes = await prisma.classes.findMany({
      include: { study_plan: { include: { subjects: true } } },
    });
    const teachers = await prisma.teachers.findMany();
    const cabinets = await prisma.cabinets.findMany();

    const newSchedule = [];

    // Кабинеты заняты по дню и уроку
    const cabinetUsage = {};
    for (const day of days) cabinetUsage[day] = {};

    for (const cls of classes) {
      const studentsCount = Number(cls.students_count) || 0;
      const splitSubjects =
        cls.class_type?.split(/[-,]/).map((s) => s.trim().toLowerCase()) || [];

      // Формируем массив уроков
      let lessons = [];
      cls.study_plan.forEach((sp) => {
        if (!sp.subjects) return;
        const hours = Math.ceil(Number(sp.hours_per_week));
        for (let i = 0; i < hours; i++) {
          lessons.push({
            subject_id: sp.subject_id,
            subject_name: sp.subjects.name,
          });
        }
      });
      if (!lessons.length) continue;

      // Распределяем уроки по дням
      const dayLoad = {};
      for (let day of days) dayLoad[day] = [];

      let dayIndex = 0;
      for (const lesson of lessons) {
        let placed = false;
        let tries = 0;
        while (!placed && tries < days.length) {
          const day = days[dayIndex % days.length];
          const exists = dayLoad[day].some(
            (l) => l.subject_id === lesson.subject_id
          );
          if (!exists && dayLoad[day].length < maxLessonsPerDay) {
            dayLoad[day].push(lesson);
            placed = true;
          }
          dayIndex++;
          tries++;
        }
        if (!placed) {
          const day = days[dayIndex % days.length];
          dayLoad[day].push(lesson);
          dayIndex++;
        }
      }

      // Создаём уроки по дням
      for (let day of days) {
        const dayLessons = dayLoad[day];
        for (let i = 0; i < dayLessons.length; i++) {
          const lesson = dayLessons[i];
          const lessonNum = i + 1;

          // Учитель по предмету
          let teacher = teachers.find(
            (t) => t.subject.toLowerCase() === lesson.subject_name.toLowerCase()
          );
          if (!teacher)
            teacher = teachers[Math.floor(Math.random() * teachers.length)];

          // Проверяем, нужно ли делить на подгруппы
          const normalizedLesson = lesson.subject_name.trim().toLowerCase();
          const shouldSplit =
            studentsCount > 24 &&
            splitSubjects.some((s) => normalizedLesson.includes(s));

          if (shouldSplit) {
            // === Подгруппа 1 ===
            let availableRooms1 = cabinets.filter((r) => {
              const used = cabinetUsage[day][lessonNum] || [];
              return !used.includes(r.room_id);
            });
            if (!availableRooms1.length) availableRooms1 = [...cabinets];
            const room1 =
              availableRooms1[Math.floor(Math.random() * availableRooms1.length)];
            if (!cabinetUsage[day][lessonNum]) cabinetUsage[day][lessonNum] = [];
            cabinetUsage[day][lessonNum].push(room1.room_id);

            newSchedule.push({
              class_id: cls.class_id,
              subject_id: lesson.subject_id,
              teacher_id: teacher.teacher_id,
              room_id: room1.room_id,
              day_of_week: day,
              lesson_num: lessonNum,
              year: new Date().getFullYear(),
            });

            // === Подгруппа 2 ===
            let availableRooms2 = cabinets.filter((r) => {
              const used = cabinetUsage[day][lessonNum] || [];
              return !used.includes(r.room_id);
            });
            if (!availableRooms2.length) availableRooms2 = [...cabinets];
            const room2 =
              availableRooms2[Math.floor(Math.random() * availableRooms2.length)];
            cabinetUsage[day][lessonNum].push(room2.room_id);

            // Можно использовать другого учителя, если есть несколько на этот предмет
            let teacher2 = teachers
              .filter(
                (t) => t.subject.toLowerCase() === lesson.subject_name.toLowerCase()
              )
              .find((t) => t.teacher_id !== teacher.teacher_id);
            if (!teacher2) teacher2 = teacher;

            newSchedule.push({
              class_id: cls.class_id,
              subject_id: lesson.subject_id,
              teacher_id: teacher2.teacher_id,
              room_id: room2.room_id,
              day_of_week: day,
              lesson_num: lessonNum,
              year: new Date().getFullYear(),
            });
          } else {
            // === Обычный урок ===
            let availableRooms = cabinets.filter((r) => {
              const used = cabinetUsage[day][lessonNum] || [];
              return !used.includes(r.room_id);
            });
            if (!availableRooms.length) availableRooms = [...cabinets];
            const room =
              availableRooms[Math.floor(Math.random() * availableRooms.length)];
            if (!cabinetUsage[day][lessonNum]) cabinetUsage[day][lessonNum] = [];
            cabinetUsage[day][lessonNum].push(room.room_id);

            newSchedule.push({
              class_id: cls.class_id,
              subject_id: lesson.subject_id,
              teacher_id: teacher.teacher_id,
              room_id: room.room_id,
              day_of_week: day,
              lesson_num: lessonNum,
              year: new Date().getFullYear(),
            });
          }
        }
      }
    }

    if (newSchedule.length) {
      await prisma.schedule.createMany({ data: newSchedule });
    }

    return new Response(
      JSON.stringify({ success: true, count: newSchedule.length }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Ошибка генерации расписания:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
