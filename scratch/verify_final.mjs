
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Verification: Study Plan Count ---');
  const studyPlanCount = await prisma.study_plan.count();
  console.log(`Total rows in study_plan: ${studyPlanCount}`);

  console.log('--- Verification: Class Subjects Count ---');
  const classSubjectsCount = await prisma.class_subjects.count();
  console.log(`Total rows in class_subjects: ${classSubjectsCount}`);

  console.log('--- Sample Workload for Teacher 15 (Сеитова Н.С.) ---');
  const teacher15 = await prisma.teachers.findUnique({
    where: { teacher_id: 15 },
    include: {
      class_subjects: {
        include: {
          classes: true,
          subjects: true
        }
      }
    }
  });
  
  if (teacher15) {
    console.log(`Teacher: ${teacher15.full_name}`);
    teacher15.class_subjects.forEach(cs => {
      console.log(` - Leads ${cs.subjects.name} for class ${cs.classes.class_name} (${cs.group_type})`);
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
