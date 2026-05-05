
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking Classes ---');
  const classes = await prisma.classes.findMany({
    select: { class_id: true, class_name: true }
  });
  console.log(JSON.stringify(classes, null, 2));

  console.log('--- Checking Subjects (First 10) ---');
  const subjects = await prisma.subjects.findMany({
    take: 10,
    select: { subject_id: true, name: true }
  });
  console.log(JSON.stringify(subjects, null, 2));

  console.log('--- Checking Teachers (First 10) ---');
  const teachers = await prisma.teachers.findMany({
    take: 10,
    select: { teacher_id: true, full_name: true }
  });
  console.log(JSON.stringify(teachers, null, 2));
  
  console.log('--- Checking specific subjects 60-64 ---');
  const specificSubjects = await prisma.subjects.findMany({
    where: { subject_id: { in: [60, 61, 62, 63, 64] } }
  });
  console.log(JSON.stringify(specificSubjects, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
