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
  const [message, setMessage]   = useState({ text: "", type: "" });
  
  const [sickTeacherId, setSickTeacherId] = useState("");
  const [manualSubId, setManualSubId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubstituting, setIsSubstituting] = useState(false);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3500);
  };

  useEffect(() => {
    fetch("/api/teachers").then(r => r.json()).then(d => setTeachers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const handleSubstitute = async () => {
    if (!sickTeacherId || !startDate || !endDate) { showMsg("Выберите учителя и укажите период!", "error"); return; }
    if (new Date(endDate) < new Date(startDate)) { showMsg("Дата окончания не может быть раньше даты начала!", "error"); return; }
    setIsSubstituting(true);
    try {
      const duties = (() => { try { return JSON.parse(localStorage.getItem("teacher_duties") || "[]"); } catch { return []; } })();
      const payload = { teacherId: sickTeacherId, startDate, endDate, duties };
      if (manualSubId) payload.manualSubstituteId = manualSubId;
      const res = await fetch("/api/substitute-teacher", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { showMsg(data.message || "Замены успешно найдены и применены!", "success"); setSickTeacherId(""); setManualSubId(""); setStartDate(""); setEndDate(""); }
      else showMsg(data.message || data.error || "Ошибка при поиске замены", "error");
    } catch { showMsg("Ошибка сети", "error"); }
    finally { setIsSubstituting(false); }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0d254c] flex items-center gap-3">
            <Settings size={32}/> Расписание и замены
          </h1>
          <p className="text-gray-500 mt-1">Журнал замен и поиск временной замены для учителя</p>
        </div>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl border font-medium flex items-center gap-2 ${
          message.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
        }`}>
          {message.type === "error" ? <AlertCircle size={18}/> : <CheckCircle size={18}/>} {message.text}
        </div>
      )}

      {/* Substitute Panel */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-red-500"><RefreshCw size={24} /></span>
          <div>
            <div className="text-lg font-bold text-[#0d254c]">Режим замены</div>
            <div className="text-sm text-gray-500">Назначьте свободного учителя на период отсутствия (до генерации расписания)</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Кого заменяем *</label>
            <select className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0d254c]" value={sickTeacherId} onChange={e => { setSickTeacherId(e.target.value); setManualSubId(""); }}>
              <option value="">— Выберите учителя —</option>
              {teachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.full_name} ({t.subject})</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Кем заменяем (опционально)</label>
            <select className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0d254c]" value={manualSubId} onChange={e => setManualSubId(e.target.value)} disabled={!sickTeacherId}>
              <option value="">— Авто-подбор —</option>
              {teachers.filter(t => t.teacher_id.toString() !== sickTeacherId.toString()).map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.full_name} ({t.subject})</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Дата с</label>
            <input type="date" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0d254c]" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Дата по</label>
            <input type="date" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0d254c]" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button className="bg-[#0d254c] hover:bg-blue-800 text-white font-semibold py-2.5 px-6 rounded-xl transition flex items-center gap-2 h-[46px]" disabled={isSubstituting} onClick={handleSubstitute}>
            {isSubstituting ? <><RefreshCw size={18} className="animate-spin"/> Сохраняем...</> : <><Save size={18}/> Сохранить замену</>}
          </button>
        </div>
      </div>

      <SubstituteLogsTab />
    </div>
  );
}