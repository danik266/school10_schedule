"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";

export default function ScheduleView() {
  const [schedule, setSchedule] = useState({});
  const [cabinets, setCabinets] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentClassIndex, setCurrentClassIndex] = useState(0);
  const [openMenus, setOpenMenus] = useState({});
  const [conflicts, setConflicts] = useState([]);

  // === СОСТОЯНИЯ ДЛЯ ЗАМЕНЫ УЧИТЕЛЯ ===
  const [sickTeacherId, setSickTeacherId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubstituting, setIsSubstituting] = useState(false);

  // === СОСТОЯНИЕ ДЛЯ ОТЧЕТОВ ПО ЗАМЕНАМ ===
  const [subLogs, setSubLogs] = useState([]);

  const { lang } = useLanguage();
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const t = {
    ru: {
      conflictsDetected: "Обнаружены конфликты:",
      generateSchedule: "Сгенерировать расписание",
      generating: "Генерация...",
      downloadExcel: "Скачать Excel",
      chooseAction: "Выберите действие",
      swap: "Поменять местами",
      group: "Объединить в подгруппы",
      cancel: "Отмена",
      splitLesson: "Разделить на 2 подгруппы",
      mergeLesson: "Объединить подгруппы",
      noData: "Нет данных",
      notAssigned: "Не назначен",
      cannotHaveMoreSubgroups: "Нельзя иметь больше 2 подгрупп в одном уроке!",
      prevClass: "←",
      nextClass: "→",
      selectTeacher: "-- Выберите учителя --",
      findSubstitute: "Найти замену",
      findingSubstitute: "Ищем замену...",
      substituteSuccess:
        "Замены успешно найдены и применены на выбранный период!",
      substituteError: "Выберите учителя и укажите период (С и ПО)!",
      // Переводы для отчета
      subReportTitle: "Отчет по заменам",
      subReportEmpty: "История операций пуста...",
      subLogSuccess: "УСПЕШНО",
      subLogError: "ОШИБКА",
      subLogTeacher: "Учитель",
      subLogReason: "Причина: Болезнь / Отсутствие",
      subLogPeriod: "Период",
      subLogDetails: "Детали",
    },
    kz: {
      conflictsDetected: "Табылған қақтығыстар:",
      generateSchedule: "Кестені генерациялау",
      generating: "Генерацияланады...",
      downloadExcel: "Excel-ге жүктеу",
      chooseAction: "Әрекетті таңдаңыз",
      swap: "Орындарын ауыстыру",
      group: "Топтарға біріктіру",
      cancel: "Болдырмау",
      splitLesson: "2 топқа бөлу",
      mergeLesson: "Топтарды біріктіру",
      noData: "Деректер жоқ",
      notAssigned: "Белгіленбеген",
      cannotHaveMoreSubgroups: "Бір сабақта 2 топтан артық болмауы керек!",
      prevClass: "←",
      nextClass: "→",
      selectTeacher: "-- Мұғалімді таңдаңыз --",
      findSubstitute: "Алмастырушыны табу",
      findingSubstitute: "Іздестіруде...",
      substituteSuccess:
        "Алмастырушылар таңдалған кезеңге сәтті табылды және тағайындалды!",
      substituteError: "Мұғалімді таңдап, кезеңді (ДЕН және ДЕЙІН) көрсетіңіз!",
      // Переводы для отчета
      subReportTitle: "Алмастыру есебі",
      subReportEmpty: "Операциялар тарихы бос...",
      subLogSuccess: "СӘТТІ",
      subLogError: "ҚАТЕ",
      subLogTeacher: "Мұғалім",
      subLogReason: "Себебі: Ауру / Болмауы",
      subLogPeriod: "Кезең",
      subLogDetails: "Толығырақ",
    },
  };

  const dayNames = {
    ru: {
      Monday: "Понедельник",
      Tuesday: "Вторник",
      Wednesday: "Среда",
      Thursday: "Четверг",
      Friday: "Пятница",
    },
    kz: {
      Monday: "Дүйсенбі",
      Tuesday: "Сейсенбі",
      Wednesday: "Сәрсенбі",
      Thursday: "Бейсенбі",
      Friday: "Жұма",
    },
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  function onDrop(lessonA, fromCell, toCell) {
    const target = schedule[toCell];
    if (!target || target.length === 0) {
      moveLesson(lessonA, fromCell, toCell);
      return;
    }
    if (target.length === 1) {
      setPendingAction({ fromCell, toCell, lessonA, lessonB: target[0] });
      setModalOpen(true);
      return;
    }
    showSubgroupOptions(lessonA, target);
  }

  function handleSwap() {
    const { fromCell, toCell, lessonA, lessonB } = pendingAction;
    moveLesson(lessonA, fromCell, toCell);
    moveLesson(lessonB, toCell, fromCell);
  }

  async function handleGroup() {
    const { moving, targetGroup } = pendingAction;
    if (targetGroup.length >= 2) return;
    await updatePosition(
      moving.schedule_id,
      pendingAction.toCell.day,
      pendingAction.toCell.num,
    );
    setModalOpen(false);
    await fetchSchedule();
  }

  useEffect(() => {
    const cookieLifetime = 60 * 60 * 24 * 1000;
    const timer = setTimeout(async () => {
      try {
        await fetch("/api/logout", { method: "POST" });
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

  // === ОБНОВЛЕННЫЙ ПОИСК ЗАМЕНЫ (ПОДРОБНЫЙ ЛОГ) ===
  const handleSubstitute = async () => {
    if (!sickTeacherId || !startDate || !endDate) {
      return alert(t[lang].substituteError);
    }
    if (new Date(endDate) < new Date(startDate)) {
      return alert("Дата окончания не может быть раньше даты начала!");
    }

    setIsSubstituting(true);
    const selectedTeacherObj = teachers.find(
      (t) => t.teacher_id === sickTeacherId,
    );
    const teacherName = selectedTeacherObj
      ? selectedTeacherObj.full_name
      : "Неизвестный";

    // Форматируем текущую дату и время операции
    const now = new Date();
    const actionDateTime = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    try {
      const res = await fetch("/api/substitute-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: sickTeacherId,
          startDate: startDate,
          endDate: endDate,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(t[lang].substituteSuccess);
        // Записываем успех в подробный отчет
        setSubLogs((prev) => [
          {
            id: Date.now(),
            timestamp: actionDateTime,
            teacher: teacherName,
            period: `${startDate} — ${endDate}`,
            reason: t[lang].subLogReason,
            status: "success",
            details: data.message || "Свободные учителя найдены и назначены",
          },
          ...prev,
        ]);

        setSickTeacherId("");
        setStartDate("");
        setEndDate("");
        await fetchSchedule();
      } else {
        alert(data.message || data.error || "Ошибка при поиске замены");
        // Записываем ошибку в отчет
        setSubLogs((prev) => [
          {
            id: Date.now(),
            timestamp: actionDateTime,
            teacher: teacherName,
            period: `${startDate} — ${endDate}`,
            reason: t[lang].subLogReason,
            status: "error",
            details: data.message || data.error || "Сбой системы",
          },
          ...prev,
        ]);
      }
    } catch (error) {
      console.error("Ошибка замены:", error);
      alert("Ошибка сети при попытке сделать замену");
      setSubLogs((prev) => [
        {
          id: Date.now(),
          timestamp: actionDateTime,
          teacher: teacherName,
          period: `${startDate} — ${endDate}`,
          reason: t[lang].subLogReason,
          status: "error",
          details: "Ошибка сети или сервер недоступен",
        },
        ...prev,
      ]);
    } finally {
      setIsSubstituting(false);
    }
  };

  const updateTeacher = async (
    schedule_id,
    teacher_id,
    day_of_week,
    lesson_num,
  ) => {
    try {
      const res = await fetch("/api/update-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_id,
          teacher_id,
          day_of_week,
          lesson_num,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(
          "Ошибка: " + (data.message || data.error || "Неизвестная ошибка"),
        );
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
    return Object.values(schedule).some((cls) =>
      cls.days[day]?.some(
        (lesson) =>
          lesson.lesson_num === lesson_num &&
          lesson.teacher_id === teacher_id &&
          lesson.schedule_id !== currentScheduleId,
      ),
    );
  };

  const isRoomBusy = (room_id, day, lesson_num, currentRoomId) => {
    return Object.values(schedule).some((cls) =>
      cls.days[day]?.some(
        (lesson) =>
          lesson.lesson_num === lesson_num &&
          lesson.room_id === room_id &&
          lesson.room_id !== currentRoomId,
      ),
    );
  };

  const getInitials = (fullName) => {
    if (!fullName) return "";
    return (
      fullName
        .split(" ")
        .map((n) => n[0].toUpperCase())
        .join(".") + "."
    );
  };

  const findConflicts = () => {
    const newConflicts = [];
    Object.values(schedule).forEach((cls) => {
      const className = cls.class_name;
      days.forEach((day) => {
        const lessonsByNumber = {};
        cls.days[day]?.forEach((lesson) => {
          if (!lessonsByNumber[lesson.lesson_num])
            lessonsByNumber[lesson.lesson_num] = [];
          lessonsByNumber[lesson.lesson_num].push(lesson);
        });

        Object.entries(lessonsByNumber).forEach(([lessonNumStr, group]) => {
          const lessonNum = parseInt(lessonNumStr, 10);
          const rooms = new Set();
          group.forEach((l) => {
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

          const teachersSet = new Set();
          group.forEach((l) => {
            if (teachersSet.has(l.teacher_id)) {
              const teacher = teachers.find(
                (t) => t.teacher_id === l.teacher_id,
              );
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
            const subjects = new Set(group.map((g) => g.subject));
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
              const teacher = teachers.find((t) => t.teacher_id === t1);
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
        const maxLessons = Math.max(
          ...Object.values(cls.days).map((day) => day?.length || 0),
        );
        const sheetData = [];
        sheetData.push(["#", ...days.map((d) => dayNames[lang][d])]);

        for (let lessonNum = 1; lessonNum <= maxLessons; lessonNum++) {
          const dayLessons = days.map(
            (day) =>
              cls.days[day]?.filter((l) => l.lesson_num === lessonNum) || [],
          );
          const maxGroups = Math.max(
            ...dayLessons.map((lessons) => lessons.length),
          );

          for (let groupIndex = 0; groupIndex < maxGroups; groupIndex++) {
            const row = [lessonNum];
            for (let d = 0; d < days.length; d++) {
              const lessons = dayLessons[d];
              if (lessons[groupIndex]) {
                const lesson = lessons[groupIndex];
                const teacher = teachers.find(
                  (t) => t.teacher_id === lesson.teacher_id,
                );
                const initials = teacher ? getInitials(teacher.full_name) : "";
                const cabinet = cabinets.find(
                  (c) => c.room_id === lesson.room_id,
                );
                const roomText = cabinet
                  ? `${cabinet.room_number}${cabinet.room_name ? ` (${cabinet.room_name})` : ""}`
                  : "Не назначен";
                let groupLabel =
                  lessons.length > 1 ? ` (${groupIndex + 1} подгруппа)` : "";
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
  const nextClass = () =>
    setCurrentClassIndex((prev) => Math.min(prev + 1, classesArray.length - 1));

  function SwapOrGroupModal({ open, onClose, onSwap, onGroup }) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white p-4 rounded shadow-md w-80">
          <h3 className="text-lg font-bold mb-4">Выберите действие</h3>
          <button
            className="w-full bg-blue-500 text-white p-2 rounded mb-2 hover:bg-blue-600"
            onClick={() => {
              onSwap();
              onClose();
            }}
          >
            Поменять местами
          </button>
          <button
            className="w-full bg-green-500 text-white p-2 rounded mb-2 hover:bg-green-600"
            onClick={() => {
              onGroup();
              onClose();
            }}
          >
            Объединить в подгруппы
          </button>
          <button
            className="w-full bg-gray-300 p-2 rounded hover:bg-gray-400"
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
    await updatePosition(
      schedule_id,
      pendingAction.toCell.day,
      pendingAction.toCell.num,
    );
    for (const l of targetGroup) {
      await updatePosition(l.schedule_id, day, lesson_num);
    }
    setModalOpen(false);
    await fetchSchedule();
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      {conflicts.length > 0 && (
        <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded shadow-sm">
          <strong>Обнаружены конфликты:</strong>
          <ul className="list-disc pl-5 mt-1 text-sm">
            {conflicts.map((c, idx) => (
              <li key={idx}>
                {c.message.replace(
                  /Monday|Tuesday|Wednesday|Thursday|Friday/g,
                  (d) => dayNames[lang][d],
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ОСНОВНОЙ КОНТЕЙНЕР РАЗДЕЛЕН НА 2 КОЛОНКИ: ОТЧЕТЫ (СЛЕВА) И ТАБЛИЦА (СПРАВА) */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* ===== ЛЕВЫЙ САЙДБАР (ПОДРОБНЫЙ ОТЧЕТ ПО ЗАМЕНАМ) ===== */}
        <aside className="w-full lg:w-80 xl:w-96 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 p-4 shadow-sm flex flex-col shrink-0 lg:h-[calc(100vh-140px)] lg:sticky lg:top-0">
          <div className="font-bold text-lg text-[#0d254c] border-b border-gray-200 pb-3 mb-4 flex items-center justify-between">
            <span>{t[lang].subReportTitle}</span>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              {subLogs.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300">
            {subLogs.length === 0 ? (
              <div className="text-gray-400 text-sm italic text-center mt-10">
                {t[lang].subReportEmpty}
              </div>
            ) : (
              subLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border-l-4 shadow-sm text-sm bg-white border ${
                    log.status === "success"
                      ? "border-l-green-500 border-gray-100"
                      : "border-l-red-500 border-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 text-xs font-mono">
                      {log.timestamp}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded tracking-wide uppercase ${
                        log.status === "success"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {log.status === "success"
                        ? t[lang].subLogSuccess
                        : t[lang].subLogError}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-[10px] uppercase tracking-wider">
                        {t[lang].subLogTeacher}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {log.teacher}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-gray-400 text-[10px] uppercase tracking-wider">
                        {t[lang].subLogPeriod}
                      </span>
                      <span className="text-gray-700 font-medium">
                        {log.period}
                      </span>
                    </div>

                    <div className="text-gray-600 text-xs mt-1 bg-gray-50 p-1.5 rounded border border-gray-100">
                      <span className="font-medium text-gray-500 block mb-0.5">
                        {log.reason}
                      </span>
                      <span
                        className={
                          log.status === "success"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {log.details}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ===== ОСНОВНОЙ КОНТЕНТ (РАСПИСАНИЕ) ===== */}
        <main className="flex-1 p-4 space-y-4 w-full">
          {/* ПАНЕЛЬ ЗАМЕНЫ УЧИТЕЛЯ (ВВЕРХУ) */}
          <div className="bg-red-50 border border-red-200 shadow-sm rounded-lg p-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 w-full">
            <div>
              <h3 className="text-red-800 font-bold mb-1">
                Режим замены (Болезнь / Отсутствие)
              </h3>
              <p className="text-sm text-red-600">
                Выберите учителя и период, чтобы автоматически назначить
                свободных учителей на его уроки.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-3 w-full xl:w-auto">
              <select
                className="w-full lg:w-auto border border-red-300 p-2 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                value={sickTeacherId}
                onChange={(e) => setSickTeacherId(e.target.value)}
              >
                <option value="">{t[lang].selectTeacher}</option>
                {teachers.map((t) => (
                  <option key={t.teacher_id} value={t.teacher_id}>
                    {t.full_name} ({t.subject})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 w-full lg:w-auto">
                <input
                  type="date"
                  className="w-full lg:w-auto border border-red-300 p-2 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-red-800 font-bold">-</span>
                <input
                  type="date"
                  className="w-full lg:w-auto border border-red-300 p-2 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <button
                onClick={handleSubstitute}
                disabled={isSubstituting}
                className="w-full lg:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium transition disabled:bg-red-400 flex justify-center whitespace-nowrap"
              >
                {isSubstituting
                  ? t[lang].findingSubstitute
                  : t[lang].findSubstitute}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={prevClass}
                disabled={currentClassIndex === 0}
                className="px-4 py-2 bg-[#0a1c3a] text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
              >
                ←
              </button>
              <span className="font-bold text-lg min-w-[80px] text-center flex items-center justify-center">
                {currentClass?.class_name || t[lang].noData}
              </span>
              <button
                onClick={nextClass}
                disabled={currentClassIndex === classesArray.length - 1}
                className="px-4 py-2 bg-[#0a1c3a] text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
              >
                →
              </button>
            </div>

            <div className="flex gap-4 ml-auto flex-wrap justify-end">
              <button
                onClick={generateSchedule}
                className="px-4 py-2 bg-[#0a1c3a] text-white rounded hover:bg-blue-700 disabled:opacity-50 transition font-medium"
                disabled={generating}
              >
                {generating ? t[lang].generating : t[lang].generateSchedule}
              </button>

              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
              >
                {t[lang].downloadExcel}
              </button>
            </div>
          </div>

          {currentClass && (
            <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="border-r border-gray-200 p-3 text-gray-700 font-semibold w-12 text-center">
                      #
                    </th>
                    {days.map((day) => (
                      <th
                        key={day}
                        className="border-r border-gray-200 p-3 text-gray-700 font-semibold min-w-[200px]"
                      >
                        {dayNames[lang][day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({
                    length: Math.max(
                      ...Object.values(currentClass.days).map(
                        (day) => day?.length || 0,
                      ),
                    ),
                  }).map((_, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-200 hover:bg-gray-50/50"
                    >
                      <td className="border-r border-gray-200 p-2 text-center font-medium text-gray-500 bg-gray-50">
                        {i + 1}
                      </td>
                      {days.map((day) => {
                        const lessons =
                          currentClass.days[day]?.filter(
                            (l) => l.lesson_num === i + 1,
                          ) || [];

                        return (
                          <td
                            key={day}
                            className="border-r border-gray-200 p-2 relative align-top"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={async (e) => {
                              e.preventDefault();
                              let data;
                              try {
                                data = JSON.parse(
                                  e.dataTransfer.getData("text/plain"),
                                );
                              } catch (err) {
                                return;
                              }

                              const targetDay = day;
                              const targetLessonNum = i + 1;
                              const targetLessons =
                                currentClass.days[targetDay]?.filter(
                                  (l) => l.lesson_num === targetLessonNum,
                                ) || [];
                              const movingCount =
                                data.type === "group" ? data.items.length : 1;

                              if (targetLessons.length === 0) {
                                if (data.type === "group") {
                                  for (const item of data.items) {
                                    await updatePosition(
                                      item.schedule_id,
                                      targetDay,
                                      targetLessonNum,
                                    );
                                  }
                                } else {
                                  await updatePosition(
                                    data.schedule_id,
                                    targetDay,
                                    targetLessonNum,
                                  );
                                }
                                return;
                              }

                              if (
                                targetLessons.length === 1 &&
                                data.type !== "group"
                              ) {
                                const targetLesson = targetLessons[0];
                                if (
                                  data.schedule_id ===
                                    targetLesson.schedule_id &&
                                  data.day === targetDay &&
                                  data.lesson_num === targetLesson.lesson_num
                                )
                                  return;
                                await updatePosition(
                                  data.schedule_id,
                                  targetDay,
                                  targetLessonNum,
                                );
                                await updatePosition(
                                  targetLesson.schedule_id,
                                  data.day,
                                  data.lesson_num,
                                );
                                return;
                              }

                              if (
                                targetLessons.length === 2 &&
                                data.type !== "group"
                              ) {
                                setPendingAction({
                                  fromCell: {
                                    day: data.day,
                                    num: data.lesson_num,
                                  },
                                  toCell: {
                                    day: targetDay,
                                    num: targetLessonNum,
                                  },
                                  moving: data,
                                  targetGroup: targetLessons,
                                });
                                setModalOpen(true);
                                return;
                              }

                              if (data.type === "group") {
                                if (
                                  targetLessons.length + data.items.length >
                                  2
                                ) {
                                  alert(t[lang].cannotHaveMoreSubgroups);
                                  return;
                                }
                                for (const item of data.items) {
                                  await updatePosition(
                                    item.schedule_id,
                                    targetDay,
                                    targetLessonNum,
                                  );
                                }
                                return;
                              }

                              if (targetLessons.length + movingCount > 2) {
                                alert(t[lang].cannotHaveMoreSubgroups);
                                return;
                              }

                              if (data.type === "single") {
                                await updatePosition(
                                  data.schedule_id,
                                  targetDay,
                                  targetLessonNum,
                                );
                              }
                            }}
                          >
                            {lessons.length === 0 ? (
                              <div className="text-center text-gray-300 h-full flex items-center justify-center min-h-[80px]">
                                Пусто
                              </div>
                            ) : (
                              lessons.map((lesson, idx) => {
                                const teacher = teachers.find(
                                  (t) => t.teacher_id === lesson.teacher_id,
                                );
                                const fullName = teacher
                                  ? teacher.full_name
                                  : "";
                                const groupLabel =
                                  lessons.length > 1
                                    ? ` (${idx + 1} подгруппа)`
                                    : "";

                                return (
                                  <div
                                    key={lesson.schedule_id}
                                    className="mb-2 p-3 rounded-md bg-white border border-gray-200 shadow-sm cursor-move relative hover:border-blue-300 transition"
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.effectAllowed = "move";
                                      if (lessons.length === 1) {
                                        e.dataTransfer.setData(
                                          "text/plain",
                                          JSON.stringify({
                                            type: "single",
                                            schedule_id: lesson.schedule_id,
                                            day,
                                            lesson_num: i + 1,
                                          }),
                                        );
                                        return;
                                      }
                                      const items = lessons.map((l) => ({
                                        schedule_id: l.schedule_id,
                                        day,
                                        lesson_num: i + 1,
                                      }));
                                      e.dataTransfer.setData(
                                        "text/plain",
                                        JSON.stringify({
                                          type: "group",
                                          items,
                                        }),
                                      );
                                    }}
                                  >
                                    <div className="flex justify-between items-start mb-1">
                                      <div className="font-bold text-gray-800 text-sm leading-tight pr-4">
                                        {lesson.subject}
                                        {groupLabel}
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenMenus((prev) => ({
                                            ...prev,
                                            [lesson.schedule_id]:
                                              !prev[lesson.schedule_id],
                                          }));
                                        }}
                                        className="text-gray-400 hover:text-gray-800 absolute top-2 right-2 leading-none"
                                      >
                                        ⋮
                                      </button>
                                    </div>

                                    <div
                                      className="text-xs text-gray-600 mb-2 truncate"
                                      title={fullName}
                                    >
                                      {fullName}
                                    </div>

                                    {openMenus[lesson.schedule_id] && (
                                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded shadow-xl p-1 z-20 w-48">
                                        <button
                                          className="absolute top-1 right-1 text-gray-400 hover:text-gray-800 p-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenus((prev) => ({
                                              ...prev,
                                              [lesson.schedule_id]: false,
                                            }));
                                          }}
                                        >
                                          ✕
                                        </button>
                                        {lessons.length === 1 && (
                                          <button
                                            className="text-sm px-3 py-2 hover:bg-gray-100 rounded w-full text-left mt-4"
                                            onClick={async () => {
                                              try {
                                                const res = await fetch(
                                                  "/api/split-lesson",
                                                  {
                                                    method: "POST",
                                                    headers: {
                                                      "Content-Type":
                                                        "application/json",
                                                    },
                                                    body: JSON.stringify({
                                                      schedule_id:
                                                        lesson.schedule_id,
                                                    }),
                                                  },
                                                );
                                                const data = await res.json();
                                                if (data.success)
                                                  await fetchSchedule();
                                              } catch (err) {
                                                console.error(err);
                                              }
                                              setOpenMenus((prev) => ({
                                                ...prev,
                                                [lesson.schedule_id]: false,
                                              }));
                                            }}
                                          >
                                            Разделить на 2 подгруппы
                                          </button>
                                        )}
                                        {lessons.length === 2 && idx === 0 && (
                                          <button
                                            className="text-sm px-3 py-2 hover:bg-gray-100 rounded w-full text-left mt-4"
                                            onClick={async () => {
                                              try {
                                                const res = await fetch(
                                                  "/api/merge-lesson",
                                                  {
                                                    method: "POST",
                                                    headers: {
                                                      "Content-Type":
                                                        "application/json",
                                                    },
                                                    body: JSON.stringify({
                                                      schedule_id:
                                                        lesson.schedule_id,
                                                    }),
                                                  },
                                                );
                                                const data = await res.json();
                                                if (data.success)
                                                  await fetchSchedule();
                                              } catch (err) {
                                                console.error(err);
                                              }
                                              setOpenMenus((prev) => ({
                                                ...prev,
                                                [lesson.schedule_id]: false,
                                              }));
                                            }}
                                          >
                                            Объединить подгруппы
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    <select
                                      className="w-full border border-gray-300 rounded p-1.5 text-xs mt-1 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                                      value={lesson.room_id || ""}
                                      onChange={(e) =>
                                        updateRoom(
                                          lesson.schedule_id,
                                          e.target.value,
                                          day,
                                          i + 1,
                                        )
                                      }
                                    >
                                      <option value="">Без кабинета</option>
                                      {cabinets.map((c) => (
                                        <option
                                          key={c.room_id}
                                          value={c.room_id}
                                          disabled={isRoomBusy(
                                            c.room_id,
                                            day,
                                            i + 1,
                                            lesson.room_id,
                                          )}
                                        >
                                          {c.room_number}{" "}
                                          {c.room_name
                                            ? `(${c.room_name})`
                                            : ""}
                                        </option>
                                      ))}
                                    </select>

                                    <select
                                      className="w-full border border-gray-300 rounded p-1.5 text-xs mt-1.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                                      value={lesson.teacher_id || ""}
                                      onChange={(e) =>
                                        updateTeacher(
                                          lesson.schedule_id,
                                          e.target.value,
                                          day,
                                          i + 1,
                                        )
                                      }
                                    >
                                      <option value="">Без учителя</option>
                                      {teachers.map((t) => {
                                        const busy = isTeacherBusy(
                                          t.teacher_id,
                                          day,
                                          i + 1,
                                          lesson.schedule_id,
                                        );
                                        return (
                                          <option
                                            key={t.teacher_id}
                                            value={t.teacher_id}
                                            disabled={busy}
                                          >
                                            {t.full_name}{" "}
                                            {busy ? "(занят)" : ""}
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
      </div>

      <SwapOrGroupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSwap={handleFullSwap}
        onGroup={handleGroup}
      />

      <Footer />
    </div>
  );
}
