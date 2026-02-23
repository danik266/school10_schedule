import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const ALL_SLOTS = Array.from({length:8},(_,i)=>i+1); // 1-8

const DIFFICULTY = (name, classNum) => {
  const n = name.toLowerCase(), jr = classNum < 10;
  if (n.includes("математик")||n.includes("алгебр")||n.includes("геометр")) return 1;
  if (!jr && n.includes("физик") && !n.includes("дене") && !n.includes("физкульт")) return 1;
  if (!jr && (n.includes("химия")||n.includes("хим "))) return 1;
  if (jr && (n.includes("қазақ тілі")||n.includes("қазақ тіл"))) return 1;
  if (jr && n.includes("қазақ әдебиеті")) return 1;
  if (jr && n.includes("қазақстан тарихы")) return 1;
  if (n.includes("биолог")||n.includes("информатик")||n.includes("ивт")) return 2;
  if (n.includes("қазақ")||n.includes("казах")||n.includes("орыс")||n.includes("русск")) return 2;
  if (n.includes("ағылшын")||n.includes("шетел")||n.includes("англий")) return 2;
  if (n.includes("тарих")||n.includes("истор")||n.includes("геогр")) return 2;
  if (n.includes("жаратылыстану")||n.includes("дүниеж")) return 2;
  if (n.includes("физик")&&!n.includes("дене")) return 2;
  if (n.includes("химия")) return 2;
  if (n.includes("дене шыны")||n.includes("физкульт")||n.includes("физическ культ")) return 3;
  if (n.includes("көркем")||n.includes("труд")||n.includes("технолог")) return 3;
  if (n.includes("музык")||n.includes("бейнелеу")||n.includes("изо")) return 3;
  if (n.includes("нвп")||n.includes("нпд")) return 3;
  if (n.includes("жаһандық")||n.includes("глобал")||n.includes("қузырет")) return 3;
  return 2;
};

const isPE      = n => n.toLowerCase().includes("дене шыны")||n.toLowerCase().includes("физкульт")||(n.toLowerCase().includes("физическ")&&n.toLowerCase().includes("культ"));
const isKorkhem = n => n.toLowerCase().includes("көркем еңбек")||(n.toLowerCase().includes("труд")&&!n.toLowerCase().includes("информ"));
const isIT      = n => n.toLowerCase().includes("информатик")||n.toLowerCase().includes("ивт");
const isBio     = n => n.toLowerCase().includes("биолог");
const isChem    = n => n.toLowerCase().includes("химия")||n.toLowerCase().includes("хим ");

const SMALL = ["110","111","112","113","209","r110","r111","r112","r113","r209","210а","210a","r210a","г210а"];
const isSmall = rn => SMALL.some(s=>rn.toLowerCase().replace(/\s/g,"")=== s.replace(/\s/g,""));
const SPEC_NUMS = ["208","307","308","104","109","213"];
const isSpecRoom = rn => { const r=(rn||"").toLowerCase(); return SPEC_NUMS.includes(r)||r.includes("спортзал")||(r.startsWith("ке")&&r.length<15); };

const getRooms = (sn, cabinets, sub=false) => {
  if (isPE(sn)) return cabinets.filter(c=>(c.room_name||"").toLowerCase().includes("спортзал")||(c.room_number||"").toLowerCase().includes("спортзал"));
  if (isKorkhem(sn)) return cabinets.filter(c=>(c.room_number||"").toLowerCase().startsWith("ке")||(c.room_name||"").toLowerCase().includes("көркем"));
  if (isIT(sn)) return cabinets.filter(c=>["208","307","308"].includes((c.room_number||"").toLowerCase()));
  if (isBio(sn)) return cabinets.filter(c=>["104","109"].includes((c.room_number||"").toLowerCase()));
  if (isChem(sn)) return cabinets.filter(c=>(c.room_number||"").toLowerCase()==="213");
  return cabinets.filter(c=>{ const rn=c.room_number||""; if(isSpecRoom(rn))return false; if(!sub&&isSmall(rn))return false; return true; });
};

const matchT = (sn, ts) => {
  const s=sn.toLowerCase(), t=ts.toLowerCase();
  if(s===t||s.includes(t)||t.includes(s)) return true;
  const G=[["математик","алгебр","геометр"],["қазақ тілі","қазақ тіл","қазақ әдеб","казахск"],["орыс тілі","орыс тіл","русск","рус.яз","русский"],["ағылшын","шетел тіл","английск"],["информатик","ивт"],["дене шыны","физическ культ","физкульт"],["көркем еңбек","труд","технолог"],["биолог"],["тарих","истор"],["физик"],["химия","хими"],["геогр"],["музык"],["бейнелеу","изо"],["нвп","нпд","военн"],["жаратылыстану","природовед","жаратылыс"],["дүниеж"],["жаһандық","глобал","қузырет"],["физика – ғажайып","физика - ғажайып"]];
  for(const g of G) if(g.some(k=>s.includes(k))&&g.some(k=>t.includes(k))) return true;
  return false;
};
const nuanceOk = (t,day,num) => { const n=t.nuances; if(!n||n==="none")return true; if(n==="no_friday"&&day==="Friday")return false; if(n==="no_monday"&&day==="Monday")return false; if(n==="morning_only"&&num>4)return false; if(n==="afternoon_only"&&num<=4)return false; if(n==="no_first_lesson"&&num===1)return false; return true; };

const pickT = (sn, teachers, busy, day, num) => {
  let c=teachers.filter(t=>matchT(sn,t.subject)&&!busy.has(t.teacher_id)&&nuanceOk(t,day,num));
  if(c.length) return c[Math.floor(Math.random()*c.length)];
  c=teachers.filter(t=>matchT(sn,t.subject)&&!busy.has(t.teacher_id));
  if(c.length) return c[Math.floor(Math.random()*c.length)];
  c=teachers.filter(t=>matchT(sn,t.subject));
  if(c.length) return c[Math.floor(Math.random()*c.length)];
  c=teachers.filter(t=>!busy.has(t.teacher_id));
  if(c.length) return c[Math.floor(Math.random()*c.length)];
  return teachers[0]||null;
};

const shuf = a => { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };

export async function POST(req) {
  try {
    const settings = global.scheduleSettings||{};
    const MAX_JR = settings.max_lessons_junior||8;
    const MAX_SR = settings.max_lessons_senior||9;

    await prisma.schedule.deleteMany({});

    const classes  = await prisma.classes.findMany({ include:{study_plan:{include:{subjects:true}}} });
    const teachers = await prisma.teachers.findMany();
    const cabinets = await prisma.cabinets.findMany();
    const year = new Date().getFullYear();

    // ── Глобальные занятости ─────────────────────────────────────────────────
    // tBusy[day][slot] = Set<teacher_id>
    // rCount[day][slot][room_id] = count
    const tBusy = {}; const rCount = {};
    for(const d of DAYS){ tBusy[d]={}; rCount[d]={};
      for(let i=1;i<=10;i++){ tBusy[d][i]=new Set(); rCount[d][i]={}; } }

    const useRoom = (day,slot,rid) => { rCount[day][slot][rid]=(rCount[day][slot][rid]||0)+1; };
    const gymCount = (day,slot) => gymCabs.reduce((sum,c)=>sum+(rCount[day][slot][c.room_id]||0),0);
    const roomOk  = (day,slot,cab) => {
      const rn=(cab.room_number||"").toLowerCase();
      const rname=(cab.room_name||"").toLowerCase();
      const isGym=rn.includes("спортзал")||rname.includes("спортзал");
      if(isGym) return gymCount(day,slot)<4;
      return (rCount[day][slot][cab.room_id]||0)<1;
    };
    const pickFreeRoom = (sn,day,slot,cabinets,sub=false) => {
      const pool=getRooms(sn,cabinets,sub);
      const free=pool.filter(r=>roomOk(day,slot,r));
      if(free.length) return free[Math.floor(Math.random()*free.length)];
      return pool[Math.floor(Math.random()*pool.length)]||null;
    };

    // ── Специальные кабинеты — сколько их ────────────────────────────────────
    const gymCabs  = cabinets.filter(c=>(c.room_name||"").toLowerCase().includes("спортзал")||(c.room_number||"").toLowerCase().includes("спортзал"));
    const keRoomBoys  = cabinets.find(c=>(c.room_number||"").toLowerCase().includes("ұлдар")||(c.room_name||"").toLowerCase().includes("ұлдар"));
    const keRoomGirls = cabinets.find(c=>(c.room_number||"").toLowerCase().includes("қыздар")||(c.room_name||"").toLowerCase().includes("қыздар"));
    const chemCabs = cabinets.filter(c=>(c.room_number||"").toLowerCase()==="213"); // 1 каб
    const bioCabs  = cabinets.filter(c=>["104","109"].includes((c.room_number||"").toLowerCase())); // 2 каб
    const itCabs   = cabinets.filter(c=>["208","307","308"].includes((c.room_number||"").toLowerCase())); // 3 каб

    // ── КЕ учителя ────────────────────────────────────────────────────────────
    const keTeachers = teachers.filter(t=>isKorkhem(t.subject));
    const keMale   = keTeachers.find(t=>t.full_name.toLowerCase().includes("мусай")||t.full_name.toLowerCase().includes("досжан"))||keTeachers[0];
    const keFemale = keTeachers.filter(t=>t.teacher_id!==keMale?.teacher_id);
    let keFIdx=0;

    // ── Лимиты параллельных уроков для спецкабинетов ─────────────────────────
    // gymSlotCount[day][slot] = кол-во классов в спортзале
    // keSlotCount[day][slot]  = кол-во классов на КЕ (1 пара = 1 класс)
    // chemSlotCount[day][slot], bioSlotCount[day][slot], itSlotCount[day][slot]
    const gymSC={},keSC={},chemSC={},bioSC={},itSC={};
    for(const d of DAYS){ gymSC[d]={};keSC[d]={};chemSC[d]={};bioSC[d]={};itSC[d]={};
      for(let i=1;i<=10;i++){ gymSC[d][i]=0;keSC[d][i]=0;chemSC[d][i]=0;bioSC[d][i]=0;itSC[d][i]=0; } }

    // ── ФАЗА 1: Распределяем дефицитные ресурсы между классами ───────────────
    // Строим пары (класс, предмет) для каждого спецресурса
    // и распределяем их по слотам так чтобы не превышать лимит

    const assign = {}; // classId -> [{day,slot,subject_id,subject_name,teacher_id,room_id}]
    for(const cls of classes) assign[cls.class_id]=[];

    // Генератор уникальных слотов (day,slot) — идём по всем 40 слотам недели
    const allSlots = [];
    for(const d of DAYS) for(let s=1;s<=8;s++) allSlots.push({day:d,slot:s});

    // Функция: попытаться поставить N уроков для класса в спецресурс
    const tryAssign = (cls,sp,needed,canUse,useCounter,maxCount,getRoomFn) => {
      let done=0;
      const slots = shuf([...allSlots]);
      for(const {day,slot} of slots){
        if(done>=needed) break;
        if(useCounter[day][slot]>=maxCount) continue;
        if(assign[cls.class_id].some(a=>a.day===day&&a.slot===slot)) continue;
        // Разрешаем дубль предмета в один день только если нужно >= 3 уроков
        const sameDay=assign[cls.class_id].filter(a=>a.day===day&&a.subject_id===sp.subject_id).length;
        if(sameDay>0 && needed<3) continue;
        if(sameDay>1) continue; // максимум 2 раза один предмет в день
        const roomArr = getRoomFn(day,slot);
        if(!roomArr||roomArr.length===0) continue;
        // Берём первый свободный кабинет из пула
        const room = roomArr.find(r=>roomOk(day,slot,r)) || roomArr[0];
        if(!roomOk(day,slot,room)) continue; // кабинет реально занят
        const teacher = pickT(sp.subjects.name,teachers,tBusy[day][slot],day,slot);
        if(!teacher) continue;
        useCounter[day][slot]++;
        tBusy[day][slot].add(teacher.teacher_id);
        useRoom(day,slot,room.room_id);
        assign[cls.class_id].push({day,slot,subject_id:sp.subject_id,subject_name:sp.subjects.name,teacher_id:teacher.teacher_id,room_id:room.room_id});
        done++;
      }
    };

    // Физкультура — лимит 4 класса на спортзал (суммарно по всем залам)
    const peClasses = shuf(classes.filter(c=>c.study_plan.some(sp=>sp.subjects&&isPE(sp.subjects.name))));
    for(const cls of peClasses){
      for(const sp of cls.study_plan.filter(sp=>sp.subjects&&isPE(sp.subjects.name))){
        const needed=Math.ceil(Number(sp.hours_per_week));
        let done=0;
        const slots=shuf([...allSlots]);
        for(const {day,slot} of slots){
          if(done>=needed) break;
          // Проверяем суммарный лимит спортзала
          if(gymCount(day,slot)>=4) continue;
          if(assign[cls.class_id].some(a=>a.day===day&&a.slot===slot)) continue;
          if(assign[cls.class_id].some(a=>a.day===day&&a.subject_id===sp.subject_id)) continue;
          // Берём любой свободный зал (roomOk теперь смотрит суммарно)
          const gym=gymCabs.find(c=>roomOk(day,slot,c));
          if(!gym) continue;
          const teacher=pickT(sp.subjects.name,teachers,tBusy[day][slot],day,slot);
          if(!teacher) continue;
          gymSC[day][slot]++;
          tBusy[day][slot].add(teacher.teacher_id);
          useRoom(day,slot,gym.room_id);
          assign[cls.class_id].push({day,slot,subject_id:sp.subject_id,subject_name:sp.subjects.name,teacher_id:teacher.teacher_id,room_id:gym.room_id});
          done++;
        }
      }
    }

    // КЕ — лимит 1 класс (2 кабинета сразу)
    const keClasses = shuf(classes.filter(c=>c.study_plan.some(sp=>sp.subjects&&isKorkhem(sp.subjects.name))));
    for(const cls of keClasses){
      for(const sp of cls.study_plan.filter(sp=>sp.subjects&&isKorkhem(sp.subjects.name))){
        const needed=Math.ceil(Number(sp.hours_per_week));
        let done=0;
        const slots=shuf([...allSlots]);
        for(const {day,slot} of slots){
          if(done>=needed) break;
          if(keSC[day][slot]>=1) continue;
          if(assign[cls.class_id].some(a=>a.day===day&&a.slot===slot)) continue;
          if(assign[cls.class_id].some(a=>a.day===day&&a.subject_id===sp.subject_id)) continue;
          if(!keRoomBoys||!keRoomGirls) continue;
          const t1=keMale||keTeachers[0]; if(!t1) continue;
          if(tBusy[day][slot].has(t1.teacher_id)) continue;
          const t2=keFemale.length?keFemale[keFIdx++%keFemale.length]:t1;
          keSC[day][slot]++;
          tBusy[day][slot].add(t1.teacher_id);
          if(t2&&t2.teacher_id!==t1.teacher_id) tBusy[day][slot].add(t2.teacher_id);
          useRoom(day,slot,keRoomBoys.room_id);
          useRoom(day,slot,keRoomGirls.room_id);
          assign[cls.class_id].push({day,slot,subject_id:sp.subject_id,subject_name:sp.subjects.name,teacher_id:t1.teacher_id,room_id:keRoomBoys.room_id});
          assign[cls.class_id].push({day,slot,subject_id:sp.subject_id,subject_name:sp.subjects.name,teacher_id:t2?t2.teacher_id:t1.teacher_id,room_id:keRoomGirls.room_id});
          done++;
        }
      }
    }

    // Химия — лимит 1 класс (1 кабинет 213)
    const chemClasses = shuf(classes.filter(c=>c.study_plan.some(sp=>sp.subjects&&isChem(sp.subjects.name))));
    for(const cls of chemClasses){
      for(const sp of cls.study_plan.filter(sp=>sp.subjects&&isChem(sp.subjects.name))){
        const needed=Math.ceil(Number(sp.hours_per_week));
        tryAssign(cls,sp,needed,null,chemSC,chemCabs.length||1,(_d,_s)=>[...chemCabs]);
      }
    }

    // Биология — лимит 2 класса (кабинеты 104 и 109)
    const bioClasses = shuf(classes.filter(c=>c.study_plan.some(sp=>sp.subjects&&isBio(sp.subjects.name))));
    for(const cls of bioClasses){
      for(const sp of cls.study_plan.filter(sp=>sp.subjects&&isBio(sp.subjects.name))){
        const needed=Math.ceil(Number(sp.hours_per_week));
        let done=0;
        const slots=shuf([...allSlots]);
        for(const {day,slot} of slots){
          if(done>=needed) break;
          if(bioSC[day][slot]>=bioCabs.length) continue;
          if(assign[cls.class_id].some(a=>a.day===day&&a.slot===slot)) continue;
          if(assign[cls.class_id].some(a=>a.day===day&&a.subject_id===sp.subject_id)) continue;
          // Берём свободный биокабинет
          const freeRoom=bioCabs.find(r=>(rCount[day][slot][r.room_id]||0)<1);
          if(!freeRoom) continue;
          const teacher=pickT(sp.subjects.name,teachers,tBusy[day][slot],day,slot);
          if(!teacher) continue;
          bioSC[day][slot]++;
          tBusy[day][slot].add(teacher.teacher_id);
          useRoom(day,slot,freeRoom.room_id);
          assign[cls.class_id].push({day,slot,subject_id:sp.subject_id,subject_name:sp.subjects.name,teacher_id:teacher.teacher_id,room_id:freeRoom.room_id});
          done++;
        }
      }
    }

    // ИТ/Информатика — лимит 3 класса (208,307,308)
    const itClasses = shuf(classes.filter(c=>c.study_plan.some(sp=>sp.subjects&&isIT(sp.subjects.name))));
    for(const cls of itClasses){
      for(const sp of cls.study_plan.filter(sp=>sp.subjects&&isIT(sp.subjects.name))){
        const needed=Math.ceil(Number(sp.hours_per_week));
        let done=0;
        const slots=shuf([...allSlots]);
        for(const {day,slot} of slots){
          if(done>=needed) break;
          if(itSC[day][slot]>=itCabs.length) continue;
          if(assign[cls.class_id].some(a=>a.day===day&&a.slot===slot)) continue;
          if(assign[cls.class_id].some(a=>a.day===day&&a.subject_id===sp.subject_id)) continue;
          const freeRoom=itCabs.find(r=>(rCount[day][slot][r.room_id]||0)<1);
          if(!freeRoom) continue;
          const teacher=pickT(sp.subjects.name,teachers,tBusy[day][slot],day,slot);
          if(!teacher) continue;
          itSC[day][slot]++;
          tBusy[day][slot].add(teacher.teacher_id);
          useRoom(day,slot,freeRoom.room_id);
          assign[cls.class_id].push({day,slot,subject_id:sp.subject_id,subject_name:sp.subjects.name,teacher_id:teacher.teacher_id,room_id:freeRoom.room_id});
          done++;
        }
      }
    }

    // ── ФАЗА 2: Обычные уроки ─────────────────────────────────────────────────
    const newSchedule = [];

    for(const cls of shuf([...classes])){
      const classNum = parseInt(cls.class_name);
      const maxPerDay = classNum>=10?MAX_SR:MAX_JR;

      // Обычные предметы (без спец)
      const lessons = [];
      for(const sp of cls.study_plan){
        if(!sp.subjects) continue;
        const sn=sp.subjects.name;
        if(isPE(sn)||isKorkhem(sn)||isBio(sn)||isChem(sn)||isIT(sn)) continue;
        const hours=Math.ceil(Number(sp.hours_per_week));
        for(let i=0;i<hours;i++) lessons.push({subject_id:sp.subject_id,subject_name:sn,diff:DIFFICULTY(sn,classNum)});
      }

      // dayCount = сколько уже занято в каждый день (из assign)
      const dayCount={};
      for(const d of DAYS) dayCount[d]=assign[cls.class_id].filter(a=>a.day===d).length;

      // Заполняем dayLoad равномерно: сложные первыми
      const sorted=[1,2,3].flatMap(d=>lessons.filter(l=>l.diff===d).sort(()=>Math.random()-.5));
      const dayLoad={}; for(const d of DAYS) dayLoad[d]=[];
      let di=Math.floor(Math.random()*DAYS.length);
      for(const lesson of sorted){
        let placed=false;
        for(let att=0;att<DAYS.length*4;att++){
          const day=DAYS[di%DAYS.length];
          const dup=dayLoad[day].some(l=>l.subject_id===lesson.subject_id);
          if(!dup&&(dayCount[day]+dayLoad[day].length)<maxPerDay){ dayLoad[day].push(lesson); placed=true; di++; break; }
          di++;
        }
        if(!placed){ const best=DAYS.reduce((b,d)=>(dayCount[d]+dayLoad[d].length)<(dayCount[b]+dayLoad[b].length)?d:b,DAYS[0]); dayLoad[best].push(lesson); }
      }
      for(const d of DAYS) dayLoad[d].sort((a,b)=>a.diff-b.diff);

      // Назначаем slot номера — заполняем промежутки между preAssigned
      for(const day of DAYS){
        const takenSlots=new Set(assign[cls.class_id].filter(a=>a.day===day).map(a=>a.slot));
        let s=1;
        for(const lesson of dayLoad[day]){
          while(takenSlots.has(s)) s++;
          const slot=s; takenSlots.add(s); s++;
          const sn=lesson.subject_name;
          const teacher=pickT(sn,teachers,tBusy[day][slot],day,slot);
          if(!teacher) continue;

          const splitTypes=(cls.class_type||"").toLowerCase().split(/[,\-\s]+/).filter(Boolean);
          const shouldSplit=Number(cls.students_count||0)>24&&splitTypes.some(st=>sn.toLowerCase().includes(st));

          if(shouldSplit){
            const r1pool=getRooms(sn,cabinets,true).filter(r=>roomOk(day,slot,r));
            const r1=r1pool[Math.floor(Math.random()*r1pool.length)]||getRooms(sn,cabinets,true)[0]||cabinets.find(c=>!isSpecRoom(c.room_number||""))||cabinets[0];
            const busy2=new Set(tBusy[day][slot]); busy2.add(teacher.teacher_id);
            const t2=pickT(sn,teachers,busy2,day,slot)||teacher;
            const r2pool=getRooms(sn,cabinets,true).filter(r=>roomOk(day,slot,r)&&r.room_id!==r1.room_id);
            const r2=r2pool[Math.floor(Math.random()*r2pool.length)]||r1;
            tBusy[day][slot].add(teacher.teacher_id); tBusy[day][slot].add(t2.teacher_id);
            useRoom(day,slot,r1.room_id);
            newSchedule.push({class_id:cls.class_id,subject_id:lesson.subject_id,teacher_id:teacher.teacher_id,room_id:r1.room_id,day_of_week:day,lesson_num:slot,year});
            if(r2.room_id!==r1.room_id||t2.teacher_id!==teacher.teacher_id){
              useRoom(day,slot,r2.room_id);
              newSchedule.push({class_id:cls.class_id,subject_id:lesson.subject_id,teacher_id:t2.teacher_id,room_id:r2.room_id,day_of_week:day,lesson_num:slot,year});
            }
          } else {
            let room=null;
            if(teacher.classroom) room=cabinets.find(c=>c.room_number.toLowerCase()===teacher.classroom.toLowerCase()&&roomOk(day,slot,c))||null;
            if(!room){ const pool=getRooms(sn,cabinets,false).filter(r=>roomOk(day,slot,r)); room=pool[Math.floor(Math.random()*pool.length)]||getRooms(sn,cabinets,false)[0]||cabinets.find(c=>!isSpecRoom(c.room_number||""))||cabinets[0]; }
            tBusy[day][slot].add(teacher.teacher_id); useRoom(day,slot,room.room_id);
            newSchedule.push({class_id:cls.class_id,subject_id:lesson.subject_id,teacher_id:teacher.teacher_id,room_id:room.room_id,day_of_week:day,lesson_num:slot,year});
          }
        }
      }
    }

    // Добавляем спец-уроки (ФК, КЕ, химия, биология, ИТ)
    for(const cls of classes){
      for(const a of assign[cls.class_id]){
        newSchedule.push({class_id:cls.class_id,subject_id:a.subject_id,teacher_id:a.teacher_id,room_id:a.room_id,day_of_week:a.day,lesson_num:a.slot,year});
      }
    }

    // ── ФАЗА 3: Убираем дыры — переупаковываем номера уроков по порядку ───────
    // Группируем по class_id + day_of_week, сортируем по lesson_num и переназначаем 1,2,3...
    const grouped = {};
    for(const row of newSchedule){
      const key=`${row.class_id}__${row.day_of_week}`;
      if(!grouped[key]) grouped[key]=[];
      grouped[key].push(row);
    }
    for(const key of Object.keys(grouped)){
      // Сортируем по текущему lesson_num
      grouped[key].sort((a,b)=>a.lesson_num-b.lesson_num);
      // Убираем дубли слотов (у подгрупп один и тот же lesson_num — сохраняем)
      // Перенумеруем: все уроки с одинаковым lesson_num получают одинаковый новый номер
      const uniqueSlots=[...new Set(grouped[key].map(r=>r.lesson_num))].sort((a,b)=>a-b);
      const remap={};
      uniqueSlots.forEach((oldSlot,idx)=>{ remap[oldSlot]=idx+1; });
      for(const row of grouped[key]) row.lesson_num=remap[row.lesson_num];
    }

    if(newSchedule.length) await prisma.schedule.createMany({data:newSchedule});
    return new Response(JSON.stringify({success:true,count:newSchedule.length}),{status:200});
  } catch(err){
    console.error("Ошибка генерации:",err);
    return new Response(JSON.stringify({success:false,error:err.message}),{status:500});
  }
}