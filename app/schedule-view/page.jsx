"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ScheduleView() {
  const [schedule, setSchedule] = useState({});
  const [cabinets, setCabinets] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentClassIndex, setCurrentClassIndex] = useState(0);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const dayNamesRu = {
    Monday: "Понедельник",
    Tuesday: "Вторник",
    Wednesday: "Среда",
    Thursday: "Четверг",
    Friday: "Пятница",
  };

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
        console.log("✅ Расписание сгенерировано:", data.count, "уроков");
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

  const swapLessons = async (sourceScheduleId, targetScheduleId, sourceDay, sourceNum, targetDay, targetNum) => {
    await updatePosition(sourceScheduleId, targetDay, targetNum);
    await updatePosition(targetScheduleId, sourceDay, sourceNum);
  };

  const getInitials = (fullName) => {
    if (!fullName) return "";
    return fullName
      .split(" ")
      .map((n) => n[0].toUpperCase())
      .join(".") + ".";
  };

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
        const maxLessons = Math.max(...Object.values(cls.days).map((day) => day.length));
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

        Object.keys(worksheet).forEach((key) => {
          if (key[0] === "!" || key.includes("ref")) return;
          if (!worksheet[key].s) worksheet[key].s = {};
          worksheet[key].s.alignment = { wrapText: true, vertical: "top" };
        });

        XLSX.utils.book_append_sheet(workbook, worksheet, cls.class_name);
      });

    XLSX.writeFile(workbook, "Расписание.xlsx");
  };

  useEffect(() => {
    fetchSchedule();
    fetchCabinets();
  }, []);

  if (loading) return <div>Загрузка расписания...</div>;

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

  return (
    <>
      <div className="flex flex-col min-h-screen">
  <Header />
  
  <main className="flex-1 p-4 space-y-4">
    <div className="flex items-center gap-4 mb-4">
      <button 
        onClick={prevClass} 
        disabled={currentClassIndex === 0} 
        className="px-4 py-2 bg-[#0a1c3a]  text-white rounded hover:bg-blue-700"
      >
        ←
      </button>
      <span className="font-bold text-lg">{currentClass?.class_name || "Нет данных"}</span>
      <button 
        onClick={nextClass} 
        disabled={currentClassIndex === classesArray.length - 1} 
        className="px-4 py-2 bg-[#0a1c3a]  text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        →
      </button>
    </div>

    <div className="flex gap-4 mb-4">
      <button
        onClick={generateSchedule}
        className="px-4 py-2 bg-[#0a1c3a]  text-white rounded hover:bg-blue-700 disabled:opacity-50"
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
            {Array.from({ length: Math.max(...Object.values(currentClass.days).map(day => day.length)) }).map((_, i) => (
              <tr key={i}>
                <td className="border border-gray-300 p-2 text-center">{i + 1}</td>
                {days.map((day) => {
                  const lessons = currentClass.days[day]?.filter((l) => l.lesson_num === i + 1) || [];
                  if (!lessons.length)
                    return <td key={day} className="border border-gray-300 p-2 text-center text-gray-400">—</td>;

                  return (
                    <td key={day} className="border border-gray-300 p-2">
                      {lessons.map((lesson, idx) => {
                        const teacher = teachers.find((t) => t.teacher_id === lesson.teacher_id);
                        const fullName = teacher ? teacher.full_name : "";
                        const groupLabel = lessons.length > 1 ? ` (${idx + 1} подгруппа)` : "";
                        return (
                          <div 
                            key={idx} 
                            className="mb-2 p-2 rounded bg-white border border-gray-200"
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", JSON.stringify({
                                schedule_id: lesson.schedule_id,
                                day,
                                lesson_num: i + 1
                              }));
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={async (e) => {
                              e.preventDefault();
                              let data;
                              try {
                                data = JSON.parse(e.dataTransfer.getData("text/plain"));
                              } catch (err) {
                                return;
                              }
                              const sourceScheduleId = data.schedule_id;
                              const sourceDay = data.day;
                              const sourceNum = data.lesson_num;
                              const targetScheduleId = lesson.schedule_id;
                              const targetDay = day;
                              const targetNum = i + 1;
                              if (sourceScheduleId === targetScheduleId) return;
                              await swapLessons(sourceScheduleId, targetScheduleId, sourceDay, sourceNum, targetDay, targetNum);
                            }}
                          >
                            <div className="font-semibold">{lesson.subject}{groupLabel}</div>
                            <div className="text-sm mt-1">{fullName}</div>

                            <select
                              className="w-full border rounded p-1 text-sm mt-1"
                              value={lesson.room_id || ""}
                              onChange={(e) =>
                                updateRoom(lesson.schedule_id, e.target.value, day, i + 1)
                              }
                            >
                              <option value="">Не выбрано</option>
                              {cabinets.map((c) => (
                                <option key={c.room_id} value={c.room_id}>
                                  {c.room_number} {c.room_name ? `(${c.room_name})` : ""}
                                </option>
                              ))}
                            </select>

                            <select
                              className="w-full border rounded p-1 text-sm mt-1"
                              value={lesson.teacher_id || ""}
                              onChange={(e) =>
                                updateTeacher(lesson.schedule_id, e.target.value, day, i + 1)
                              }
                            >
                              <option value="">Не выбрано</option>
                              {teachers.map((t) => (
                                <option key={t.teacher_id} value={t.teacher_id}>
                                  {t.full_name} ({t.subject})
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
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
    </>
  );
}