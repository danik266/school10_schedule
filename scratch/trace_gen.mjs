
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

async function runGen() {
  console.log('--- Starting Generation Logic Trace ---');
  try {
    const classes = await prisma.classes.findMany({ include: { study_plan: { include: { subjects: true } } } });
    const teachers = await prisma.teachers.findMany();
    const cabinets = await prisma.cabinets.findMany();
    const classSubjects = await prisma.class_subjects.findMany();
    
    console.log(`Initial Data: ${classes.length} classes, ${teachers.length} teachers, ${classSubjects.length} bindings.`);

    // Mocking the generation environment
    const tBusy = {};
    for (const d of DAYS) {
      tBusy[d] = {};
      for (let i = 1; i <= 10; i++) tBusy[d][i] = new Set();
    }

    // Checking if pickT would fail for some subjects
    let failCount = 0;
    for (const cls of classes) {
      for (const sp of cls.study_plan) {
        if (!sp.subjects) continue;
        const assigned = classSubjects.filter(cs => cs.class_id === cls.class_id && cs.subject_id === sp.subject_id).map(cs => cs.teacher_id);
        
        if (assigned.length > 0) {
            const found = teachers.filter(t => assigned.includes(t.teacher_id));
            if (found.length === 0) {
                console.log(`CRITICAL: Class ${cls.class_name}, Subject ${sp.subjects.name} has assigned teacher IDs ${assigned} but THEY DO NOT EXIST in teachers table!`);
                failCount++;
            }
        }
      }
    }

    if (failCount > 0) {
        console.log(`Total critical failures: ${failCount}`);
    } else {
        console.log('No missing teacher references found in bindings.');
    }

    // Try a sample pickT
    console.log('Testing pickT for first class/subject...');
    const firstCls = classes[0];
    const firstSp = firstCls.study_plan[0];
    if (firstSp && firstSp.subjects) {
        const assigned = classSubjects.filter(cs => cs.class_id === firstCls.class_id && cs.subject_id === firstSp.subject_id).map(cs => cs.teacher_id);
        console.log(`Assigned teachers for ${firstCls.class_name} - ${firstSp.subjects.name}: ${assigned}`);
    }

  } catch (e) {
    console.error('Trace Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

runGen();
