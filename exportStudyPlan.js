import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function exportClass5A() {
  const studyPlan = await prisma.study_plan.findMany({
    where: { class_id: 1 }, // id класса 5А
    include: { subjects: true, classes: true }
  });

  const shortData = studyPlan.map(sp => ({
    class: sp.classes.class_name,
    subject: sp.subjects.name,
    hours_per_week: sp.hours_per_week
  }));

  console.log(JSON.stringify(shortData, null, 2));
}

exportClass5A();
