import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.classes.findMany();
  const subjects = await prisma.subjects.findMany();
  const teachers = await prisma.teachers.findMany();

  console.log('Classes:', classes.length, classes.map(c => c.class_name).slice(0, 5));
  console.log('Subjects:', subjects.length, subjects.map(s => s.name).slice(0, 5));
  console.log('Teachers:', teachers.length, teachers.map(t => t.full_name).slice(0, 5));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
