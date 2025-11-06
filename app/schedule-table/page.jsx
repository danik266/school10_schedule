"use client";

import { useState, useEffect } from "react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function ScheduleTable() {
  const [schedule, setSchedule] = useState([]);
  const [classesList, setClassesList] = useState([]);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    const res = await fetch("/api/get-schedule");
    const data = await res.json();
    const sched = data.schedule || [];
    setSchedule(sched);

    const classSet = new Set();
    sched.forEach(s => classSet.add(s.classes.class_name));
    setClassesList([...classSet].sort());
  };

  const getLessonsForCell = (className, day) => {
    return schedule
      .filter(s => s.classes.class_name === className && s.day_of_week === day)
      .sort((a, b) => a.lesson_num - b.lesson_num)
      .map(s => `${s.subjects.name} / ${s.teachers.full_name} / ${s.cabinets.room_number}`);
  };

  return (
    <div className="p-4 overflow-auto">
      <h2 className="text-lg font-bold mb-4">Расписание по классам и дням</h2>
      <table className="table-auto border-collapse border border-gray-400">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2">Класс / День</th>
            {days.map(day => (
              <th key={day} className="border border-gray-400 p-2">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {classesList.map(className => (
            <tr key={className}>
              <td className="border border-gray-400 p-2 font-bold">{className}</td>
              {days.map(day => {
                const lessons = getLessonsForCell(className, day);
                return (
                  <td key={day} className="border border-gray-400 p-2">
                    <div className="flex flex-col gap-1">
                      {lessons.length > 0 ? lessons.map((l, i) => (
                        <div key={i} className="border-b border-gray-200 p-1 text-sm">{l}</div>
                      )) : "-"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
