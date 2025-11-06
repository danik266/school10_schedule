// seed.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Очистим старое
  await prisma.schedule.deleteMany();

  // Получаем классы, предметы, учителей и кабинеты
  const classes = await prisma.classes.findMany({
    where: { class_name: { in: ["5А","5Б","6А","6Б","7А","7Б"] } }
  });
  const subjects = await prisma.subjects.findMany();
  const teachers = await prisma.teachers.findMany();
  const rooms = await prisma.cabinets.findMany();

  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday"];

  const scheduleData = [];

  for (const cls of classes) {
    for (const day of days) {
      const lessonsPerDay = Math.floor(Math.random() * 3) + 4; // 4–6 уроков
      for (let lessonNum = 1; lessonNum <= lessonsPerDay; lessonNum++) {
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const teacher = teachers[Math.floor(Math.random() * teachers.length)];
        const room = rooms[Math.floor(Math.random() * rooms.length)];

        scheduleData.push({
          class_id: cls.class_id,
          subject_id: subject.subject_id,
          teacher_id: teacher.teacher_id,
          room_id: room.room_id,
          day_of_week: day,
          lesson_num: lessonNum,
          year: 2025,
        });
      }
    }
  }

  await prisma.schedule.createMany({ data: scheduleData });
  console.log(`Сгенерировано расписание для ${classes.length} классов!`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
