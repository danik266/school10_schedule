"use client";

import { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, className = "", strokeWidth = 1.75, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
    strokeLinejoin="round" className={className} style={{ flexShrink: 0 }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const Icons = {
  AlertTriangle: () => <Icon d={["M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z","M12 9v4","M12 17h.01"]} />,
  Wrench: () => <Icon d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />,
  ChevronLeft: () => <Icon d="M15 18l-6-6 6-6" />,
  ChevronRight: () => <Icon d="M9 18l6-6-6-6" />,
  Download: () => <Icon d={["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M7 10l5 5 5-5","M12 15V3"]} />,
  Save: () => <Icon d={["M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z","M17 21v-8H7v8","M7 3v5h8"]} />,
  Upload: () => <Icon d={["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M17 8l-5-5-5 5","M12 3v12"]} />,
  Trash2: () => <Icon d={["M3 6h18","M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2","M10 11v6","M14 11v6"]} />,
  Plus: () => <Icon d={["M12 5v14","M5 12h14"]} />,
  X: () => <Icon d={["M18 6L6 18","M6 6l12 12"]} />,
  MoreVertical: () => <Icon d={["M12 12h.01","M12 5h.01","M12 19h.01"]} strokeWidth={2.5} />,
  Scissors: () => <Icon d={["M6 9a3 3 0 100-6 3 3 0 000 6z","M6 15a3 3 0 100 6 3 3 0 000-6z","M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"]} />,
  Link: () => <Icon d={["M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71","M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"]} />,
  RefreshCw: () => <Icon d={["M23 4v6h-6","M1 20v-6h6","M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"]} />,
  Users: () => <Icon d={["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2","M23 21v-2a4 4 0 00-3-3.87","M16 3.13a4 4 0 010 7.75"]} />,
  User: () => <Icon d={["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2","M12 3a4 4 0 100 8 4 4 0 000-8z"]} />,
  CheckCircle: () => <Icon d={["M22 11.08V12a10 10 0 11-5.93-9.14","M22 4L12 14.01l-3-3"]} />,
  XCircle: () => <Icon d={["M12 2a10 10 0 100 20A10 10 0 0012 2z","M15 9l-6 6","M9 9l6 6"]} />,
  TrendingUp: () => <Icon d={["M23 6l-9.5 9.5-5-5L1 18","M17 6h6v6"]} />,
  TrendingDown: () => <Icon d={["M23 18l-9.5-9.5-5 5L1 6","M17 18h6v-6"]} />,
  BarChart2: () => <Icon d={["M18 20V10","M12 20V4","M6 20v-6"]} />,
  Calendar: () => <Icon d={["M3 4h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2z","M16 2v4","M8 2v4","M3 10h18"]} />,
  Search: () => <Icon d={["M11 17a6 6 0 100-12 6 6 0 000 12z","M21 21l-4.35-4.35"]} />,
  Eye: () => <Icon d={["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 9a3 3 0 100 6 3 3 0 000-6z"]} />,
  Zap: () => <Icon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  BookOpen: () => <Icon d={["M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z","M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"]} />,
  Info: () => <Icon d={["M12 2a10 10 0 100 20A10 10 0 0012 2z","M12 8h.01","M11 12h1v4h1"]} />,
  AlertOctagon: () => <Icon d={["M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z","M12 8v4","M12 16h.01"]} />,
  Menu: () => <Icon d={["M3 12h18","M3 6h18","M3 18h18"]} />,
};

// ── Confirm Modal Component ────────────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, variant = "danger", confirmText = "Подтвердить", cancelText = "Отмена" }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="sv-overlay" onClick={onCancel}>
      <div className="sv-modal sv-modal-sm sv-modal-enter" onClick={e => e.stopPropagation()}>
        <div className={`sv-confirm-icon sv-confirm-icon-${variant}`}>
          {variant === "danger" ? <Icons.AlertOctagon /> : <Icons.Info />}
        </div>
        <div style={{ padding: "0 24px 24px" }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--sv-text)", marginBottom: 8, textAlign: "center" }}>{title}</h3>
          <p style={{ fontSize: 14, color: "var(--sv-text2)", textAlign: "center", lineHeight: 1.6 }}>{message}</p>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button className="sv-btn sv-btn-ghost" style={{ flex: 1 }} onClick={onCancel}>{cancelText}</button>
            <button className={`sv-btn ${variant === "danger" ? "sv-btn-danger" : "sv-btn-primary"}`} style={{ flex: 1 }} onClick={onConfirm}>{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Hook: useConfirm ────────────────────────────────────────────────────────────
function useConfirm() {
  const [state, setState] = useState({ isOpen: false, resolve: null, title: "", message: "", variant: "danger", confirmText: "Подтвердить" });
  const confirm = useCallback(({ title, message, variant = "danger", confirmText = "Подтвердить" }) => {
    return new Promise(resolve => setState({ isOpen: true, resolve, title, message, variant, confirmText }));
  }, []);
  const handleConfirm = () => { state.resolve(true); setState(s => ({ ...s, isOpen: false })); };
  const handleCancel = () => { state.resolve(false); setState(s => ({ ...s, isOpen: false })); };
  const Modal = () => (
    <ConfirmModal isOpen={state.isOpen} title={state.title} message={state.message} variant={state.variant} confirmText={state.confirmText} onConfirm={handleConfirm} onCancel={handleCancel} />
  );
  return { confirm, Modal };
}

export default function ScheduleView() {
  const [schedule, setSchedule] = useState({});
  const [cabinets, setCabinets] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentClassIndex, setCurrentClassIndex] = useState(0);
  const [openMenus, setOpenMenus] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sickTeacherId, setSickTeacherId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubstituting, setIsSubstituting] = useState(false);

  const [toasts, setToasts] = useState([]);
  const [snapshotModal, setSnapshotModal] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotName, setSnapshotName] = useState("");
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);

  const [classStats, setClassStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [addModal, setAddModal] = useState(null);
  const [addForm, setAddForm] = useState({ subject_id: "", teacher_id: "", room_id: "" });

  const [freeTeachersDay, setFreeTeachersDay] = useState("Monday");
  const [activeTab, setActiveTab] = useState("stats");
  const [fixingConflict, setFixingConflict] = useState(null);

  const { confirm, Modal: ConfirmModalComponent } = useConfirm();

  const { lang } = useLanguage();
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const dayNames = {
    ru: { Monday: "Понедельник", Tuesday: "Вторник", Wednesday: "Среда", Thursday: "Четверг", Friday: "Пятница" },
    kz: { Monday: "Дүйсенбі", Tuesday: "Сейсенбі", Wednesday: "Сәрсенбі", Thursday: "Бейсенбі", Friday: "Жұма" },
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      try { await fetch("/api/logout", { method: "POST" }); window.location.href = "/"; } catch {}
    }, 60 * 60 * 24 * 1000);
    return () => clearTimeout(timer);
  }, []);

  const fetchCabinets = async () => {
    try { const res = await fetch("/api/get-cabinets"); const data = await res.json(); if (data.success) setCabinets(data.cabinets); } catch {}
  };
  const fetchSchedule = async () => {
    setLoading(true);
    try { const res = await fetch("/api/get-schedule"); const data = await res.json(); if (data.success) { setSchedule(data.schedule); setTeachers(data.teachers); } } catch {} finally { setLoading(false); }
  };
  const fetchSubjectsForClass = async (classId) => {
    try { const res = await fetch(`/api/subjects/${classId}`); const data = await res.json(); if (Array.isArray(data)) setSubjects(data); } catch {}
  };
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };
  const fetchSnapshots = async () => {
    setSnapshotsLoading(true);
    try { const res = await fetch("/api/snapshots"); const data = await res.json(); if (data.success) setSnapshots(data.snapshots); } catch {} finally { setSnapshotsLoading(false); }
  };
  const saveSnapshot = async () => {
    if (!snapshotName.trim()) { showToast("Введите название", "error"); return; }
    const res = await fetch("/api/snapshots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: snapshotName.trim() }) });
    const data = await res.json();
    if (data.success) { showToast("Расписание сохранено!", "success"); setSnapshotName(""); setSnapshotModal(false); fetchSnapshots(); }
    else showToast(data.error || "Ошибка при сохранении", "error");
  };
  const restoreSnapshot = async (id, name) => {
    const ok = await confirm({ title: "Загрузить расписание?", message: `Текущее расписание будет заменено на "${name}". Это действие нельзя отменить.`, variant: "warning", confirmText: "Загрузить" });
    if (!ok) return;
    const res = await fetch("/api/snapshots/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await res.json();
    if (data.success) { showToast(`Загружено: "${name}" (${data.count} уроков)`, "success"); setSnapshotModal(false); await fetchSchedule(); }
    else showToast(data.error || "Ошибка при загрузке", "error");
  };
  const deleteSnapshot = async (id, name) => {
    const ok = await confirm({ title: "Удалить снапшот?", message: `Снапшот "${name}" будет удалён безвозвратно.`, confirmText: "Удалить" });
    if (!ok) return;
    const res = await fetch("/api/snapshots", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await res.json();
    if (data.success) { showToast("Снапшот удалён", "success"); fetchSnapshots(); }
    else showToast(data.error || "Ошибка", "error");
  };
  const fixConflict = async (conflict, idx) => {
    setFixingConflict(idx);
    try {
      const res = await fetch("/api/fix-conflict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: conflict.type, day: conflict.day, lesson_num: conflict.lesson_num, class_name: conflict.class_name }) });
      const data = await res.json();
      if (data.success) { showToast("Конфликт исправлен!", "success"); await fetchSchedule(); }
      else showToast(data.error || "Не удалось исправить", "error");
    } catch { showToast("Ошибка при исправлении", "error"); }
    finally { setFixingConflict(null); }
  };
  const fetchClassStats = async (classId) => {
    if (!classId) return;
    setStatsLoading(true);
    try { const res = await fetch(`/api/class-stats?classId=${classId}`); const data = await res.json(); if (data.success) setClassStats(data); } catch {} finally { setStatsLoading(false); }
  };

  useEffect(() => { fetchSchedule(); fetchCabinets(); }, []);

  const classesArray = Object.values(schedule)
    .filter(cls => { const m = cls.class_name.match(/^(\d+)/); return m && parseInt(m[1]) >= 5 && parseInt(m[1]) <= 11; })
    .sort((a, b) => parseInt(a.class_name) - parseInt(b.class_name));

  const currentClass = classesArray[currentClassIndex] || null;

  useEffect(() => {
    if (!currentClass) return;
    const anyLesson = Object.values(currentClass.days || {}).flat()[0];
    const classId = currentClass.class_id || anyLesson?.class_id;
    if (anyLesson) fetchSubjectsForClass(classId || "");
    if (classId) fetchClassStats(classId);
  }, [currentClassIndex, schedule]);

  const generateSchedule = async () => {
    setGenerating(true);
    try { const res = await fetch("/api/generate-schedule", { method: "POST" }); const data = await res.json(); if (data.success) await fetchSchedule(); } catch {} finally { setGenerating(false); }
  };

  const handleSubstitute = async () => {
    if (!sickTeacherId || !startDate || !endDate) { showToast("Выберите учителя и укажите период!", "error"); return; }
    if (new Date(endDate) < new Date(startDate)) { showToast("Дата окончания не может быть раньше даты начала!", "error"); return; }
    setIsSubstituting(true);
    try {
      const res = await fetch("/api/substitute-teacher", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacherId: sickTeacherId, startDate, endDate }) });
      const data = await res.json();
      if (data.success) { showToast("Замены успешно найдены и применены!", "success"); setSickTeacherId(""); setStartDate(""); setEndDate(""); await fetchSchedule(); }
      else showToast(data.message || data.error || "Ошибка при поиске замены", "error");
    } catch { showToast("Ошибка сети", "error"); }
    finally { setIsSubstituting(false); }
  };

  const updateTeacher = async (schedule_id, teacher_id, day_of_week, lesson_num) => {
    try {
      const res = await fetch("/api/update-schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule_id, teacher_id, day_of_week, lesson_num }) });
      const data = await res.json();
      if (!data.success) showToast("Ошибка: " + (data.message || data.error), "error");
      else await fetchSchedule();
    } catch {}
  };
  const updateRoom = async (schedule_id, room_id, day_of_week, lesson_num) => {
    try {
      const res = await fetch("/api/update-schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule_id, room_id, day_of_week, lesson_num }) });
      const data = await res.json();
      if (!data.success) showToast(data.error || "Ошибка", "error");
      else await fetchSchedule();
    } catch {}
  };
  const updatePosition = async (schedule_id, day_of_week, lesson_num) => {
    try {
      const res = await fetch("/api/update-schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule_id, day_of_week, lesson_num }) });
      const data = await res.json();
      if (!data.success) showToast("Ошибка: " + data.error, "error");
      else await fetchSchedule();
    } catch {}
  };
  const deleteLesson = async (schedule_id) => {
    const ok = await confirm({ title: "Удалить урок?", message: "Урок будет удалён из расписания. Это действие нельзя отменить.", confirmText: "Удалить" });
    if (!ok) return;
    try {
      const res = await fetch("/api/schedule", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: schedule_id }) });
      const data = await res.json();
      if (data.success || data.error === undefined) await fetchSchedule();
      else showToast("Ошибка удаления: " + data.error, "error");
    } catch (e) { console.error(e); }
  };
  const addLesson = async () => {
    if (!addModal || !addForm.subject_id) { showToast("Выберите предмет", "error"); return; }
    try {
      let classId = addModal.classId;
      if (!classId) {
        for (const cls of Object.values(schedule)) {
          if (cls.class_name === currentClass.class_name) {
            const anyLesson = Object.values(cls.days || {}).flat()[0];
            if (anyLesson) { classId = anyLesson.class_id; break; }
          }
        }
      }
      if (!classId) { showToast("Не удалось определить класс", "error"); return; }
      const roomId = addForm.room_id || cabinets[0]?.room_id;
      const teacherId = addForm.teacher_id || null;
      const directRes = await fetch("/api/add-lesson", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ class_id: classId, subject_id: Number(addForm.subject_id), teacher_id: teacherId ? Number(teacherId) : null, room_id: roomId ? Number(roomId) : null, day_of_week: addModal.day, lesson_num: addModal.lessonNum, year: new Date().getFullYear() }) });
      const directData = await directRes.json();
      if (directData.success) { setAddModal(null); setAddForm({ subject_id: "", teacher_id: "", room_id: "" }); await fetchSchedule(); showToast("Урок добавлен", "success"); }
      else showToast("Ошибка: " + (directData.error || "Неизвестная ошибка"), "error");
    } catch (e) { console.error(e); showToast("Ошибка при добавлении урока", "error"); }
  };

  const isTeacherBusy = (teacher_id, day, lesson_num, currentScheduleId) =>
    Object.values(schedule).some(cls => cls.days[day]?.some(l => l.lesson_num === lesson_num && l.teacher_id === teacher_id && l.schedule_id !== currentScheduleId));
  const isRoomBusy = (room_id, day, lesson_num, currentRoomId) =>
    Object.values(schedule).some(cls => cls.days[day]?.some(l => l.lesson_num === lesson_num && l.room_id === room_id && l.room_id !== currentRoomId));

  const getFreeTeachersBySlot = (day) => {
    const maxSlots = 8;
    return Array.from({ length: maxSlots }, (_, i) => {
      const slot = i + 1;
      const busyIds = new Set(Object.values(schedule).flatMap(cls => (cls.days[day] || []).filter(l => l.lesson_num === slot).map(l => l.teacher_id)));
      const free = teachers.filter(t => !busyIds.has(t.teacher_id));
      return { slot, free, busyCount: teachers.length - free.length };
    });
  };

  const getInitials = (fullName) => {
    if (!fullName) return "";
    return fullName.split(" ").map(n => n[0].toUpperCase()).join(".") + ".";
  };

  const findConflicts = () => {
    const newConflicts = [];
    Object.values(schedule).forEach(cls => {
      const className = cls.class_name;
      days.forEach(day => {
        const byNum = {};
        cls.days[day]?.forEach(l => { if (!byNum[l.lesson_num]) byNum[l.lesson_num] = []; byNum[l.lesson_num].push(l); });
        Object.entries(byNum).forEach(([numStr, group]) => {
          const num = parseInt(numStr);
          const roomsSeen = new Set();
          group.forEach(l => { if (roomsSeen.has(l.room_id)) { const cab = cabinets.find(c => c.room_id === l.room_id); newConflicts.push({ type: "room_conflict", class_name: className, day, lesson_num: num, message: `Кабинет ${cab?.room_number || l.room_id} занят несколькими подгруппами` }); } roomsSeen.add(l.room_id); });
          const tSeen = new Set();
          group.forEach(l => { if (tSeen.has(l.teacher_id)) { const teacher = teachers.find(t => t.teacher_id === l.teacher_id); newConflicts.push({ type: "teacher_conflict", class_name: className, day, lesson_num: num, message: `${teacher?.full_name || "Учитель"} ведёт несколько подгрупп` }); } tSeen.add(l.teacher_id); });
          if (group.length > 2) newConflicts.push({ type: "subgroups_overflow", class_name: className, day, lesson_num: num, message: `Больше 2 подгрупп (${group.length})` });
        });
      });
    });
    days.forEach(day => {
      const lessonNums = new Set(Object.values(schedule).flatMap(cls => (cls.days[day] || []).map(l => l.lesson_num)));
      lessonNums.forEach(num => {
        const teacherToClasses = {};
        Object.values(schedule).forEach(cls => { cls.days[day]?.filter(l => l.lesson_num === num).forEach(l => { if (!teacherToClasses[l.teacher_id]) teacherToClasses[l.teacher_id] = new Set(); teacherToClasses[l.teacher_id].add(cls.class_name); }); });
        Object.entries(teacherToClasses).forEach(([tid, classSet]) => {
          if (classSet.size > 1) { const teacher = teachers.find(t => t.teacher_id === parseInt(tid)); const classList = [...classSet].join(", "); newConflicts.push({ type: "teacher_double", class_name: classList, day, lesson_num: num, message: `${teacher?.full_name || "Учитель"} одновременно в классах: ${classList}` }); }
        });
        const roomToClasses = {};
        Object.values(schedule).forEach(cls => { cls.days[day]?.filter(l => l.lesson_num === num).forEach(l => { if (!roomToClasses[l.room_id]) roomToClasses[l.room_id] = new Set(); roomToClasses[l.room_id].add(cls.class_name); }); });
        Object.entries(roomToClasses).forEach(([rid, classSet]) => {
          if (classSet.size > 1) { const cab = cabinets.find(c => c.room_id === parseInt(rid)); const roomName = (cab?.room_name || cab?.room_number || "").toLowerCase(); const isGym = roomName.includes("спортзал") || roomName.includes("зал"); if (isGym && classSet.size <= 4) return; const classList = [...classSet].join(", "); newConflicts.push({ type: "room_double", class_name: classList, day, lesson_num: num, message: `Кабинет ${cab?.room_number || rid} используется в: ${classList}` }); }
        });
      });
    });
    setConflicts(newConflicts);
  };

  useEffect(() => { if (!loading) findConflicts(); }, [schedule, loading]);

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    classesArray.forEach(cls => {
      const maxLessons = Math.max(...Object.values(cls.days).map(d => d?.length || 0));
      const sheetData = [["#", ...days.map(d => dayNames[lang][d])]];
      for (let lessonNum = 1; lessonNum <= maxLessons; lessonNum++) {
        const dayLessons = days.map(day => cls.days[day]?.filter(l => l.lesson_num === lessonNum) || []);
        const maxGroups = Math.max(...dayLessons.map(l => l.length));
        for (let gi = 0; gi < maxGroups; gi++) {
          const row = [lessonNum];
          for (let d = 0; d < days.length; d++) {
            const lessons = dayLessons[d];
            if (lessons[gi]) { const lesson = lessons[gi]; const teacher = teachers.find(t => t.teacher_id === lesson.teacher_id); const initials = teacher ? getInitials(teacher.full_name) : ""; const cabinet = cabinets.find(c => c.room_id === lesson.room_id); const roomText = cabinet ? `${cabinet.room_number}${cabinet.room_name ? ` (${cabinet.room_name})` : ""}` : "—"; const groupLabel = lessons.length > 1 ? ` (${gi + 1} подгр.)` : ""; row.push(`${lesson.subject}${groupLabel} / ${initials} / ${roomText}`); }
            else row.push("");
          }
          sheetData.push(row);
        }
      }
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws["!cols"] = [{ wch: 5 }, ...days.map(() => ({ wch: 40 }))];
      XLSX.utils.book_append_sheet(workbook, ws, cls.class_name);
    });
    XLSX.writeFile(workbook, "Расписание.xlsx");
  };

  const prevClass = () => setCurrentClassIndex(p => Math.max(p - 1, 0));
  const nextClass = () => setCurrentClassIndex(p => Math.min(p + 1, classesArray.length - 1));

  const freeBySlot = getFreeTeachersBySlot(freeTeachersDay);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--sv-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div className="sv-spinner sv-spinner-lg" />
        <span style={{ fontSize: 15, color: "var(--sv-text2)", fontWeight: 500 }}>Загрузка расписания...</span>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        * { font-family: 'IBM Plex Sans', system-ui, sans-serif; }
        code, .mono { font-family: 'IBM Plex Mono', monospace; }

        :root {
          --sv-navy: #0f2540;
          --sv-navy2: #1a3a5c;
          --sv-navy3: #243d5e;
          --sv-blue: #1d6de5;
          --sv-blue-soft: #e8f0fb;
          --sv-surface: #ffffff;
          --sv-bg: #f2f4f8;
          --sv-bg2: #e8ebf0;
          --sv-border: #dde1e9;
          --sv-border2: #c8cdd8;
          --sv-text: #111827;
          --sv-text2: #4b5563;
          --sv-text3: #8b95a5;
          --sv-green: #15803d;
          --sv-green-bg: #dcfce7;
          --sv-green-border: #86efac;
          --sv-red: #be123c;
          --sv-red-bg: #ffe4e6;
          --sv-red-border: #fda4af;
          --sv-amber: #b45309;
          --sv-amber-bg: #fef3c7;
          --sv-amber-border: #fcd34d;
          --sv-radius-sm: 6px;
          --sv-radius: 10px;
          --sv-radius-lg: 14px;
          --sv-shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --sv-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);
          --sv-shadow-lg: 0 16px 40px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06);
        }

        /* ── Animations ── */
        @keyframes sv-spin { to { transform: rotate(360deg); } }
        @keyframes sv-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sv-slide-up { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes sv-slide-in-right { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes sv-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

        .sv-modal-enter { animation: sv-slide-up 0.22s cubic-bezier(0.34, 1.4, 0.64, 1); }
        .sv-toast-enter { animation: sv-slide-in-right 0.2s ease; }

        /* ── Spinner ── */
        .sv-spinner { border: 2px solid var(--sv-border); border-top-color: var(--sv-navy); border-radius: 50%; animation: sv-spin 0.7s linear infinite; width: 20px; height: 20px; }
        .sv-spinner-lg { width: 32px; height: 32px; border-width: 3px; }

        /* ── Overlay & Modal ── */
        .sv-overlay { position: fixed; inset: 0; background: rgba(10,20,38,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(3px); animation: sv-fade-in 0.18s ease; }
        .sv-modal { background: var(--sv-surface); border-radius: var(--sv-radius-lg); box-shadow: var(--sv-shadow-lg); width: 100%; overflow: hidden; border: 1px solid var(--sv-border); }
        .sv-modal-sm { max-width: 420px; }
        .sv-modal-md { max-width: 500px; }
        .sv-modal-lg { max-width: 560px; }
        .sv-modal-header { padding: 18px 22px; border-bottom: 1px solid var(--sv-border); display: flex; align-items: center; justify-content: space-between; background: #fafbfc; }
        .sv-modal-body { padding: 22px; display: flex; flex-direction: column; gap: 18px; }
        .sv-modal-title { font-size: 17px; font-weight: 700; color: var(--sv-navy); }
        .sv-modal-subtitle { font-size: 13px; color: var(--sv-text3); margin-top: 2px; }

        /* ── Confirm Modal ── */
        .sv-confirm-icon { display: flex; align-items: center; justify-content: center; padding: 28px 24px 16px; }
        .sv-confirm-icon svg { width: 44px; height: 44px; }
        .sv-confirm-icon-danger svg { stroke: var(--sv-red); }
        .sv-confirm-icon-warning svg { stroke: var(--sv-amber); }

        /* ── Buttons ── */
        .sv-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 9px 16px; border-radius: var(--sv-radius-sm); font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all 0.15s ease; white-space: nowrap; line-height: 1; outline: none; }
        .sv-btn:disabled { opacity: 0.52; cursor: not-allowed; }
        .sv-btn:focus-visible { box-shadow: 0 0 0 3px rgba(29,109,229,0.25); }
        .sv-btn-primary { background: var(--sv-navy); color: white; border-color: var(--sv-navy); }
        .sv-btn-primary:hover:not(:disabled) { background: var(--sv-navy2); }
        .sv-btn-blue { background: var(--sv-blue); color: white; border-color: var(--sv-blue); }
        .sv-btn-blue:hover:not(:disabled) { background: #1a62cf; }
        .sv-btn-green { background: var(--sv-green); color: white; border-color: var(--sv-green); }
        .sv-btn-green:hover:not(:disabled) { background: #146c35; }
        .sv-btn-danger { background: var(--sv-red); color: white; border-color: var(--sv-red); }
        .sv-btn-danger:hover:not(:disabled) { background: #a01035; }
        .sv-btn-ghost { background: white; color: var(--sv-text); border-color: var(--sv-border); }
        .sv-btn-ghost:hover:not(:disabled) { background: var(--sv-bg); border-color: var(--sv-border2); }
        .sv-btn-icon { padding: 8px; border-radius: var(--sv-radius-sm); }
        .sv-btn-sm { padding: 6px 12px; font-size: 13px; }
        .sv-btn-xs { padding: 4px 10px; font-size: 12px; }

        /* ── Forms ── */
        .sv-label { display: block; font-size: 12px; font-weight: 700; color: var(--sv-text2); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .sv-input, .sv-select { width: 100%; border: 1.5px solid var(--sv-border); border-radius: var(--sv-radius-sm); padding: 9px 12px; font-size: 14px; color: var(--sv-text); background: white; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
        .sv-input:focus, .sv-select:focus { border-color: var(--sv-blue); box-shadow: 0 0 0 3px rgba(29,109,229,0.12); }
        .sv-mini-select { width: 100%; border: 1px solid var(--sv-border); border-radius: 5px; padding: 5px 8px; font-size: 12px; background: #f8f9fb; color: var(--sv-text2); outline: none; margin-top: 7px; transition: border-color 0.15s; cursor: pointer; }
        .sv-mini-select:focus { border-color: var(--sv-blue); background: white; }

        /* ── Table ── */
        .sv-table { border-collapse: separate; border-spacing: 0; width: 100%; }
        .sv-table th { background: var(--sv-navy); color: #dce4ef; font-weight: 600; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; padding: 12px 14px; border-bottom: 2px solid var(--sv-navy2); }
        .sv-table th:first-child { border-radius: 10px 0 0 0; min-width: 44px; width: 44px; text-align: center; }
        .sv-table th:last-child { border-radius: 0 10px 0 0; }
        .sv-table td { padding: 7px; vertical-align: top; border-right: 1px solid var(--sv-border); border-bottom: 1px solid var(--sv-border); }
        .sv-table td:first-child { background: #f6f8fa; text-align: center; font-size: 14px; font-weight: 700; color: var(--sv-text2); border-left: 1px solid var(--sv-border); font-family: 'IBM Plex Mono', monospace; }
        .sv-table tr:first-child td { border-top: 1px solid var(--sv-border); }
        .sv-table tr:hover td:not(:first-child) { background: #fafbfc; }

        /* ── Lesson Card ── */
        .sv-lesson { background: white; border: 1.5px solid var(--sv-border); border-radius: 9px; padding: 11px 12px; position: relative; cursor: grab; transition: box-shadow 0.15s, border-color 0.15s, transform 0.1s; }
        .sv-lesson:hover { box-shadow: 0 3px 14px rgba(15,37,64,0.11); border-color: #bccde0; transform: translateY(-1px); }
        .sv-lesson:active { cursor: grabbing; transform: translateY(0); }
        .sv-lesson-subject { font-weight: 700; font-size: 14px; color: var(--sv-text); line-height: 1.3; }
        .sv-lesson-teacher { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--sv-text2); margin-top: 2px; overflow: hidden; }
        .sv-lesson-teacher span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sv-lesson-meta { font-size: 11px; color: var(--sv-text3); padding-left: 21px; margin-bottom: 4px; }

        /* ── Empty Slot ── */
        .sv-empty-slot { min-height: 76px; display: flex; align-items: center; justify-content: center; border-radius: 9px; cursor: pointer; border: 2px dashed var(--sv-border); transition: all 0.18s ease; color: var(--sv-text3); opacity: 0.7; }
        .sv-empty-slot:hover { border-color: var(--sv-blue); color: var(--sv-blue); background: var(--sv-blue-soft); opacity: 1; }

        /* ── Dropdown ── */
        .sv-dropdown { position: absolute; right: 0; top: 30px; background: white; border: 1.5px solid var(--sv-border); border-radius: var(--sv-radius); box-shadow: var(--sv-shadow); padding: 5px; z-index: 50; min-width: 195px; animation: sv-slide-up 0.15s ease; }
        .sv-dropdown-item { display: flex; align-items: center; gap: 9px; padding: 9px 11px; border-radius: var(--sv-radius-sm); font-size: 14px; cursor: pointer; color: var(--sv-text); transition: background 0.1s; white-space: nowrap; border: none; background: none; width: 100%; text-align: left; }
        .sv-dropdown-item:hover { background: var(--sv-bg); }
        .sv-dropdown-item.danger { color: var(--sv-red); }
        .sv-dropdown-item.danger:hover { background: var(--sv-red-bg); }

        /* ── Tag / Badge ── */
        .sv-tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .sv-badge-green { background: var(--sv-green-bg); color: var(--sv-green); border: 1px solid var(--sv-green-border); }
        .sv-badge-red { background: var(--sv-red-bg); color: var(--sv-red); border: 1px solid var(--sv-red-border); }
        .sv-badge-amber { background: var(--sv-amber-bg); color: var(--sv-amber); border: 1px solid var(--sv-amber-border); }
        .sv-badge-blue { background: var(--sv-blue-soft); color: var(--sv-blue); border: 1px solid #b3cef7; }
        .sv-badge-gray { background: #f3f4f6; color: var(--sv-text3); border: 1px solid var(--sv-border); }

        /* ── Conflict Bar ── */
        .sv-conflict-bar { margin: 14px 16px 0; background: white; border: 1.5px solid var(--sv-red-border); border-radius: var(--sv-radius-lg); overflow: hidden; box-shadow: 0 2px 8px rgba(190,18,60,0.08); }
        .sv-conflict-head { display: flex; align-items: center; justify-content: space-between; padding: 11px 16px; background: #fff5f7; border-bottom: 1px solid var(--sv-red-border); }
        .sv-conflict-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid #ffe4e8; transition: background 0.12s; }
        .sv-conflict-item:last-child { border-bottom: none; }
        .sv-conflict-item:hover { background: #fffafb; }

        /* ── Sidebar ── */
        .sv-sidebar { width: 295px; min-width: 295px; background: white; border-right: 1.5px solid var(--sv-border); display: flex; flex-direction: column; position: sticky; top: 0; height: calc(100vh - 60px); overflow-y: auto; transition: transform 0.3s ease; }
        .sv-sidebar-tab { display: flex; align-items: center; justify-content: center; gap: 7px; padding: 9px 12px; border-radius: var(--sv-radius-sm); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; flex: 1; }
        .sv-sidebar-tab.active { background: var(--sv-navy); color: white; }
        .sv-sidebar-tab:not(.active) { color: var(--sv-text2); }
        .sv-sidebar-tab:not(.active):hover { background: var(--sv-bg); }

        /* ── Stat Pill ── */
        .sv-stat-pill { display: flex; align-items: center; justify-content: space-between; padding: 9px 11px; border-radius: 9px; border: 1.5px solid; transition: box-shadow 0.12s; }
        .sv-stat-pill:hover { box-shadow: var(--sv-shadow-sm); }

        /* ── Toolbar ── */
        .sv-toolbar { background: white; border: 1.5px solid var(--sv-border); border-radius: var(--sv-radius-lg); padding: 12px 16px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; box-shadow: var(--sv-shadow-sm); }

        /* ── Class Nav Pills ── */
        .sv-class-pill { padding: 5px 11px; border-radius: 6px; border: 1.5px solid; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.13s; white-space: nowrap; }
        .sv-class-pill.active { background: var(--sv-navy); color: white; border-color: var(--sv-navy); }
        .sv-class-pill:not(.active) { background: white; color: var(--sv-text2); border-color: var(--sv-border); }
        .sv-class-pill:not(.active):hover { background: var(--sv-bg); border-color: var(--sv-border2); }

        /* ── Scrollbar ── */
        .sv-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .sv-scroll::-webkit-scrollbar-track { background: transparent; }
        .sv-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

        /* ── Toast ── */
        .sv-toast { display: flex; align-items: center; gap: 11px; padding: 13px 16px; border-radius: 10px; box-shadow: var(--sv-shadow); font-size: 14px; font-weight: 500; max-width: 360px; border: 1.5px solid; }
        .sv-toast-success { background: #f0fdf4; color: #15803d; border-color: var(--sv-green-border); }
        .sv-toast-error { background: #fff5f5; color: var(--sv-red); border-color: var(--sv-red-border); }

        /* ── Card container ── */
        .sv-card { background: white; border: 1.5px solid var(--sv-border); border-radius: var(--sv-radius-lg); box-shadow: var(--sv-shadow-sm); overflow: hidden; }

        /* ── Skeleton ── */
        .sv-skel { background: linear-gradient(90deg, #f0f2f5 25%, #e8ebf0 50%, #f0f2f5 75%); background-size: 400% 100%; animation: sv-skeleton 1.4s ease infinite; border-radius: 7px; }
        @keyframes sv-skeleton { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

        /* ── Subgroup ── */
        .sv-subgroup-label { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-top: 3px; background: var(--sv-blue-soft); color: var(--sv-blue); border: 1px solid #b3cef7; }

        /* ── Section Divider ── */
        .sv-section-label { font-size: 11px; font-weight: 700; color: var(--sv-text3); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px; }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .sv-sidebar { position: fixed; left: 0; top: 0; bottom: 0; z-index: 100; transform: translateX(-100%); height: 100vh; }
          .sv-sidebar.open { transform: translateX(0); box-shadow: var(--sv-shadow-lg); }
          .sv-sidebar-overlay { display: block; }
          .sv-hide-mobile { display: none !important; }
          .sv-show-mobile { display: flex !important; }
          .sv-toolbar-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
        @media (min-width: 901px) {
          .sv-sidebar-overlay { display: none; }
          .sv-show-mobile { display: none !important; }
        }
        .sv-sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 99; display: none; animation: sv-fade-in 0.18s ease; }

        /* ── Day nav ── */
        .sv-day-btn { padding: 5px 4px; border-radius: 6px; border: 1.5px solid; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.12s; letter-spacing: 0.02em; }
        .sv-day-btn.active { background: var(--sv-navy); color: white; border-color: var(--sv-navy); }
        .sv-day-btn:not(.active) { background: white; color: var(--sv-text2); border-color: var(--sv-border); }
        .sv-day-btn:not(.active):hover { background: var(--sv-bg); }
      `}</style>

      <ConfirmModalComponent />

      <div style={{ background: "var(--sv-bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />

        {/* ── Sidebar overlay (mobile) ── */}
        {sidebarOpen && (
          <div className="sv-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── CONFLICTS BAR ── */}
        {conflicts.length > 0 && (
          <div className="sv-conflict-bar">
            <div className="sv-conflict-head">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "var(--sv-red)", display: "flex" }}><Icons.AlertTriangle /></span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#9f1239" }}>Обнаружены конфликты</span>
                <span style={{ background: "var(--sv-red)", color: "white", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{conflicts.length}</span>
              </div>
              <button
                className="sv-btn sv-btn-sm sv-btn-green"
                onClick={async () => {
                  const ok = await confirm({ title: "Исправить все конфликты?", message: `Будет предпринята попытка исправить все ${conflicts.length} конфликтов автоматически.`, variant: "warning", confirmText: "Исправить все" });
                  if (!ok) return;
                  let fixed = 0;
                  for (const c of conflicts) {
                    try { const res = await fetch("/api/fix-conflict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: c.type, day: c.day, lesson_num: c.lesson_num, class_name: c.class_name }) }); const d = await res.json(); if (d.success) fixed++; } catch {}
                  }
                  showToast(`Исправлено ${fixed} из ${conflicts.length}`, fixed > 0 ? "success" : "error");
                  await fetchSchedule();
                }}
              >
                <Icons.Wrench /> Исправить все
              </button>
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto" }} className="sv-scroll">
              {conflicts.map((c, idx) => {
                const isTeacher = c.type === "teacher_conflict" || c.type === "teacher_double";
                const dayRu = c.day ? dayNames[lang][c.day] : "";
                return (
                  <div key={idx} className="sv-conflict-item">
                    <span style={{ color: isTeacher ? "var(--sv-blue)" : "var(--sv-amber)", flexShrink: 0 }}>
                      {isTeacher ? <Icons.User /> : <Icons.BookOpen />}
                    </span>
                    <div style={{ flex: 1, fontSize: 13, color: "#881337" }}>
                      <strong style={{ color: "#9f1239" }}>{c.class_name}</strong>
                      {dayRu && <><span style={{ color: "var(--sv-text3)", margin: "0 6px" }}>·</span><span>{dayRu}</span></>}
                      {c.lesson_num && <><span style={{ color: "var(--sv-text3)", margin: "0 6px" }}>·</span><span>урок {c.lesson_num}</span></>}
                      <span style={{ margin: "0 6px", color: "#fca5a5" }}>—</span>
                      <span>{c.message}</span>
                    </div>
                    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                      <button className="sv-btn sv-btn-xs sv-btn-green" disabled={fixingConflict === idx} onClick={() => fixConflict(c, idx)}>
                        {fixingConflict === idx
                          ? <span style={{ display: "flex", gap: 4, alignItems: "center" }}><div className="sv-spinner" style={{ borderTopColor: "white" }} />Фикс...</span>
                          : <><Icons.Wrench /> Починить</>}
                      </button>
                      {(c.type === "teacher_double" || c.type === "room_double" ? c.class_name.split(", ") : [c.class_name]).map(cn => {
                        const i2 = classesArray.findIndex(cl => cl.class_name === cn.trim());
                        if (i2 === -1) return null;
                        return (
                          <button key={cn} className="sv-btn sv-btn-xs sv-btn-ghost" onClick={() => setCurrentClassIndex(i2)}>
                            <Icons.ChevronRight /> {cn.trim()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MAIN LAYOUT ── */}
        <div style={{ display: "flex", flex: 1, minWidth: 0 }}>

          {/* ── SIDEBAR ── */}
          <aside className={`sv-sidebar sv-scroll ${sidebarOpen ? "open" : ""}`}>

            {/* Mobile close */}
            <div style={{ display: "none", padding: "12px 14px", borderBottom: "1px solid var(--sv-border)", alignItems: "center", justifyContent: "space-between" }} className="sv-show-mobile">
              <span style={{ fontWeight: 700, fontSize: 15, color: "var(--sv-navy)" }}>Панель</span>
              <button className="sv-btn sv-btn-icon sv-btn-ghost" onClick={() => setSidebarOpen(false)}><Icons.X /></button>
            </div>

            {/* Tabs */}
            <div style={{ padding: "14px 14px 0", display: "flex", gap: 5, borderBottom: "1.5px solid var(--sv-border)", paddingBottom: 14 }}>
              <div className={`sv-sidebar-tab ${activeTab === "stats" ? "active" : ""}`} onClick={() => setActiveTab("stats")}>
                <Icons.BarChart2 /> Статистика
              </div>
              <div className={`sv-sidebar-tab ${activeTab === "free" ? "active" : ""}`} onClick={() => setActiveTab("free")}>
                <Icons.Users /> Свободные
              </div>
            </div>

            {/* STATS TAB */}
            {activeTab === "stats" && (
              <div style={{ padding: "16px 14px", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span className="sv-section-label">Класс</span>
                  {currentClass && (
                    <span style={{ background: "var(--sv-navy)", color: "white", fontSize: 13, fontWeight: 700, padding: "4px 12px", borderRadius: 7 }}>
                      {currentClass.class_name}
                    </span>
                  )}
                </div>
                {!currentClass ? (
                  <div style={{ textAlign: "center", color: "var(--sv-text3)", fontSize: 14, marginTop: 48 }}>Выберите класс</div>
                ) : statsLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {[...Array(6)].map((_, i) => <div key={i} className="sv-skel" style={{ height: 46 }} />)}
                  </div>
                ) : classStats ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 18 }}>
                      <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 10, padding: "13px 11px", textAlign: "center" }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: "#1d4ed8", lineHeight: 1, fontFamily: "'IBM Plex Mono', monospace" }}>{classStats.totalActual}</div>
                        <div style={{ fontSize: 11, color: "#3b82f6", marginTop: 4, fontWeight: 600 }}>уроков / нед.</div>
                      </div>
                      <div style={{ background: classStats.issuesCount === 0 ? "var(--sv-green-bg)" : "var(--sv-red-bg)", border: `1.5px solid ${classStats.issuesCount === 0 ? "var(--sv-green-border)" : "var(--sv-red-border)"}`, borderRadius: 10, padding: "13px 11px", textAlign: "center" }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: classStats.issuesCount === 0 ? "var(--sv-green)" : "var(--sv-red)", lineHeight: 1, fontFamily: "'IBM Plex Mono', monospace" }}>
                          {classStats.issuesCount === 0 ? "✓" : classStats.issuesCount}
                        </div>
                        <div style={{ fontSize: 11, color: classStats.issuesCount === 0 ? "var(--sv-green)" : "var(--sv-red)", marginTop: 4, fontWeight: 600 }}>
                          {classStats.issuesCount === 0 ? "норма" : "несоответствий"}
                        </div>
                      </div>
                    </div>
                    <div className="sv-section-label">По предметам</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {classStats.subjects.map(subj => {
                        const ok = subj.diff === 0, over = subj.diff > 0;
                        return (
                          <div key={subj.subject_id} className="sv-stat-pill" style={{ background: ok ? "var(--sv-green-bg)" : over ? "var(--sv-amber-bg)" : "var(--sv-red-bg)", borderColor: ok ? "var(--sv-green-border)" : over ? "var(--sv-amber-border)" : "var(--sv-red-border)" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sv-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subj.name}</div>
                              <div style={{ fontSize: 11, color: "var(--sv-text3)", marginTop: 1 }}>план {subj.planned} · факт {subj.actual}</div>
                            </div>
                            <span className="sv-tag" style={{ background: ok ? "#dcfce7" : over ? "var(--sv-amber-bg)" : "var(--sv-red-bg)", color: ok ? "var(--sv-green)" : over ? "var(--sv-amber)" : "var(--sv-red)", marginLeft: 7, flexShrink: 0 }}>
                              {ok ? <Icons.CheckCircle /> : over ? <Icons.TrendingUp /> : <Icons.TrendingDown />}
                              {ok ? "норма" : over ? `+${subj.diff}` : `${subj.diff}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", color: "var(--sv-text3)", fontSize: 14, marginTop: 48 }}>Нет данных учебного плана</div>
                )}
              </div>
            )}

            {/* FREE TEACHERS TAB */}
            {activeTab === "free" && (
              <div style={{ padding: "16px 14px", flex: 1 }}>
                <div style={{ marginBottom: 14 }}>
                  <div className="sv-section-label" style={{ marginBottom: 8 }}>День недели</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
                    {days.map(d => (
                      <button key={d} onClick={() => setFreeTeachersDay(d)} className={`sv-day-btn ${freeTeachersDay === d ? "active" : ""}`}>
                        {dayNames[lang][d].slice(0, 2)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sv-section-label">{dayNames[lang][freeTeachersDay]} — свободные</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {freeBySlot.map(({ slot, free, busyCount }) => (
                    <div key={slot} style={{ borderRadius: 9, border: "1.5px solid var(--sv-border)", overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 11px", background: "#f8f9fb", borderBottom: free.length > 0 ? "1px solid var(--sv-border)" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--sv-text)", fontFamily: "'IBM Plex Mono', monospace" }}>{slot}</span>
                          <span style={{ fontSize: 12, color: "var(--sv-text3)" }}>урок</span>
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          <span className="sv-tag sv-badge-green" style={{ fontSize: 11 }}>{free.length} своб.</span>
                          {busyCount > 0 && <span className="sv-tag sv-badge-gray" style={{ fontSize: 11 }}>{busyCount} зан.</span>}
                        </div>
                      </div>
                      {free.length > 0 ? (
                        <div style={{ padding: "7px 9px", display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {free.map(t => (
                            <span key={t.teacher_id} style={{ padding: "3px 8px", borderRadius: 5, fontSize: 12, fontWeight: 500, background: "var(--sv-green-bg)", color: "var(--sv-green)", border: "1px solid var(--sv-green-border)" }} title={t.subject}>
                              {t.full_name.split(" ").slice(0, 2).join(" ")}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: "8px 11px", fontSize: 12, color: "var(--sv-text3)", fontStyle: "italic" }}>Все заняты</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 14, minWidth: 0, overflowX: "auto" }}>

            {/* Substitute Panel */}
            <div className="sv-card" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                <span style={{ color: "var(--sv-red)", display: "flex" }}><Icons.RefreshCw /></span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--sv-text)" }}>Режим замены</div>
                  <div style={{ fontSize: 12, color: "var(--sv-text3)" }}>Назначьте свободного учителя на период отсутствия</div>
                </div>
                {/* Mobile sidebar toggle */}
                <button className="sv-btn sv-btn-ghost sv-btn-sm sv-show-mobile" style={{ marginLeft: "auto" }} onClick={() => setSidebarOpen(true)}>
                  <Icons.Menu /> Панель
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9, alignItems: "center" }}>
                <select className="sv-select" style={{ flex: "1 1 220px" }} value={sickTeacherId} onChange={e => setSickTeacherId(e.target.value)}>
                  <option value="">— Выберите учителя —</option>
                  {teachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.full_name} ({t.subject})</option>)}
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flex: "1 1 200px" }}>
                  <input type="date" className="sv-input" style={{ flex: 1 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                  <span style={{ color: "var(--sv-text3)", fontSize: 13, fontWeight: 500 }}>—</span>
                  <input type="date" className="sv-input" style={{ flex: 1 }} value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <button className="sv-btn sv-btn-danger" disabled={isSubstituting} onClick={handleSubstitute}>
                  {isSubstituting ? <><div className="sv-spinner" style={{ borderTopColor: "white" }} />Ищем...</> : <><Icons.Search />Найти замену</>}
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="sv-toolbar sv-toolbar-scroll">
              {/* Mobile sidebar btn */}
              <button className="sv-btn sv-btn-ghost sv-btn-icon sv-show-mobile" onClick={() => setSidebarOpen(true)}><Icons.Menu /></button>

              {/* Class nav */}
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <button className="sv-btn sv-btn-ghost sv-btn-icon" onClick={prevClass} disabled={currentClassIndex === 0}><Icons.ChevronLeft /></button>
                <div style={{ minWidth: 70, textAlign: "center", fontWeight: 800, fontSize: 18, color: "var(--sv-navy)", background: "var(--sv-bg)", padding: "5px 14px", borderRadius: 7, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {currentClass?.class_name || "—"}
                </div>
                <button className="sv-btn sv-btn-ghost sv-btn-icon" onClick={nextClass} disabled={currentClassIndex === classesArray.length - 1}><Icons.ChevronRight /></button>
              </div>

              {/* Class quick-nav */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
                {classesArray.map((cls, i) => (
                  <button key={cls.class_name} onClick={() => setCurrentClassIndex(i)} className={`sv-class-pill ${i === currentClassIndex ? "active" : ""}`}>
                    {cls.class_name}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 7, flexShrink: 0, flexWrap: "wrap" }}>
                <button className="sv-btn sv-btn-primary" onClick={generateSchedule} disabled={generating}>
                  {generating ? <><div className="sv-spinner" style={{ borderTopColor: "white" }} />Генерация...</> : <><Icons.Zap />Генерировать</>}
                </button>
                <button className="sv-btn sv-btn-green" onClick={exportToExcel}><Icons.Download />Excel</button>
                <button className="sv-btn sv-btn-blue" onClick={() => setSnapshotModal("save")}><Icons.Save />Сохранить</button>
                <button className="sv-btn sv-btn-ghost" onClick={() => { setSnapshotModal("load"); fetchSnapshots(); }}><Icons.Upload />Загрузить</button>
                <button className="sv-btn sv-btn-ghost" style={{ color: "var(--sv-red)", borderColor: "var(--sv-red-border)" }}
                  onClick={async () => {
                    const ok = await confirm({ title: "Удалить расписание?", message: "Всё расписание будет удалено безвозвратно. Это действие нельзя отменить.", confirmText: "Удалить всё" });
                    if (!ok) return;
                    try {
                      const res = await fetch("/api/delete-schedule", { method: "DELETE" }); const d = await res.json();
                      if (d.success) { showToast("Расписание удалено", "success"); await fetchSchedule(); }
                      else showToast(d.error || "Ошибка", "error");
                    } catch { showToast("Ошибка", "error"); }
                  }}
                >
                  <Icons.Trash2 />Удалить
                </button>
              </div>
            </div>

            {/* Schedule Table */}
            {currentClass && (() => {
              const maxLessonNum = Math.max(...days.map(day => {
                const lessons = currentClass.days[day] || [];
                return lessons.length > 0 ? Math.max(...lessons.map(l => l.lesson_num)) : 0;
              }), 1);
              return (
                <div className="sv-card">
                  <div style={{ overflowX: "auto" }}>
                    <table className="sv-table" style={{ minWidth: 820 }}>
                      <thead>
                        <tr>
                          <th>#</th>
                          {days.map(day => <th key={day}>{dayNames[lang][day]}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: maxLessonNum }, (_, i) => i + 1).map(lessonNum => (
                          <tr key={lessonNum}>
                            <td>{lessonNum}</td>
                            {days.map(day => {
                              const lessons = currentClass.days[day]?.filter(l => l.lesson_num === lessonNum) || [];
                              return (
                                <td
                                  key={day}
                                  onDragOver={e => e.preventDefault()}
                                  onDrop={async e => {
                                    e.preventDefault();
                                    let data;
                                    try { data = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }
                                    const targetLessons = currentClass.days[day]?.filter(l => l.lesson_num === lessonNum) || [];
                                    if (targetLessons.length === 0) {
                                      if (data.type === "group") { for (const item of data.items) await updatePosition(item.schedule_id, day, lessonNum); }
                                      else await updatePosition(data.schedule_id, day, lessonNum);
                                      return;
                                    }
                                    if (data.type === "group") {
                                      if (targetLessons.length + data.items.length > 2) { const sd = data.items[0].day; const sn = data.items[0].lesson_num; for (const tl of targetLessons) await updatePosition(tl.schedule_id, sd, sn); for (const item of data.items) await updatePosition(item.schedule_id, day, lessonNum); }
                                      else { for (const item of data.items) await updatePosition(item.schedule_id, day, lessonNum); }
                                      return;
                                    }
                                    if (targetLessons.length === 1) {
                                      const tl = targetLessons[0]; if (data.schedule_id === tl.schedule_id) return;
                                      await updatePosition(data.schedule_id, day, lessonNum); await updatePosition(tl.schedule_id, data.day, data.lesson_num); return;
                                    }
                                    if (targetLessons.length === 2) { for (const tl of targetLessons) await updatePosition(tl.schedule_id, data.day, data.lesson_num); await updatePosition(data.schedule_id, day, lessonNum); }
                                  }}
                                >
                                  {lessons.length === 0 ? (
                                    <div className="sv-empty-slot" onClick={() => {
                                      const anyLesson = Object.values(currentClass.days || {}).flat()[0];
                                      const classId = anyLesson?.class_id;
                                      if (classId) fetchSubjectsForClass(classId);
                                      setAddForm({ subject_id: "", teacher_id: "", room_id: "" });
                                      setAddModal({ day, lessonNum, classId });
                                    }}>
                                      <Icons.Plus />
                                    </div>
                                  ) : (
                                    lessons.map((lesson, idx) => {
                                      const teacher = teachers.find(t => t.teacher_id === lesson.teacher_id);
                                      const fullName = teacher ? teacher.full_name : "";
                                      const teacherSubject = teacher ? teacher.subject : "";
                                      const groupLabel = lessons.length > 1 ? `Подгруппа ${idx + 1}` : "";
                                      return (
                                        <div
                                          key={lesson.schedule_id}
                                          className="sv-lesson"
                                          style={{ marginBottom: idx < lessons.length - 1 ? 6 : 0 }}
                                          draggable
                                          onDragStart={e => {
                                            e.dataTransfer.effectAllowed = "move";
                                            if (lessons.length === 1) { e.dataTransfer.setData("text/plain", JSON.stringify({ type: "single", schedule_id: lesson.schedule_id, day, lesson_num: lessonNum })); return; }
                                            e.dataTransfer.setData("text/plain", JSON.stringify({ type: "group", items: lessons.map(l => ({ schedule_id: l.schedule_id, day, lesson_num: lessonNum })) }));
                                          }}
                                        >
                                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 5, marginBottom: 5 }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                              <div className="sv-lesson-subject">{lesson.subject}</div>
                                              {groupLabel && <div className="sv-subgroup-label">{groupLabel}</div>}
                                            </div>
                                            <button
                                              onClick={e => { e.stopPropagation(); setOpenMenus(prev => ({ ...prev, [lesson.schedule_id]: !prev[lesson.schedule_id] })); }}
                                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sv-text3)", padding: "2px", flexShrink: 0, borderRadius: 5, transition: "background 0.12s" }}
                                              onMouseEnter={e => e.target.style.background = "var(--sv-bg)"}
                                              onMouseLeave={e => e.target.style.background = "none"}
                                            >
                                              <Icons.MoreVertical />
                                            </button>
                                          </div>
                                          {fullName && (
                                            <div className="sv-lesson-teacher">
                                              <Icons.User />
                                              <span>{fullName}</span>
                                            </div>
                                          )}
                                          {teacherSubject && <div className="sv-lesson-meta">{teacherSubject}</div>}
                                          {openMenus[lesson.schedule_id] && (
                                            <div className="sv-dropdown">
                                              <button className="sv-dropdown-item" style={{ justifyContent: "flex-end", padding: "4px 6px" }}
                                                onClick={e => { e.stopPropagation(); setOpenMenus(p => ({ ...p, [lesson.schedule_id]: false })); }}>
                                                <Icons.X />
                                              </button>
                                              {lessons.length === 1 && (
                                                <button className="sv-dropdown-item" onClick={async () => {
                                                  try { const res = await fetch("/api/split-lesson", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule_id: lesson.schedule_id }) }); const d = await res.json(); if (d.success) await fetchSchedule(); } catch {}
                                                  setOpenMenus(p => ({ ...p, [lesson.schedule_id]: false }));
                                                }}>
                                                  <Icons.Scissors /> Разделить на подгруппы
                                                </button>
                                              )}
                                              {lessons.length === 2 && idx === 0 && (
                                                <button className="sv-dropdown-item" onClick={async () => {
                                                  try { const res = await fetch("/api/merge-lesson", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule_id: lesson.schedule_id }) }); const d = await res.json(); if (d.success) await fetchSchedule(); } catch {}
                                                  setOpenMenus(p => ({ ...p, [lesson.schedule_id]: false }));
                                                }}>
                                                  <Icons.Link /> Объединить подгруппы
                                                </button>
                                              )}
                                              <button className="sv-dropdown-item danger" onClick={async () => {
                                                setOpenMenus(p => ({ ...p, [lesson.schedule_id]: false }));
                                                await deleteLesson(lesson.schedule_id);
                                              }}>
                                                <Icons.Trash2 /> Удалить из расписания
                                              </button>
                                            </div>
                                          )}
                                          <select className="sv-mini-select" value={lesson.room_id || ""} onChange={e => updateRoom(lesson.schedule_id, e.target.value, day, lessonNum)}>
                                            <option value="">— Кабинет не назначен —</option>
                                            {cabinets.map(c => (
                                              <option key={c.room_id} value={c.room_id} disabled={isRoomBusy(c.room_id, day, lessonNum, lesson.room_id)}>
                                                {c.room_number}{c.room_name ? ` · ${c.room_name}` : ""}
                                              </option>
                                            ))}
                                          </select>
                                          <select className="sv-mini-select" value={lesson.teacher_id || ""} onChange={e => updateTeacher(lesson.schedule_id, e.target.value, day, lessonNum)}>
                                            <option value="">— Учитель не назначен —</option>
                                            {teachers.map(t => {
                                              const busyElsewhere = Object.values(schedule).some(cls =>
                                                Object.entries(cls.days).some(([d, dLessons]) =>
                                                  dLessons?.some(l => l.teacher_id === t.teacher_id && l.schedule_id !== lesson.schedule_id &&
                                                    !(d === day && l.lesson_num === lessonNum && l.class_id === lesson.class_id) &&
                                                    d === day && l.lesson_num === lessonNum)
                                                )
                                              );
                                              return (
                                                <option key={t.teacher_id} value={t.teacher_id} disabled={busyElsewhere}>
                                                  {t.full_name} ({t.subject}){busyElsewhere ? " — занят" : ""}
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
                </div>
              );
            })()}
          </main>
        </div>

        {/* ── TOASTS ── */}
        <div style={{ position: "fixed", top: 18, right: 18, zIndex: 9999, display: "flex", flexDirection: "column", gap: 9, pointerEvents: "none" }}>
          {toasts.map(toast => (
            <div key={toast.id} className={`sv-toast sv-toast-enter ${toast.type === "success" ? "sv-toast-success" : "sv-toast-error"}`} style={{ pointerEvents: "auto" }}>
              {toast.type === "success" ? <Icons.CheckCircle /> : <Icons.XCircle />}
              <span style={{ flex: 1 }}>{toast.message}</span>
              <button onClick={() => setToasts(p => p.filter(t => t.id !== toast.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.6, fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            </div>
          ))}
        </div>

        {/* ── ADD LESSON MODAL ── */}
        {addModal && (
          <div className="sv-overlay">
            <div className="sv-modal sv-modal-md sv-modal-enter">
              <div className="sv-modal-header">
                <div>
                  <div className="sv-modal-title">Добавить урок</div>
                  <div className="sv-modal-subtitle">{dayNames[lang][addModal.day]}, урок {addModal.lessonNum}</div>
                </div>
                <button className="sv-btn sv-btn-ghost sv-btn-icon" onClick={() => setAddModal(null)}><Icons.X /></button>
              </div>
              <div className="sv-modal-body">
                <div>
                  <label className="sv-label">Предмет *</label>
                  <select className="sv-select" value={addForm.subject_id} onChange={e => setAddForm(p => ({ ...p, subject_id: e.target.value }))}>
                    <option value="">— Выберите предмет —</option>
                    {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="sv-label">Учитель</label>
                  <select className="sv-select" value={addForm.teacher_id} onChange={e => setAddForm(p => ({ ...p, teacher_id: e.target.value }))}>
                    <option value="">— Без учителя —</option>
                    {teachers.map(t => {
                      const busy = isTeacherBusy(t.teacher_id, addModal.day, addModal.lessonNum, -1);
                      return <option key={t.teacher_id} value={t.teacher_id} disabled={busy}>{t.full_name} ({t.subject}){busy ? " — занят" : ""}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="sv-label">Кабинет</label>
                  <select className="sv-select" value={addForm.room_id} onChange={e => setAddForm(p => ({ ...p, room_id: e.target.value }))}>
                    <option value="">— Без кабинета —</option>
                    {cabinets.map(c => {
                      const busy = isRoomBusy(c.room_id, addModal.day, addModal.lessonNum, -1);
                      return <option key={c.room_id} value={c.room_id} disabled={busy}>{c.room_number}{c.room_name ? ` · ${c.room_name}` : ""}{busy ? " — занят" : ""}</option>;
                    })}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 9, paddingTop: 4 }}>
                  <button className="sv-btn sv-btn-primary" style={{ flex: 1 }} onClick={addLesson}><Icons.Plus />Добавить</button>
                  <button className="sv-btn sv-btn-ghost" style={{ flex: 1 }} onClick={() => setAddModal(null)}>Отмена</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SNAPSHOT MODAL ── */}
        {snapshotModal && (
          <div className="sv-overlay">
            <div className="sv-modal sv-modal-lg sv-modal-enter">
              <div className="sv-modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "var(--sv-navy)", display: "flex" }}>{snapshotModal === "save" ? <Icons.Save /> : <Icons.Upload />}</span>
                  <div>
                    <div className="sv-modal-title">{snapshotModal === "save" ? "Сохранить расписание" : "Загрузить расписание"}</div>
                    <div className="sv-modal-subtitle">{snapshotModal === "save" ? "Создать снапшот текущего расписания" : "Восстановить из сохранённого снапшота"}</div>
                  </div>
                </div>
                <button className="sv-btn sv-btn-ghost sv-btn-icon" onClick={() => { setSnapshotModal(false); setSnapshotName(""); }}><Icons.X /></button>
              </div>
              <div className="sv-modal-body">
                {snapshotModal === "save" ? (
                  <>
                    <div>
                      <label className="sv-label">Название снапшота</label>
                      <input className="sv-input" type="text" value={snapshotName} onChange={e => setSnapshotName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveSnapshot()} placeholder={`Расписание ${new Date().toLocaleDateString("ru-RU")}`} autoFocus />
                    </div>
                    <div style={{ display: "flex", gap: 9 }}>
                      <button className="sv-btn sv-btn-primary" style={{ flex: 1 }} onClick={saveSnapshot}><Icons.Save />Сохранить</button>
                      <button className="sv-btn sv-btn-ghost" style={{ flex: 1 }} onClick={() => { setSnapshotModal(false); setSnapshotName(""); }}>Отмена</button>
                    </div>
                  </>
                ) : (
                  <div>
                    {snapshotsLoading ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                        {[...Array(3)].map((_, i) => <div key={i} className="sv-skel" style={{ height: 60 }} />)}
                      </div>
                    ) : snapshots.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "36px 0" }}>
                        <div style={{ color: "var(--sv-text3)", display: "flex", justifyContent: "center", marginBottom: 12 }}><Icons.BookOpen /></div>
                        <div style={{ color: "var(--sv-text3)", fontSize: 14, marginBottom: 16 }}>Нет сохранённых расписаний</div>
                        <button className="sv-btn sv-btn-primary" onClick={() => setSnapshotModal("save")}><Icons.Save />Сохранить текущее</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 340, overflowY: "auto" }} className="sv-scroll">
                        {snapshots.map(snap => (
                          <div key={snap.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", border: "1.5px solid var(--sv-border)", borderRadius: 10, transition: "border-color 0.12s, background 0.12s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--sv-border2)"; e.currentTarget.style.background = "#fafbfc"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--sv-border)"; e.currentTarget.style.background = "white"; }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--sv-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{snap.name}</div>
                              <div style={{ fontSize: 12, color: "var(--sv-text3)", marginTop: 3 }}>
                                {new Date(snap.created_at).toLocaleString("ru-RU")} · <strong style={{ color: "var(--sv-text2)" }}>{snap.rows_count}</strong> уроков
                              </div>
                            </div>
                            <button className="sv-btn sv-btn-sm sv-btn-primary" onClick={() => restoreSnapshot(snap.id, snap.name)}><Icons.Upload />Загрузить</button>
                            <button className="sv-btn sv-btn-ghost sv-btn-icon sv-btn-sm" onClick={() => deleteSnapshot(snap.id, snap.name)} style={{ color: "var(--sv-text3)" }}><Icons.Trash2 /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
}