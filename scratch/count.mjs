import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function count() {
  const plans = await prisma.study_plan.findMany();
  let totalLessons = 0;
  for (const p of plans) totalLessons += Math.ceil(Number(p.hours_per_week));
  console.log('Total Expected Lessons:', totalLessons);
}
count().finally(() => prisma.$disconnect());
