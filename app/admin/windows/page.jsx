"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Settings, Plus, Trash2, RefreshCw, Save, X,
  AlertCircle, CheckCircle, Clock, Info,
  Search, Filter, ChevronLeft, ChevronRight,
  User, Calendar, ArrowUpDown, BookOpen
} from "lucide-react";

const DAYS = [
  { key:"monday",    label:"Понедельник", short:"Пн" },
  { key:"tuesday",   label:"Вторник",     short:"Вт" },
  { key:"wednesday", label:"Среда",       short:"Ср" },
  { key:"thursday",  label:"Четверг",     short:"Чт" },
  { key:"friday",    label:"Пятница",     short:"Пт" },
];
const MAX_LESSONS = 9;

const DAY_LABELS = {
  Monday: "Понедельник", Tuesday: "Вторник", Wednesday: "Среда",
  Thursday: "Четверг", Friday: "Пятница"
};

// ─── Toggle component ────────────────────────────────────────────────────────
const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className={`relative w-14 h-7 rounded-full transition-colors shrink-0 ${value ? "bg-[#0d254c]" : "bg-gray-300"}`}
  >
    <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${value ? "translate-x-7" : "translate-x-0.5"}`} />
  </button>
);

// ─── SubstituteLogs tab ───────────────────────────────────────────────────────
function SubstituteLogsTab() {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [expanded, setExpanded] = useState(null);
  const LIMIT = 15;

  // Filters
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterStatus,  setFilterStatus]  = useState("");
  const [filterFrom,    setFilterFrom]    = useState("");
  const [filterTo,      setFilterTo]      = useState("");

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (filterTeacher) params.set("teacher", filterTeacher);
      if (filterStatus)  params.set("status",  filterStatus);
      if (filterFrom)    params.set("from",     filterFrom);
      if (filterTo)      params.set("to",       filterTo);

      const res  = await fetch(`/api/substitute-logs?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterTeacher, filterStatus, filterFrom, filterTo]);

  useEffect(() => { setPage(1); fetchLogs(1); }, [filterTeacher, filterStatus, filterFrom, filterTo]);
  useEffect(() => { fetchLogs(page); }, [page]);

  const handleDelete = async (id) => {
    if (!confirm("Удалить эту запись из журнала?")) return;
    await fetch("/api/substitute-logs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchLogs(page);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4 text-[#0d254c] font-semibold">
          <Filter size={16}/> Фильтры
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* teacher search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              type="text"
              placeholder="Поиск по учителю..."
              value={filterTeacher}
              onChange={e => setFilterTeacher(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d254c]/30 focus:border-[#0d254c]"
            />
          </div>

          {/* status */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d254c]/30 focus:border-[#0d254c] bg-white"
          >
            <option value="">Все статусы</option>
            <option value="success">✅ Успешно</option>
            <option value="error">❌ Ошибка</option>
          </select>

          {/* date from */}
          <div className="relative">
            <label className="absolute -top-2 left-3 text-[10px] text-gray-400 bg-white px-1">От даты</label>
            <input
              type="date"
              value={filterFrom}
              onChange={e => setFilterFrom(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d254c]/30 focus:border-[#0d254c]"
            />
          </div>

          {/* date to */}
          <div className="relative">
            <label className="absolute -top-2 left-3 text-[10px] text-gray-400 bg-white px-1">До даты</label>
            <input
              type="date"
              value={filterTo}
              onChange={e => setFilterTo(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d254c]/30 focus:border-[#0d254c]"
            />
          </div>
        </div>

        {(filterTeacher || filterStatus || filterFrom || filterTo) && (
          <button
            onClick={() => { setFilterTeacher(""); setFilterStatus(""); setFilterFrom(""); setFilterTo(""); }}
            className="mt-3 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
          >
            <X size={12}/> Сбросить фильтры
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-semibold text-[#0d254c]">
            Журнал замен
            <span className="ml-2 text-sm font-normal text-gray-500">
              {total > 0 ? `${total} записей` : ""}
            </span>
          </span>
          <button onClick={() => fetchLogs(page)} className="text-gray-400 hover:text-[#0d254c] transition p-1">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""}/>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <RefreshCw className="animate-spin" size={20}/> Загрузка...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-3 opacity-20"/>
            <p className="font-medium">Записей нет</p>
            <p className="text-sm mt-1">Журнал заполнится после первой замены</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map(log => {
              const isExpanded = expanded === log.id;
              const details = log.details || {};
              const subs = details.substitutions || [];
              const fails = details.failed || [];
              const dt = new Date(log.created_at);
              const dateStr = dt.toLocaleDateString("ru-RU", { day:"2-digit", month:"2-digit", year:"numeric" });
              const timeStr = dt.toLocaleTimeString("ru-RU", { hour:"2-digit", minute:"2-digit" });

              return (
                <div key={log.id} className="hover:bg-gray-50/50 transition">
                  {/* Main row */}
                  <div className="px-5 py-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : log.id)}>
                    {/* Status badge */}
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      log.status === "success" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
                    }`}>
                      {log.status === "success" ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                    </div>

                    {/* Teacher */}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 truncate">{log.sick_teacher_name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar size={11}/> {log.start_date} — {log.end_date}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4 text-sm shrink-0">
                      <div className="text-center">
                        <div className="font-bold text-gray-800">{log.total_lessons}</div>
                        <div className="text-xs text-gray-400">уроков</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-600">{log.substituted}</div>
                        <div className="text-xs text-gray-400">заменено</div>
                      </div>
                      {log.failed > 0 && (
                        <div className="text-center">
                          <div className="font-bold text-red-500">{log.failed}</div>
                          <div className="text-xs text-gray-400">не найдено</div>
                        </div>
                      )}
                    </div>

                    {/* Date/time + actions */}
                    <div className="shrink-0 text-right">
                      <div className="text-xs text-gray-500">{dateStr}</div>
                      <div className="text-xs text-gray-400">{timeStr}</div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(log.id); }}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash2 size={14}/>
                      </button>
                      <div className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                        <ChevronLeft size={16} className="rotate-90"/>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 bg-gray-50/80 border-t border-gray-100">
                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Successful substitutions */}
                        {subs.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                              <CheckCircle size={12}/> Назначены замены ({subs.length})
                            </div>
                            <div className="flex flex-col gap-1">
                              {subs.map((s, i) => (
                                <div key={i} className="bg-white rounded-lg px-3 py-2 border border-green-100 text-xs">
                                  <span className="font-medium text-gray-700">{DAY_LABELS[s.day] || s.day}, урок {s.lessonNum}</span>
                                  <span className="text-gray-500"> — {s.subject}</span>
                                  <div className="text-green-700 mt-0.5">
                                    → {s.substituteName}
                                    {!s.isSameSubject && <span className="ml-1 text-amber-600">(дежурный)</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Failed */}
                        {fails.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                              <AlertCircle size={12}/> Не удалось найти замену ({fails.length})
                            </div>
                            <div className="flex flex-col gap-1">
                              {fails.map((f, i) => (
                                <div key={i} className="bg-white rounded-lg px-3 py-2 border border-red-100 text-xs">
                                  <span className="font-medium text-gray-700">{DAY_LABELS[f.day] || f.day}, урок {f.lessonNum}</span>
                                  <span className="text-gray-500"> — {f.subject}</span>
                                  {f.reason && <div className="text-red-500 mt-0.5">{f.reason}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">Стр. {page} из {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-[#0d254c] transition"
              >
                <ChevronLeft size={16}/>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                      p === page ? "bg-[#0d254c] text-white" : "border border-gray-200 hover:border-[#0d254c] text-gray-600"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-[#0d254c] transition"
              >
                <ChevronRight size={16}/>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WindowsPage() {
  const [teachers, setTeachers] = useState([]);
  const [windows, setWindows]   = useState([]);
  const [settings, setSettings] = useState({
    max_lessons_junior: 8, max_lessons_senior: 9,
    hard_subjects_first: true, allow_windows: false, max_windows_per_day: 1,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");
  const [message, setMessage]   = useState({ text: "", type: "" });
  const emptyForm = { teacher_id: "", day: "", lesson_from: "", lesson_to: "", reason: "", is_fixed: false };
  const [form, setForm] = useState(emptyForm);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3500);
  };

  useEffect(() => {
    fetch("/api/teachers").then(r => r.json()).then(d => setTeachers(Array.isArray(d) ? d : [])).catch(() => {});
    const sw = localStorage.getItem("schedule_windows");
    setWindows(sw ? JSON.parse(sw) : []);
    fetch("/api/settings").then(r => r.json()).then(d => {
      setSettings(prev => ({ ...prev, ...d }));
    }).catch(() => {}).finally(() => setLoadingSettings(false));
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res  = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) showMsg("✅ Настройки сохранены и будут применены при генерации расписания");
      else showMsg("❌ Ошибка сохранения", "error");
    } catch {
      localStorage.setItem("schedule_settings", JSON.stringify(settings));
      showMsg("✅ Настройки сохранены локально");
    }
    setSaving(false);
  };

  const handleAddWindow = () => {
    if (!form.teacher_id) return showMsg("⚠️ Выберите учителя", "error");
    if (!form.day) return showMsg("⚠️ Выберите день", "error");
    if (!form.lesson_from || !form.lesson_to) return showMsg("⚠️ Укажите уроки", "error");
    if (Number(form.lesson_from) > Number(form.lesson_to)) return showMsg("⚠️ Начало не может быть позже конца", "error");
    const teacher = teachers.find(t => t.teacher_id === Number(form.teacher_id));
    const nw = {
      id: Date.now(),
      teacher_id: Number(form.teacher_id),
      teacher_name: teacher?.full_name || "—",
      day: form.day,
      lesson_from: Number(form.lesson_from),
      lesson_to: Number(form.lesson_to),
      reason: form.reason || "Перепад",
      is_fixed: form.is_fixed,
    };
    const updated = [...windows, nw];
    setWindows(updated);
    localStorage.setItem("schedule_windows", JSON.stringify(updated));
    setForm(emptyForm);
    setShowForm(false);
    showMsg("✅ Перепад добавлен");
  };

  const handleDelete = id => {
    const updated = windows.filter(w => w.id !== id);
    setWindows(updated);
    localStorage.setItem("schedule_windows", JSON.stringify(updated));
  };

  const grouped = {};
  windows.forEach(w => {
    if (!grouped[w.teacher_id]) grouped[w.teacher_id] = { teacher_name: w.teacher_name, entries: [] };
    grouped[w.teacher_id].entries.push(w);
  });

  const TABS = [
    { key: "settings",     label: "⚙️ Настройки расписания" },
    { key: "substitutes",  label: "🔄 Замены учителей"       },
    { key: "windows",      label: "🪟 Перепады"              },
  ];

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0d254c] flex items-center gap-3">
            <Settings size={32}/> Расписание и замены
          </h1>
          <p className="text-gray-500 mt-1">Настройки расписания, журнал замен и перепады учителей</p>
        </div>
        {activeTab === "windows" && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#0d254c] text-white px-6 py-3 rounded-xl hover:bg-blue-800 transition font-semibold shadow"
          >
            <Plus size={18}/> Добавить перепад
          </button>
        )}
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl border font-medium flex items-center gap-2 ${
          message.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
        }`}>
          {message.type === "error" ? <AlertCircle size={18}/> : <CheckCircle size={18}/>} {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition ${
              activeTab === tab.key
                ? "bg-[#0d254c] text-white shadow"
                : "bg-white text-gray-600 border border-gray-200 hover:border-[#0d254c]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Settings tab ─── */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-2xl">
          <h2 className="text-xl font-bold text-[#0d254c] mb-6">Общие настройки расписания</h2>
          {loadingSettings ? (
            <div className="flex items-center gap-3 py-8">
              <RefreshCw className="animate-spin text-[#0d254c]" size={24}/>
              <span className="text-gray-500">Загрузка настроек...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-semibold text-gray-800">Максимум уроков (1–9 классы)</div>
                  <div className="text-sm text-gray-500 mt-0.5">Обычно не более 8 уроков в день</div>
                </div>
                <div className="flex items-center gap-2">
                  {[6,7,8].map(n => (
                    <button key={n} onClick={() => setSettings(s => ({ ...s, max_lessons_junior: n }))}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition ${settings.max_lessons_junior === n ? "bg-[#0d254c] text-white" : "bg-white border border-gray-300 text-gray-600 hover:border-[#0d254c]"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-semibold text-gray-800">Максимум уроков (10–11 классы)</div>
                  <div className="text-sm text-gray-500 mt-0.5">Для старших классов допустимо 9 уроков</div>
                </div>
                <div className="flex items-center gap-2">
                  {[7,8,9].map(n => (
                    <button key={n} onClick={() => setSettings(s => ({ ...s, max_lessons_senior: n }))}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition ${settings.max_lessons_senior === n ? "bg-[#0d254c] text-white" : "bg-white border border-gray-300 text-gray-600 hover:border-[#0d254c]"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-sm text-amber-800">
                <Info size={18} className="shrink-0 mt-0.5"/>
                <span>Эти настройки применяются при <strong>автоматической генерации расписания</strong>. Сложные предметы (отмеченные примечанием) ставятся в первую половину дня.</span>
              </div>

              <button onClick={saveSettings} disabled={saving}
                className="flex items-center justify-center gap-2 bg-[#0d254c] text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition disabled:opacity-50 shadow">
                {saving ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>}
                {saving ? "Сохранение..." : "Сохранить настройки"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Substitutes tab ─── */}
      {activeTab === "substitutes" && <SubstituteLogsTab/>}

      {/* ─── Windows tab ─── */}
      {activeTab === "windows" && (
        <>
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
                <div className="p-6 border-b flex justify-between items-center">
                  <h2 className="text-xl font-bold text-[#0d254c]">Новый перепад (окно)</h2>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700"><X size={24}/></button>
                </div>
                <div className="p-6 flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">Учитель *</label>
                    <select value={form.teacher_id} onChange={e => setForm(p => ({ ...p, teacher_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0d254c]">
                      <option value="">-- Выберите учителя --</option>
                      {teachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.full_name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">День *</label>
                    <div className="flex gap-2">
                      {DAYS.map(d => (
                        <button key={d.key} type="button" onClick={() => setForm(p => ({ ...p, day: d.key }))}
                          className={`flex-1 py-2 rounded-xl font-semibold text-sm transition border-2 ${form.day === d.key ? "bg-[#0d254c] text-white border-[#0d254c]" : "bg-white text-gray-600 border-gray-200 hover:border-[#0d254c]"}`}>
                          {d.short}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">С урока *</label>
                      <select value={form.lesson_from} onChange={e => setForm(p => ({ ...p, lesson_from: e.target.value }))}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0d254c]">
                        <option value="">— Урок —</option>
                        {Array.from({ length: MAX_LESSONS }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} урок</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">По урок *</label>
                      <select value={form.lesson_to} onChange={e => setForm(p => ({ ...p, lesson_to: e.target.value }))}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0d254c]">
                        <option value="">— Урок —</option>
                        {Array.from({ length: MAX_LESSONS }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} урок</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">Причина</label>
                    <input type="text" placeholder="Например: совещание, личные обстоятельства..." value={form.reason}
                      onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0d254c]"/>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-blue-50 rounded-xl">
                    <input type="checkbox" checked={form.is_fixed} onChange={e => setForm(p => ({ ...p, is_fixed: e.target.checked }))} className="w-5 h-5 accent-[#0d254c]"/>
                    <div>
                      <div className="font-medium text-gray-800">Постоянный перепад (каждую неделю)</div>
                      <div className="text-xs text-gray-500">Учитель всегда свободен в это время</div>
                    </div>
                  </label>

                  <div className="flex gap-3 pt-2">
                    <button onClick={handleAddWindow} className="flex-1 bg-[#0d254c] text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition flex items-center justify-center gap-2">
                      <Save size={18}/> Добавить
                    </button>
                    <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition">Отмена</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {windows.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
              <Settings size={48} className="mx-auto mb-4 opacity-30"/>
              <p className="text-xl font-medium">Перепадов нет</p>
              <p className="text-sm mt-2">Добавьте окна в расписании учителей</p>
              <button onClick={() => setShowForm(true)} className="mt-4 bg-[#0d254c] text-white px-6 py-2 rounded-xl hover:bg-blue-800 transition text-sm font-semibold">+ Добавить</button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.entries(grouped).map(([tid, group]) => (
                <div key={tid} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 bg-[#0d254c]/5 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#0d254c] text-white flex items-center justify-center font-bold">{group.teacher_name?.[0] || "?"}</div>
                    <div>
                      <div className="font-semibold text-gray-900">{group.teacher_name}</div>
                      <div className="text-xs text-gray-500">{group.entries.length} перепад(ов)</div>
                    </div>
                  </div>

                  <div className="p-4 overflow-x-auto">
                    <table className="text-xs text-center">
                      <thead>
                        <tr>
                          <th className="p-1 text-left text-gray-500 w-16">День</th>
                          {Array.from({ length: MAX_LESSONS }, (_, i) => i + 1).map(n => (
                            <th key={n} className="p-1 text-gray-500 w-9">{n}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DAYS.map(day => {
                          const dayWindows = group.entries.filter(w => w.day === day.key);
                          const wSet = new Set();
                          dayWindows.forEach(w => { for (let i = w.lesson_from; i <= w.lesson_to; i++) wSet.add(i); });
                          return (
                            <tr key={day.key}>
                              <td className="p-1 text-left text-gray-600 font-medium">{day.short}</td>
                              {Array.from({ length: MAX_LESSONS }, (_, i) => i + 1).map(n => (
                                <td key={n} className="p-0.5">
                                  <div className={`w-8 h-6 rounded mx-auto ${wSet.has(n) ? "bg-red-200 border border-red-400" : "bg-green-100 border border-green-200"}`}/>
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 border border-red-400 inline-block"/> Окно</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block"/> Доступно</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {group.entries.map(win => {
                      const dayLabel = DAYS.find(d => d.key === win.day)?.label;
                      return (
                        <div key={win.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition">
                          <div className="flex items-center gap-4">
                            <Clock size={14} className="text-gray-400"/>
                            <span className="font-semibold text-gray-800">{dayLabel}</span>
                            <span className="text-sm text-gray-600">
                              {win.lesson_from === win.lesson_to ? `${win.lesson_from} урок` : `${win.lesson_from}–${win.lesson_to} уроки`}
                            </span>
                            <span className="text-sm text-gray-500">{win.reason}</span>
                            {win.is_fixed && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Постоянный</span>}
                          </div>
                          <button onClick={() => handleDelete(win.id)} className="text-red-400 hover:text-red-600 transition p-1 rounded-lg hover:bg-red-50"><Trash2 size={16}/></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}