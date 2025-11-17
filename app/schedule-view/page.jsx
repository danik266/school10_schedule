"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Cookies from "js-cookie";

export default function ScheduleView() {
  const [schedule, setSchedule] = useState({});
  const [cabinets, setCabinets] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentClassIndex, setCurrentClassIndex] = useState(0);
  const [openMenus, setOpenMenus] = useState({});
  const [conflicts, setConflicts] = useState([]);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const dayNamesRu = {
    Monday: "Понедельник",
    Tuesday: "Вторник",
    Wednesday: "Среда",
    Thursday: "Четверг",
    Friday: "Пятница",
  };
const [modalOpen, setModalOpen] = useState(false);
const [pendingAction, setPendingAction] = useState(null); 
// { fromCell, toCell, lessonA, lessonB }

function onDrop(lessonA, fromCell, toCell) {
  const target = schedule[toCell];

  // 🟦 1. Если ячейка пустая — просто переносим
  if (!target || target.length === 0) {
    moveLesson(lessonA, fromCell, toCell);
    return;
  }

  // 🟩 2. Если в ячейке один урок — спрашиваем
  if (target.length === 1) {
    setPendingAction({ fromCell, toCell, lessonA, lessonB: target[0] });
    setModalOpen(true);
    return;
  }

  // 🟨 3. Если 2 подгруппы — показываем другое окно (если нужно)
  showSubgroupOptions(lessonA, target);
}
function handleSwap() {
  const { fromCell, toCell, lessonA, lessonB } = pendingAction;

  moveLesson(lessonA, fromCell, toCell);
  moveLesson(lessonB, toCell, fromCell);
}

async function handleGroup() {
  const { moving, targetGroup } = pendingAction;

  // не более 2 подгрупп
  if (targetGroup.length >= 2) return;

  await updatePosition(moving.schedule_id, pendingAction.toCell.day, pendingAction.toCell.num);

  setModalOpen(false);
  await fetchSchedule();
}


  // Авто-выход через 1 минуту
  useEffect(() => {
    const cookieLifetime = 60 * 60 * 24 * 1000; 
// 24 часа
 

    const timer = setTimeout(async () => {
      try {
        await fetch("/api/logout", { method: "POST" });
        console.log("Кука token удалена через 24 часа");
        window.location.href = "/";
      } catch (err) {
        console.error("Ошибка при удалении куки:", err);
      }
    }, cookieLifetime);

    return () => clearTimeout(timer);
  }, []);

  const fetchCabinets = async () => {
    try {
      const res = await fetch("/api/get-cabinets");
      const data = await res.json();
      if (data.success) setCabinets(data.cabinets);
    } catch (err) {
      console.error("Ошибка при загрузке кабинетов:", err);
    }
  };

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/get-schedule");
      const data = await res.json();
      if (data.success) {
        setSchedule(data.schedule);
        setTeachers(data.teachers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateSchedule = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-schedule", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        console.log("Расписание сгенерировано:", data.count, "уроков");
        await fetchSchedule();
      } else {
        console.error("Ошибка генерации:", data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const updateTeacher = async (schedule_id, teacher_id, day_of_week, lesson_num) => {
    try {
      const res = await fetch("/api/update-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule_id, teacher_id, day_of_week, lesson_num }),
      });
      const data = await res.json();
      if (!data.success) {
        alert("Ошибка: " + (data.message || data.error || "Неизвестная ошибка"));
      } else {
        await fetchSchedule();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateRoom = async (schedule_id, room_id, day_of_week, lesson_num) => {
    try {
      const res = await fetch("/api/update-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule_id, room_id, day_of_week, lesson_num }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Ошибка при обновлении кабинета");
      } else {
        await fetchSchedule();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updatePosition = async (schedule_id, day_of_week, lesson_num) => {
    try {
      const res = await fetch("/api/update-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule_id, day_of_week, lesson_num }),
      });
      const data = await res.json();
      if (!data.success) {
        alert("Ошибка: " + data.error);
      } else {
        await fetchSchedule();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isTeacherBusy = (teacher_id, day, lesson_num, currentScheduleId) => {
    return Object.values(schedule).some(cls =>
      cls.days[day]?.some(lesson =>
        lesson.lesson_num === lesson_num &&
        lesson.teacher_id === teacher_id &&
        lesson.schedule_id !== currentScheduleId
      )
    );
  };

  const isRoomBusy = (room_id, day, lesson_num, currentRoomId) => {
    return Object.values(schedule).some(cls =>
      cls.days[day]?.some(lesson =>
        lesson.lesson_num === lesson_num &&
        lesson.room_id === room_id &&
        lesson.room_id !== currentRoomId
      )
    );
  };

  const swapLessons = async (source, target) => {
    const { schedule_id: sId, day: sDay, lesson_num: sNum } = source;
    const { schedule_id: tId, day: tDay, lesson_num: tNum } = target;

    if (sId === tId && sDay === tDay && sNum === tNum) return;

    try {
      await updatePosition(sId, tDay, tNum);
      await updatePosition(tId, sDay, sNum);
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (fullName) => {
    if (!fullName) return "";
    return fullName
      .split(" ")
      .map((n) => n[0].toUpperCase())
      .join(".") + ".";
  };

  const findConflicts = () => {
    const newConflicts = [];

    Object.values(schedule).forEach(cls => {
      const className = cls.class_name;

      days.forEach(day => {
        const lessonsByNumber = {};

        cls.days[day]?.forEach(lesson => {
          if (!lessonsByNumber[lesson.lesson_num]) lessonsByNumber[lesson.lesson_num] = [];
          lessonsByNumber[lesson.lesson_num].push(lesson);
        });

        Object.entries(lessonsByNumber).forEach(([lessonNumStr, group]) => {
          const lessonNum = parseInt(lessonNumStr, 10);

          // 1) Одинаковый кабинет
          const rooms = new Set();
          group.forEach(l => {
            if (rooms.has(l.room_id)) {
              newConflicts.push({
                type: "room_conflict",
                className,
                day,
                lessonNum,
                message: `В классе ${className} на ${day} урок #${lessonNum}: одинаковый кабинет у нескольких групп.`,
              });
            }
            rooms.add(l.room_id);
          });

          // 2) Одинаковый учитель
          const teachersSet = new Set();
          group.forEach(l => {
            if (teachersSet.has(l.teacher_id)) {
              const teacher = teachers.find(t => t.teacher_id === l.teacher_id);
              newConflicts.push({
                type: "teacher_conflict",
                className,
                day,
                lessonNum,
                message: `В классе ${className} на ${day} урок #${lessonNum}: один учитель ведёт несколько подгрупп (${teacher?.full_name}).`,
              });
            }
            teachersSet.add(l.teacher_id);
          });

          // 3) Больше 2 подгрупп
          if (group.length > 2) {
            newConflicts.push({
              type: "subgroups_overflow",
              className,
              day,
              lessonNum,
              message: `В классе ${className} на ${day} урок #${lessonNum}: больше двух подгрупп (${group.length}).`,
            });
          }

          if (group.length === 2) {
            const subjects = new Set(group.map(g => g.subject));
            const classTypes = new Set(group.map(g => g.class_type));

            if (subjects.size > 1) {
              newConflicts.push({
                type: "subgroup_subject_mismatch",
                className,
                day,
                lessonNum,
                message: `В классе ${className} на ${day} урок #${lessonNum}: подгруппы должны быть одного предмета.`,
              });
            }

            const t1 = group[0].teacher_id;
            const t2 = group[1].teacher_id;
            if (t1 === t2) {
              const teacher = teachers.find(t => t.teacher_id === t1);
              newConflicts.push({
                type: "subgroup_same_teacher",
                className,
                day,
                lessonNum,
                message: `В классе ${className} на ${day} урок #${lessonNum}: две подгруппы ведёт один учитель (${teacher?.full_name}).`,
              });
            }
          }
        });
      });
    });

    setConflicts(newConflicts);
  };

  useEffect(() => {
    if (!loading) findConflicts();
  }, [schedule, loading]);

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    Object.values(schedule)
      .filter((cls) => {
        const match = cls.class_name.match(/^(\d+)/);
        if (!match) return false;
        const grade = parseInt(match[1], 10);
        return grade >= 5 && grade <= 11;
      })
      .sort((a, b) => parseInt(a.class_name) - parseInt(b.class_name))
      .forEach((cls) => {
        const maxLessons = Math.max(...Object.values(cls.days).map((day) => day?.length || 0));
        const sheetData = [];
        sheetData.push(["#", ...days.map((d) => dayNamesRu[d])]);

        for (let lessonNum = 1; lessonNum <= maxLessons; lessonNum++) {
          const dayLessons = days.map(
            (day) => cls.days[day]?.filter((l) => l.lesson_num === lessonNum) || []
          );

          const maxGroups = Math.max(...dayLessons.map((lessons) => lessons.length));

          for (let groupIndex = 0; groupIndex < maxGroups; groupIndex++) {
            const row = [lessonNum];
            for (let d = 0; d < days.length; d++) {
              const lessons = dayLessons[d];
              if (lessons[groupIndex]) {
                const lesson = lessons[groupIndex];
                const teacher = teachers.find((t) => t.teacher_id === lesson.teacher_id);
                const initials = teacher ? getInitials(teacher.full_name) : "";

                const cabinet = cabinets.find((c) => c.room_id === lesson.room_id);
                const roomText = cabinet ? `${cabinet.room_number}${cabinet.room_name ? ` (${cabinet.room_name})` : ""}` : "Не назначен";

                let groupLabel = lessons.length > 1 ? ` (${groupIndex + 1} подгруппа)` : "";
                let cellText = `${lesson.subject}${groupLabel} / ${initials} / ${roomText}`;

                row.push(cellText);
              } else {
                row.push("");
              }
            }
            sheetData.push(row);
          }
        }

        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        worksheet["!cols"] = [{ wch: 5 }, ...days.map(() => ({ wch: 40 }))];
        worksheet["!rows"] = sheetData.map(() => ({ hpt: 25 }));

        XLSX.utils.book_append_sheet(workbook, worksheet, cls.class_name);
      });

    XLSX.writeFile(workbook, "Расписание.xlsx");
  };

  useEffect(() => {
    fetchSchedule();
    fetchCabinets();
  }, []);

  if (loading) return <div className="p-4">Загрузка расписания...</div>;

  const classesArray = Object.values(schedule)
    .filter((cls) => {
      const match = cls.class_name.match(/^(\d+)/);
      if (!match) return false;
      const grade = parseInt(match[1], 10);
      return grade >= 5 && grade <= 11;
    })
    .sort((a, b) => parseInt(a.class_name) - parseInt(b.class_name));

  const currentClass = classesArray[currentClassIndex] || null;

  const prevClass = () => setCurrentClassIndex((prev) => Math.max(prev - 1, 0));
  const nextClass = () => setCurrentClassIndex((prev) => Math.min(prev + 1, classesArray.length - 1));

    function SwapOrGroupModal({ open, onClose, onSwap, onGroup }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-4 rounded shadow-md w-80">
        <h3 className="text-lg font-bold mb-4">Выберите действие</h3>

        <button
          className="w-full bg-blue-500 text-white p-2 rounded mb-2"
          onClick={() => { onSwap(); onClose(); }}
        >
          Поменять местами
        </button>

        <button
          className="w-full bg-green-500 text-white p-2 rounded mb-2"
          onClick={() => { onGroup(); onClose(); }}
        >
          Объединить в подгруппы
        </button>

        <button
          className="w-full bg-gray-300 p-2 rounded"
          onClick={onClose}
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
async function handleFullSwap() {
  const { moving, targetGroup } = pendingAction;

  const { schedule_id, day, lesson_num } = moving;

  // 1. Установить одиночный урок на место подгрупп
  await updatePosition(schedule_id, pendingAction.toCell.day, pendingAction.toCell.num);

  // 2. Обе подгруппы двинуть в старую ячейку одиночного урока
  for (const l of targetGroup) {
    await updatePosition(l.schedule_id, day, lesson_num);
  }

  setModalOpen(false);
  await fetchSchedule();
}


  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {conflicts.length > 0 && (
        <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Обнаружены конфликты:</strong>
          <ul className="list-disc pl-5 mt-1">
            {conflicts.map((c, idx) => (
              <li key={idx}>
                {c.message.replace(/Monday|Tuesday|Wednesday|Thursday|Friday/g, (day) => dayNamesRu[day])}
              </li>
            ))}
          </ul>
        </div>
      )}

      <main className="flex-1 p-4 space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={prevClass}
            disabled={currentClassIndex === 0}
            className="px-4 py-2 bg-[#0a1c3a] text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            ←
          </button>
          <span className="font-bold text-lg">{currentClass?.class_name || "Нет данных"}</span>
          <button
            onClick={nextClass}
            disabled={currentClassIndex === classesArray.length - 1}
            className="px-4 py-2 bg-[#0a1c3a] text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            →
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={generateSchedule}
            className="px-4 py-2 bg-[#0a1c3a] text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={generating}
          >
            {generating ? "Генерация..." : "Сгенерировать расписание"}
          </button>

          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Скачать Excel
          </button>
        </div>

        {currentClass && (
          <div className="border p-4 rounded shadow overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2">#</th>
                  {days.map((day) => (
                    <th key={day} className="border border-gray-300 p-2">{dayNamesRu[day]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({
                  length: Math.max(...Object.values(currentClass.days).map(day => day?.length || 0))
                }).map((_, i) => (
                  <tr key={i}>
                    <td className="border border-gray-300 p-2 text-center">{i + 1}</td>
                    {days.map((day) => {
                      const lessons = currentClass.days[day]?.filter(l => l.lesson_num === i + 1) || [];

                      return (
                        <td
                          key={day}
                          className="border border-gray-300 p-2 relative"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={async (e) => {
  e.preventDefault();

  let data;
  try {
    data = JSON.parse(e.dataTransfer.getData("text/plain"));
  } catch (err) {
    return;
  }

  const targetDay = day;
  const targetLessonNum = i + 1;

  // целевые уроки в этой ячейке
  const targetLessons = currentClass.days[targetDay]
    ?.filter(l => l.lesson_num === targetLessonNum) || [];

  const movingCount = data.type === "group" ? data.items.length : 1;

  // 1) если пустая — просто переносим (или переносим группу)
  if (targetLessons.length === 0) {
    if (data.type === "group") {
      for (const item of data.items) {
        await updatePosition(item.schedule_id, targetDay, targetLessonNum);
      }
    } else {
      await updatePosition(data.schedule_id, targetDay, targetLessonNum);
    }
    return;
  }

  // 2) если в цели одна подгруппа и мы тащим одиночный урок -> делать swap (поменять местами)
  if (targetLessons.length === 1 && data.type !== "group") {
    const targetLesson = targetLessons[0];

    // если перетаскиваем на тот же самый урок — ничего не делаем
    if (data.schedule_id === targetLesson.schedule_id &&
        data.day === targetDay &&
        data.lesson_num === targetLesson.lesson_num) {
      return;
    }

    // сначала перемещаем перетаскиваемый урок в целевую ячейку
    await updatePosition(data.schedule_id, targetDay, targetLessonNum);
    // затем перемещаем урок из целевой ячейки в исходную позицию
    await updatePosition(targetLesson.schedule_id, data.day, data.lesson_num);
    return;
  }

  // 3) если в цели 2 подгруппы и мы тащим одиночный урок -> заменить одну из подгрупп (swap с первой)
  
if (targetLessons.length === 2 && data.type !== "group") {
    setPendingAction({
      fromCell: { day: data.day, num: data.lesson_num },
      toCell: { day: targetDay, num: targetLessonNum },
      moving: data,
      targetGroup: targetLessons
    });

    setModalOpen(true);
    return;
}

  // 4) если мы тащим группу (две подгруппы)
  if (data.type === "group") {
    // проверка лимита
    if (targetLessons.length + data.items.length > 2) {
      alert("Нельзя иметь больше 2 подгрупп в одном уроке!");
      return;
    }

    for (const item of data.items) {
      await updatePosition(item.schedule_id, targetDay, targetLessonNum);
    }
    return;
  }

  // 5) оставшийся случай — когда в цели 1 или 2 и мы тащим single, но не попали выше — защита
  if (targetLessons.length + movingCount > 2) {
    alert("Нельзя иметь больше 2 подгрупп в одном уроке!");
    return;
  }

  // fallback: переместить
  if (data.type === "single" || data.type === "single" /* safety */) {
    await updatePosition(data.schedule_id, targetDay, targetLessonNum);
  }
}}

                        >
                          {lessons.length === 0 ? (
                            <div className="text-center text-gray-400 h-full flex items-center justify-center">—</div>
                          ) : (
                            lessons.map((lesson, idx) => {
                              const teacher = teachers.find(t => t.teacher_id === lesson.teacher_id);
                              const fullName = teacher ? teacher.full_name : "";
                              const groupLabel = lessons.length > 1 ? ` (${idx + 1} подгруппа)` : "";

                              return (
                                <div
                                  key={lesson.schedule_id}
                                  className="mb-2 p-2 rounded bg-white border border-gray-200 cursor-move relative"
                                  draggable
                                  onDragStart={(e) => {
  e.dataTransfer.effectAllowed = "move";

  // если в ячейке только один урок → это одиночное перемещение
  if (lessons.length === 1) {
    e.dataTransfer.setData("text/plain", JSON.stringify({
      type: "single",
      schedule_id: lesson.schedule_id,
      day,
      lesson_num: i + 1
    }));
    return;
  }

  // если две подгруппы → передаём обе
  const items = lessons.map(l => ({
    schedule_id: l.schedule_id,
    day,
    lesson_num: i + 1
  }));

  e.dataTransfer.setData("text/plain", JSON.stringify({
    type: "group",
    items
  }));
}}

                                >
                                  <div className="flex justify-between items-center">
                                    <div className="font-semibold">{lesson.subject}{groupLabel}</div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenus(prev => ({
                                          ...prev,
                                          [lesson.schedule_id]: !prev[lesson.schedule_id]
                                        }));
                                      }}
                                      className="text-gray-500 hover:text-gray-700 px-2"
                                    >
                                      ⋮
                                    </button>
                                  </div>

                                  <div className="text-sm mt-1">{fullName}</div>

                                  {openMenus[lesson.schedule_id] && (
                                    <div className="absolute right-0 top-10 bg-white border rounded shadow-lg p-2 z-20 w-48">
                                      <button
                                        className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenMenus(prev => ({ ...prev, [lesson.schedule_id]: false }));
                                        }}
                                      >
                                        ×
                                      </button>

                                      {lessons.length === 1 && (
                                        <button
                                          className="text-sm px-2 py-1 hover:bg-gray-100 rounded w-full text-left"
                                          onClick={async () => {
                                            try {
                                              const res = await fetch("/api/split-lesson", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ schedule_id: lesson.schedule_id }),
                                              });
                                              const data = await res.json();
                                              if (data.success) await fetchSchedule();
                                            } catch (err) {
                                              console.error(err);
                                            }
                                            setOpenMenus(prev => ({ ...prev, [lesson.schedule_id]: false }));
                                          }}
                                        >
                                          Разделить на 2 подгруппы
                                        </button>
                                      )}

                                      {lessons.length === 2 && idx === 0 && (
                                        <button
                                          className="text-sm px-2 py-1 hover:bg-gray-100 rounded w-full text-left"
                                          onClick={async () => {
                                            try {
                                              const res = await fetch("/api/merge-lesson", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ schedule_id: lesson.schedule_id }),
                                              });
                                              const data = await res.json();
                                              if (data.success) await fetchSchedule();
                                            } catch (err) {
                                              console.error(err);
                                            }
                                            setOpenMenus(prev => ({ ...prev, [lesson.schedule_id]: false }));
                                          }}
                                        >
                                          Объединить подгруппы
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  <select
                                    className="w-full border rounded p-1 text-sm mt-1"
                                    value={lesson.room_id || ""}
                                    onChange={(e) => updateRoom(lesson.schedule_id, e.target.value, day, i + 1)}
                                  >
                                    <option value="">Не выбрано</option>
                                    {cabinets.map((c) => (
                                      <option
                                        key={c.room_id}
                                        value={c.room_id}
                                        disabled={isRoomBusy(c.room_id, day, i + 1, lesson.room_id)}
                                      >
                                        {c.room_number} {c.room_name ? `(${c.room_name})` : ""}
                                      </option>
                                    ))}
                                  </select>

                                  <select
                                    className="w-full border rounded p-1 text-sm mt-1"
                                    value={lesson.teacher_id || ""}
                                    onChange={(e) => updateTeacher(lesson.schedule_id, e.target.value, day, i + 1)}
                                  >
                                    <option value="">Не выбрано</option>
                                    {teachers.map((t) => {
                                      const busy = isTeacherBusy(t.teacher_id, day, i + 1, lesson.schedule_id);
                                      return (
                                        <option key={t.teacher_id} value={t.teacher_id} disabled={busy}>
                                          {t.full_name} ({t.subject}) {busy ? "(занят)" : ""}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              );
                            })
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}