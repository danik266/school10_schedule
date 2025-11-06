"use client";
import { useEffect, useState } from "react";

export default function SchedulePage() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState({ small: [], large: [] });
  const [subjects, setSubjects] = useState([]);
  const [cabinets, setCabinets] = useState([]);

  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCabinet, setSelectedCabinet] = useState("");
  const [hours, setHours] = useState("");
  const [weekData, setWeekData] = useState({
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
  });

  // ✅ Сюда добавляем
  const [existingSchedule, setExistingSchedule] = useState([]);

  // Загружаем учителей, классы и кабинеты
  useEffect(() => {
    fetch("/api/teachers").then(r => r.json()).then(setTeachers);
    fetch("/api/classes").then(r => r.json()).then(setClasses);
    fetch("/api/cabinets").then(r => r.json()).then(setCabinets);

    // ✅ Загружаем существующее расписание
    fetch("/api/schedule")
      .then(r => r.json())
      .then(setExistingSchedule);
  }, []);

  // Загружаем предметы, если выбран класс
  useEffect(() => {
    if (selectedClass) {
      fetch(`/api/subjects/${selectedClass}`)
        .then(r => r.json())
        .then(setSubjects);
    }
  }, [selectedClass]);

  const handleSubjectChange = (e) => {
    const id = e.target.value;
    setSelectedSubject(id);
    const subj = subjects.find(s => s.subject_id == id);
    setHours(subj ? subj.hours_per_week : "");
  };

  const handleInputChange = (day, value) => {
    setWeekData(prev => ({ ...prev, [day]: value }));
  };
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!selectedTeacher || !selectedClass || !selectedSubject) {
    return alert("⚠️ Заполните все обязательные поля!");
  }

  const totalEnteredHours = Object.values(weekData)
    .reduce((sum, val) => sum + (Number(val) || 0), 0);

  if (hours && totalEnteredHours !== Number(hours)) {
    return alert(`⚠️ Сумма введённых часов (${totalEnteredHours}) не совпадает с количеством часов в неделю (${hours})!`);
  }

  // Проверяем существующее расписание
  const conflict = existingSchedule.find(s =>
    s.teacher_id === Number(selectedTeacher) &&
    s.class_id === Number(selectedClass) &&
    s.subject_id === Number(selectedSubject)
  );

if (conflict) {
  const conflictId = conflict.schedule_id; // правильное поле
  const confirmDelete = confirm(
    "⚠️ Такой урок уже есть! Хотите удалить существующую запись и добавить новую?"
  );

  if (confirmDelete) {
    const res = await fetch("/api/schedule", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: conflictId }), // передаем schedule_id
    });

    if (res.ok) {
      alert("✅ Существующая запись удалена");
      setExistingSchedule(prev => prev.filter(s => s.schedule_id !== conflictId));
    } else {
      const data = await res.json();
      alert("❌ Ошибка при удалении: " + data.error);
      return;
    }
  } else return; // отменяем добавление
}


  const teacher = teachers.find(t => t.teacher_id == selectedTeacher);
  let roomNumberToUse = teacher?.classroom || selectedCabinet;

  if (!roomNumberToUse) {
    return alert("⚠️ Выберите кабинет!");
  }

  const cabinetObj = cabinets.find(c => c.room_number === roomNumberToUse);
  let room_id;

  if (cabinetObj) {
    room_id = cabinetObj.room_id;
  } else if (teacher?.classroom) {
    const res = await fetch("/api/cabinets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_number: teacher.classroom,
        room_name: `Кабинет ${teacher.classroom}`,
      }),
    });
    const newCabinet = await res.json();
    room_id = newCabinet.room_id;
  } else {
    room_id = cabinetObj?.room_id;
  }

  const body = {
    teacher_id: Number(selectedTeacher),
    class_id: Number(selectedClass),
    subject_id: Number(selectedSubject),
    room_id: Number(room_id),
    year: new Date().getFullYear(),
    weekData,
  };

  const res = await fetch("/api/schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    alert("✅ Расписание сохранено!");
    // обновляем локальный стейт существующего расписания
    setExistingSchedule(prev => [...prev, body]);
  } else alert("❌ Ошибка при сохранении");
};

  const selectedTeacherObj = teachers.find(t => t.teacher_id == selectedTeacher);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Создание расписания</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "400px",
        }}
      >
        {/* ---- Выбор учителя ---- */}
        <label>
          Учитель:
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
          >
            <option value="">-- Выберите --</option>
            {teachers.map((t) => (
              <option key={t.teacher_id} value={t.teacher_id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </label>

        {/* ---- Если у учителя нет кабинета ---- */}
        {selectedTeacherObj && !selectedTeacherObj.classroom && (
          <label>
            Кабинет:
            <select
              value={selectedCabinet}
              onChange={(e) => setSelectedCabinet(e.target.value)}
            >
              <option value="">-- Выберите кабинет --</option>
              {cabinets.map((c) => (
                <option key={c.room_id} value={c.room_number}>
                  {c.room_number} — {c.room_name || "Без названия"}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* ---- Выбор класса ---- */}
        <label>
          Класс:
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">-- Выберите --</option>
            <optgroup label="До 23 учеников">
              {classes.small.map((c) => (
                <option key={c.class_id} value={c.class_id}>
                  {c.class_name}
                </option>
              ))}
            </optgroup>
            <optgroup label="От 24 учеников">
              {classes.large.map((c) => (
                <option key={c.class_id} value={c.class_id}>
                  {c.class_name}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        {/* ---- Предмет ---- */}
        <label>
          Предмет:
          <select value={selectedSubject} onChange={handleSubjectChange}>
            <option value="">-- Выберите --</option>
            {subjects.map((s) => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        {hours && <p>Количество часов в неделю: <b>{hours}</b></p>}

        {/* ---- Дни недели ---- */}
        {["monday", "tuesday", "wednesday", "thursday", "friday"].map((day) => (
          <label key={day}>
            {day[0].toUpperCase() + day.slice(1)}:
            <input
              type="number"
              min="0"
              max="7"
              value={weekData[day]}
              onChange={(e) => handleInputChange(day, e.target.value)}
            />
          </label>
        ))}

        <button type="submit" style={{ marginTop: "10px" }}>
          💾 Сохранить расписание
        </button>
      </form>
    </div>
  );
}
