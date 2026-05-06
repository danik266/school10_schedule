import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GROUP_MAP = {
  'толық сынып': 'full_class',
  '1-топ': 'subgroup_1',
  '1 топ': 'subgroup_1',
  'қ.т. 1-топ': 'subgroup_1',
  '2-топ': 'subgroup_2',
  '2 топ': 'subgroup_2',
  'қ.т. 2-топ': 'subgroup_2',
  'қыздар': 'girls',
  'техн қызар': 'girls',
  'қыз': 'girls',
  'ұлдар': 'boys',
  'техн ұлдар': 'boys',
  'ұл': 'boys',
};

async function main() {
  const text = fs.readFileSync('scratch/workload.txt', 'utf-8');
  const lines = text.split('\n').map(l => l.trim());

  let currentClass = null;
  const parsedData = [];

  for (const line of lines) {
    if (line.match(/^(\d+[А-ЯӘІҢҒҮҰҚӨ]+)\s+СЫНЫП/i)) {
      currentClass = line.split(' ')[0];
      continue;
    }

    if (line.match(/^\d+\s+\|/)) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 5) {
        const subjectName = parts[1].replace(/\s+\(факульт\.\)/i, '').trim();
        const isOptional = parts[1].toLowerCase().includes('(факульт.)');
        
        const hoursPerYearStr = parts[2];
        const hoursPerYear = parseInt(hoursPerYearStr);
        // If hours is missing or "-", skip or default
        if (isNaN(hoursPerYear)) continue;

        const groupRaw = parts[3].toLowerCase();
        let groupType = GROUP_MAP[groupRaw] || 'full_class';
        let teacherName = parts[4];
        
        if (teacherName === '-') continue;

        parsedData.push({
          className: currentClass,
          subjectName,
          isOptional,
          hoursPerYear,
          groupType,
          teacherName
        });
      }
    }
  }

  console.log(`Parsed ${parsedData.length} rows.`);

  // Load existing data
  let classes = await prisma.classes.findMany();
  let subjects = await prisma.subjects.findMany();
  let teachers = await prisma.teachers.findMany();

  // Helper maps
  const classMap = new Map(classes.map(c => [c.class_name.toLowerCase(), c.class_id]));
  const subjectMap = new Map(subjects.map(s => [s.name.toLowerCase(), s.subject_id]));
  
  // Create missing classes
  const uniqueClasses = [...new Set(parsedData.map(d => d.className))];
  for (const c of uniqueClasses) {
    if (!classMap.has(c.toLowerCase())) {
      console.log(`Creating missing class: ${c}`);
      const newClass = await prisma.classes.create({
        data: {
          class_name: c,
        }
      });
      classMap.set(c.toLowerCase(), newClass.class_id);
    }
  }

  // Create missing subjects
  const uniqueSubjects = [...new Set(parsedData.map(d => d.subjectName))];
  for (const s of uniqueSubjects) {
    if (!subjectMap.has(s.toLowerCase())) {
      console.log(`Creating missing subject: ${s}`);
      const newSubject = await prisma.subjects.create({
        data: {
          name: s,
          type: 'required' // We will update this if it's optional later
        }
      });
      subjectMap.set(s.toLowerCase(), newSubject.subject_id);
    }
  }

  // Handle teachers
  const getTeacherMatch = async (rawName) => {
    let match = teachers.find(t => t.full_name.toLowerCase() === rawName.toLowerCase());
    if (match) return match.teacher_id;
    
    const parts = rawName.replace(/\./g, ' ').split(' ').filter(Boolean);
    const lastName = parts[0].toLowerCase();
    match = teachers.find(t => t.full_name.toLowerCase().includes(lastName));
    if (match) return match.teacher_id;

    console.log(`Creating missing teacher: ${rawName}`);
    const newTeacher = await prisma.teachers.create({
      data: {
        full_name: rawName,
        subject: 'General'
      }
    });
    teachers.push(newTeacher);
    return newTeacher.teacher_id;
  };

  // Clear existing class_subjects for the parsed classes
  const classIdsToClear = uniqueClasses.map(c => classMap.get(c.toLowerCase()));
  await prisma.class_subjects.deleteMany({
    where: { class_id: { in: classIdsToClear } }
  });
  // Clear existing study_plan for the parsed classes
  await prisma.study_plan.deleteMany({
    where: { class_id: { in: classIdsToClear } }
  });

  // Insert new class_subjects and study_plan
  let insertedBindings = 0;
  let insertedStudyPlans = 0;
  
  for (const row of parsedData) {
    const class_id = classMap.get(row.className.toLowerCase());
    const subject_id = subjectMap.get(row.subjectName.toLowerCase());
    const teacher_id = await getTeacherMatch(row.teacherName);

    // 1. Create class_subjects binding
    const existingBinding = await prisma.class_subjects.findFirst({
      where: { class_id, subject_id, teacher_id, group_type: row.groupType }
    });

    if (!existingBinding) {
      await prisma.class_subjects.create({
        data: {
          class_id,
          subject_id,
          teacher_id,
          group_type: row.groupType
        }
      });
      insertedBindings++;
    }

    // 2. Upsert study_plan (to avoid duplicate records for the same subject when groups are split)
    const existingStudyPlan = await prisma.study_plan.findFirst({
      where: { class_id, subject_id }
    });

    if (!existingStudyPlan) {
      const hours_per_week = Math.ceil(row.hoursPerYear / 34);
      await prisma.study_plan.create({
        data: {
          class_id,
          subject_id,
          hours_per_week: hours_per_week,
          hours_per_year: row.hoursPerYear
        }
      });
      insertedStudyPlans++;
    }
    
    // Also update subject type if it is optional
    if (row.isOptional) {
        await prisma.subjects.update({
            where: { subject_id },
            data: { type: 'optional' }
        });
    }
  }

  console.log(`Inserted ${insertedBindings} class_subjects bindings.`);
  console.log(`Inserted ${insertedStudyPlans} study_plan entries.`);
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
