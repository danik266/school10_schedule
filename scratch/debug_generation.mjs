
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simulateGeneration() {
  console.log('--- Simulating Schedule Generation ---');
  try {
    // We'll call the API logic directly or simulate its environment
    // Since I can't easily import the route handler, I'll check the critical data first
    
    const classes = await prisma.classes.findMany();
    console.log(`Classes found: ${classes.length}`);
    
    const studyPlan = await prisma.study_plan.findMany({ include: { subjects: true } });
    console.log(`Study plan entries: ${studyPlan.length}`);
    
    const teachers = await prisma.teachers.findMany();
    console.log(`Teachers found: ${teachers.length}`);
    
    const cabinets = await prisma.cabinets.findMany();
    console.log(`Cabinets found: ${cabinets.length}`);

    // Check for subjects with no teachers assigned in class_subjects
    const classSubjects = await prisma.class_subjects.findMany();
    console.log(`Class-Subject bindings: ${classSubjects.length}`);

    // Let's try to run a minimal version of the generation logic to see where it breaks
    // (Omitted the full 500 lines for now, focusing on data sanity)
    
    const classesWithNoPlan = classes.filter(c => !studyPlan.some(sp => sp.class_id === c.class_id));
    if (classesWithNoPlan.length > 0) {
        console.log(`Warning: ${classesWithNoPlan.length} classes have no study plan.`);
    }

    const missingSubjects = studyPlan.filter(sp => !sp.subjects);
    if (missingSubjects.length > 0) {
        console.log(`CRITICAL: ${missingSubjects.length} study plan entries have no linked subject record!`);
    }

  } catch (error) {
    console.error('Generation Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateGeneration();
