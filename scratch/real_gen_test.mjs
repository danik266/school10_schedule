
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

async function runRealGen() {
  console.log('--- RUNNING REAL GENERATION LOGIC ---');
  try {
    // 1. Clean up
    console.log('Cleaning up old schedule...');
    await prisma.schedule.deleteMany({});

    // 2. Load data
    const classes = await prisma.classes.findMany({ include: { study_plan: { include: { subjects: true } } } });
    const teachers = await prisma.teachers.findMany();
    const cabinets = await prisma.cabinets.findMany();
    const classSubjects = await prisma.class_subjects.findMany();
    
    console.log(`Data loaded: ${classes.length} classes, ${teachers.length} teachers.`);

    // 3. Run a simplified but real-data version of Phase 2
    const newSchedule = [];
    const tBusy = {};
    for(const d of DAYS){ tBusy[d]={}; for(let i=1;i<=10;i++) tBusy[d][i]=new Set(); }

    console.log('Processing Phase 2 (Regular Lessons)...');
    for (const cls of classes) {
      for (const sp of cls.study_plan) {
        if (!sp.subjects) continue;
        const hours = Math.ceil(Number(sp.hours_per_week));
        const assigned = classSubjects.filter(cs => cs.class_id === cls.class_id && cs.subject_id === sp.subject_id).map(cs => cs.teacher_id);
        
        for (let i = 0; i < hours; i++) {
          // Find a slot
          let found = false;
          for (const day of DAYS) {
            for (let slot = 1; slot <= 8; slot++) {
              if (tBusy[day][slot].size < teachers.length) { // Very loose check
                 // Try to pick teacher
                 let teacher = null;
                 if (assigned.length > 0) {
                   teacher = teachers.find(t => assigned.includes(t.teacher_id) && !tBusy[day][slot].has(t.teacher_id));
                 } else {
                   teacher = teachers.find(t => t.subject?.includes(sp.subjects.name) && !tBusy[day][slot].has(t.teacher_id));
                 }

                 if (teacher) {
                   tBusy[day][slot].add(teacher.teacher_id);
                   newSchedule.push({
                     class_id: cls.class_id,
                     subject_id: sp.subject_id,
                     teacher_id: teacher.teacher_id,
                     room_id: cabinets[0].room_id,
                     day_of_week: day,
                     lesson_num: slot,
                     year: 2026
                   });
                   found = true;
                   break;
                 }
              }
            }
            if (found) break;
          }
        }
      }
    }

    console.log(`Generated ${newSchedule.length} lessons. Saving to DB...`);
    if (newSchedule.length > 0) {
      await prisma.schedule.createMany({ data: newSchedule });
      console.log('✅ Successfully saved to database.');
    } else {
      console.log('⚠ No lessons were generated.');
    }

  } catch (error) {
    console.error('CRITICAL GENERATION ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runRealGen();
