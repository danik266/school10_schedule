
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DIFFICULTY = (name, classNum) => {
  if (!name) return 2;
  const n = name.toLowerCase(), jr = classNum < 10;
  if (n.includes("математик")||n.includes("алгебр")||n.includes("геометр")) return 1;
  return 2;
};
const isPE      = n => (n||"").toLowerCase().includes("дене шыны")||(n||"").toLowerCase().includes("физкульт");
const isKorkhem = n => (n||"").toLowerCase().includes("көркем еңбек");
const isIT      = n => (n||"").toLowerCase().includes("информатик");
const isBio     = n => (n||"").toLowerCase().includes("биолог");
const isChem    = n => (n||"").toLowerCase().includes("химия");

const matchT = (sn, ts) => {
  if (!sn || !ts) return false;
  const s=sn.toLowerCase(), t=ts.toLowerCase();
  return s===t || s.includes(t) || t.includes(s);
};

const nuanceOk = (t,day,num) => true;

const pickT = (sn, teachers, busy, day, num, assignedTeacherIds = []) => {
  const avail = teachers;
  if (assignedTeacherIds && assignedTeacherIds.length > 0) {
    for (const tId of assignedTeacherIds) {
      const t = avail.find(x => x.teacher_id === tId && !busy.has(x.teacher_id));
      if (t) return t;
    }
    return null;
  }
  let c=avail.filter(t=>matchT(sn,t.subject)&&!busy.has(t.teacher_id));
  if(c.length) return c[Math.floor(Math.random()*c.length)];
  return null;
};

async function runGen() {
  console.log('--- Running Full Generation Simulation ---');
  try {
    const classes  = await prisma.classes.findMany({ include:{study_plan:{include:{subjects:true}}} });
    const teachers = await prisma.teachers.findMany();
    const cabinets = await prisma.cabinets.findMany();
    const classSubjects = await prisma.class_subjects.findMany();
    
    const getAssignedT = (cId, sId) => classSubjects.filter(cs => cs.class_id === cId && cs.subject_id === sId).map(cs => cs.teacher_id);
    
    const tBusy = {};
    for(const d of DAYS){ tBusy[d]={}; for(let i=1;i<=10;i++) tBusy[d][i]=new Set(); }

    const assign = {};
    for(const cls of classes) assign[cls.class_id]=[];

    const newSchedule = [];
    const allSlots = [];
    for(const d of DAYS) for(let s=1;s<=8;s++) allSlots.push({day:d,slot:s});

    // Minimal Phase 2 logic
    for(const cls of classes){
      const classNum = parseInt(cls.class_name);
      const lessons = [];
      for(const sp of cls.study_plan){
        if(!sp.subjects) continue;
        const sn=sp.subjects.name;
        const hours=Math.ceil(Number(sp.hours_per_week));
        for(let i=0;i<hours;i++) lessons.push({subject_id:sp.subject_id,subject_name:sn,diff:DIFFICULTY(sn,classNum)});
      }
      
      let s=1;
      for(const lesson of lessons){
        const day = DAYS[s % 5];
        const slot = Math.ceil(s / 5);
        if (slot > 8) break;
        const sn=lesson.subject_name;
        const assigned = getAssignedT(cls.class_id, lesson.subject_id);
        const teacher=pickT(sn,teachers,tBusy[day][slot],day,slot, assigned);
        if(!teacher) {
            // console.log(`Could not find teacher for ${cls.class_name} - ${sn}`);
            s++; continue;
        }
        tBusy[day][slot].add(teacher.teacher_id);
        newSchedule.push({class_id:cls.class_id,subject_id:lesson.subject_id,teacher_id:teacher.teacher_id,room_id:cabinets[0].room_id,day_of_week:day,lesson_num:slot,year:2026});
        s++;
      }
    }

    console.log(`Successfully simulated generation. Created ${newSchedule.length} potential lessons.`);

  } catch (error) {
    console.error('Simulation Crash:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runGen();
