"use client";

import { useEffect, useState } from "react";

export default function ScheduleView() {
  const [schedule, setSchedule] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const specialSubjects = ["Физра", "Музыка", "Труд"];

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
        if (data.conflict) {
          alert(
            `❌ Учитель ${data.conflict.teacher_name} уже занят (${day_of_week}, урок ${lesson_num}) в классе ${data.conflict.class_name}`
          );
        } else {
          alert("Ошибка: " + data.error);
        }
      } else {
        await fetchSchedule();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  if (loading) return <div>Загрузка расписания...</div>;

  return (
    <div className="p-4 space-y-8">
      <button
        onClick={generateSchedule}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={generating}
      >
        {generating ? "Генерация..." : "Сгенерировать расписание"}
      </button>

      {Object.values(schedule)
        .filter((cls) => {
          const match = cls.class_name.match(/^(\d+)/);
          if (!match) return false;
          const grade = parseInt(match[1], 10);
          return grade >= 5 && grade <= 11;
        })
        .sort((a, b) => {
          const numA = parseInt(a.class_name);
          const numB = parseInt(b.class_name);
          return numA - numB;
        })
        .map((cls) => {
          const maxLessons = Math.max(...Object.values(cls.days).map((day) => day.length));

          return (
            <div key={cls.class_name} className="border p-4 rounded shadow">
              <h2 className="text-2xl font-bold mb-4">{cls.class_name}</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-2">#</th>
                      {days.map((day) => (
                        <th key={day} className="border border-gray-300 p-2">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: maxLessons }).map((_, i) => (
                      <tr key={i}>
                        <td className="border border-gray-300 p-2 text-center">{i + 1}</td>
                        {days.map((day) => {
                          const lessons = cls.days[day]?.filter((l) => l.lesson_num === i + 1) || [];

                          if (!lessons.length)
                            return (
                              <td
                                key={day}
                                className="border border-gray-300 p-2 text-center text-gray-400"
                              >
                                —
                              </td>
                            );

                          return (
                            <td key={day} className="border border-gray-300 p-2">
                              {lessons.map((lesson, idx) => {
                                const isSpecial = specialSubjects.includes(lesson.subject);
                                const bgColor = isSpecial ? "bg-white" : "bg-white";

                                return (
                                  <div
                                    key={idx}
                                    className={`mb-2 p-2 rounded ${bgColor} border border-gray-200`}
                                  >
                                    <div className="font-semibold">
                                      {lesson.subject}
                                      {lesson.group
                                        ? ` (группа ${lesson.group})`
                                        : ""}
                                    </div>

                                    {/* Выпадающий список учителей */}
                                    <select
                                      className="w-full border rounded p-1 text-sm mt-1"
                                      value={lesson.teacher_id || ""}
                                      onChange={(e) =>
                                        updateTeacher(
                                          lesson.schedule_id,
                                          e.target.value,
                                          day,
                                          i + 1
                                        )
                                      }
                                    >
                                      <option value="">Не выбрано</option>
                                      {teachers.map((t) => (
                                        <option key={t.teacher_id} value={t.teacher_id}>
                                          {t.full_name} ({t.subject})
                                        </option>
                                      ))}
                                    </select>

                                    {/* Кабинет */}
                                    <div className="text-sm text-gray-600 mt-1 italic">
                                      Кабинет: {lesson.room || "Не назначен"}
                                    </div>
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
            </div>
          );
        })}
    </div>
  );
}
