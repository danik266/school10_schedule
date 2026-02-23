"use client";
import { useState, useEffect, useCallback } from "react";
import { BookOpen, RefreshCw, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Save } from "lucide-react";

const DAY_LABELS = { Monday:"Пн", Tuesday:"Вт", Wednesday:"Ср", Thursday:"Чт", Friday:"Пт" };
const DAY_KEYS = ["Monday","Tuesday","Wednesday","Thursday","Friday"];

const NUANCES_OPTIONS = [
  { value:"none",            label:"Нет ограничений",           desc:"Урок можно ставить в любое время" },
  { value:"no_friday",       label:"Не ставить в пятницу",      desc:"Учитель не ведёт уроки по пятницам" },
  { value:"no_monday",       label:"Не ставить в понедельник",  desc:"Учитель не ведёт уроки по понедельникам" },
  { value:"morning_only",    label:"Только первая половина",    desc:"Уроки только с 1 по 4 урок" },
  { value:"afternoon_only",  label:"Только вторая половина",    desc:"Уроки только с 5 урока и далее" },
  { value:"no_first_lesson", label:"Не ставить первым уроком",  desc:"Начало не раньше 2-го урока" },
  { value:"no_last_lesson",  label:"Не ставить последним",      desc:"Последний урок в день — не этот учитель" },
];

export default function WorkloadPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeacher, setExpandedTeacher] = useState(null);
  const [savingNuances, setSavingNuances] = useState({});
  const [nuancesValues, setNuancesValues] = useState({});
  const [message, setMessage] = useState({ text:"", type:"" });

  const showMsg = (text, type="success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text:"", type:"" }), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workload");
      if (!res.ok) throw new Error("Ошибка " + res.status);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setTeachers(list);
      const init = {};
      list.forEach(t => { init[t.teacher_id] = t.nuances || "none"; });
      setNuancesValues(init);
    } catch(e) {
      showMsg("❌ Ошибка загрузки: " + e.message, "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const saveNuance = async (teacherId) => {
    setSavingNuances(prev => ({ ...prev, [teacherId]: true }));
    try {
      const val = nuancesValues[teacherId];
      const res = await fetch("/api/workload", {
        method: "PATCH",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ teacher_id: teacherId, nuances: val === "none" ? null : val }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg("✅ Примечание сохранено. Будет учтено при следующей генерации расписания");
        setTeachers(prev => prev.map(t =>
          t.teacher_id === teacherId ? { ...t, nuances: val === "none" ? null : val } : t
        ));
      } else {
        showMsg("❌ " + (data.error || "Ошибка"), "error");
      }
    } catch(e) {
      showMsg("❌ Ошибка сети", "error");
    }
    setSavingNuances(prev => ({ ...prev, [teacherId]: false }));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="animate-spin text-[#0d254c]" size={32} />
      <span className="ml-3 text-gray-500 text-lg">Загрузка из расписания...</span>
    </div>
  );

  const totalHours = teachers.reduce((s,t) => s + t.total_hours, 0);
  const overloaded = teachers.filter(t => t.total_hours > 36).length;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0d254c] flex items-center gap-3">
            <BookOpen size={32} /> Нагрузка (Часы)
          </h1>
          <p className="text-gray-500 mt-1">Данные из расписания · 1 урок = 1 час · Примечания влияют на генерацию</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition font-medium">
          <RefreshCw size={16} /> Обновить
        </button>
      </div>

      {message.text && (
        <div className={`mb-5 p-4 rounded-xl border font-medium flex items-center gap-2 ${message.type==="error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
          {message.type==="error" ? <AlertCircle size={18}/> : <CheckCircle size={18}/>}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm text-center">
          <div className="text-3xl font-bold text-[#0d254c]">{teachers.length}</div>
          <div className="text-sm text-gray-500 mt-1">Учителей</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm text-center">
          <div className="text-3xl font-bold text-[#0d254c]">{totalHours}</div>
          <div className="text-sm text-gray-500 mt-1">Уроков всего</div>
        </div>
        <div className={`rounded-2xl p-5 border shadow-sm text-center ${overloaded>0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
          <div className={`text-3xl font-bold ${overloaded>0 ? "text-red-600" : "text-green-600"}`}>{overloaded}</div>
          <div className="text-sm text-gray-500 mt-1">Перегруженных (&gt;36 ч)</div>
        </div>
      </div>

      {teachers.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30"/>
          <p className="text-xl">Расписание пустое</p>
          <p className="text-sm mt-2">Сначала сгенерируйте расписание</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {teachers.map(teacher => {
            const isExpanded = expandedTeacher === teacher.teacher_id;
            const isOverloaded = teacher.total_hours > 36;
            const pct = Math.min((teacher.total_hours / 36) * 100, 100);
            const currentNuance = nuancesValues[teacher.teacher_id] || "none";
            const nuanceChanged = currentNuance !== (teacher.nuances || "none");
            const nuanceLabel = NUANCES_OPTIONS.find(o => o.value === (teacher.nuances || "none"))?.label;

            return (
              <div key={teacher.teacher_id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition select-none"
                  onClick={() => setExpandedTeacher(isExpanded ? null : teacher.teacher_id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-[#0d254c] text-white flex items-center justify-center font-bold text-lg shrink-0">
                      {teacher.full_name?.[0] || "?"}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{teacher.full_name}</div>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{teacher.subject}</span>
                        {teacher.classroom && <span>· каб. {teacher.classroom}</span>}
                        {teacher.nuances && teacher.nuances !== "none" && (
                          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{nuanceLabel}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <div className={`text-xl font-bold ${isOverloaded ? "text-red-600" : "text-[#0d254c]"}`}>
                        {teacher.total_hours}<span className="text-sm font-normal text-gray-400 ml-1">/ 36 ч</span>
                      </div>
                      {isOverloaded && <div className="text-xs text-red-500 font-medium">⚠ +{teacher.total_hours-36}</div>}
                    </div>
                    <div className="w-28 hidden sm:block">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isOverloaded ? "bg-red-500" : "bg-[#0d254c]"}`} style={{width:`${pct}%`}}/>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 text-right">{teacher.subjects.length} предм.</div>
                    </div>
                    {isExpanded ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {/* Примечания */}
                    <div className="p-5 bg-blue-50/60 border-b border-blue-100">
                      <div className="font-semibold text-gray-800 mb-2 text-sm">📌 Примечание (влияет на генерацию расписания)</div>
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <select
                            value={currentNuance}
                            onChange={e => setNuancesValues(p => ({...p, [teacher.teacher_id]: e.target.value}))}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0d254c]"
                          >
                            {NUANCES_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1.5 pl-1">
                            {NUANCES_OPTIONS.find(o => o.value === currentNuance)?.desc}
                          </p>
                          {nuanceChanged && (
                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                              <AlertCircle size={12}/> Не сохранено — нажмите «Сохранить»
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => saveNuance(teacher.teacher_id)}
                          disabled={!nuanceChanged || savingNuances[teacher.teacher_id]}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition shrink-0 ${!nuanceChanged ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-[#0d254c] text-white hover:bg-blue-800 shadow"}`}
                        >
                          {savingNuances[teacher.teacher_id] ? <RefreshCw size={15} className="animate-spin"/> : <Save size={15}/>}
                          Сохранить
                        </button>
                      </div>
                    </div>

                    {/* Таблица предметов */}
                    <div className="p-5">
                      <div className="font-semibold text-gray-800 mb-3 text-sm">Предметы из расписания (1 ячейка = 1 час)</div>
                      {teacher.subjects.length === 0 ? (
                        <p className="text-gray-400 text-sm">Нет уроков в расписании</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="text-left px-3 py-2 rounded-l-lg">Предмет</th>
                                <th className="px-3 py-2 text-center">Тип</th>
                                {DAY_KEYS.map(d => (
                                  <th key={d} className="px-2 py-2 text-center w-10">{DAY_LABELS[d]}</th>
                                ))}
                                <th className="px-3 py-2 text-center font-bold rounded-r-lg">Итого</th>
                              </tr>
                            </thead>
                            <tbody>
                              {teacher.subjects.map(subj => {
                                const tot = DAY_KEYS.reduce((s,d) => s+(subj.days[d]||0), 0);
                                return (
                                  <tr key={subj.subject_id} className="border-t border-gray-100 hover:bg-gray-50">
                                    <td className="px-3 py-2.5 font-medium text-gray-800">{subj.name}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${subj.type==="elective" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                                        {subj.type==="elective" ? "Факульт." : "Основной"}
                                      </span>
                                    </td>
                                    {DAY_KEYS.map(d => (
                                      <td key={d} className="px-2 py-2.5 text-center">
                                        {subj.days[d]>0 ? (
                                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#0d254c] text-white text-xs font-bold">{subj.days[d]}</span>
                                        ) : (
                                          <span className="text-gray-200">—</span>
                                        )}
                                      </td>
                                    ))}
                                    <td className="px-3 py-2.5 text-center">
                                      <span className="font-bold text-[#0d254c]">{tot}</span>
                                      <span className="text-xs text-gray-400 ml-0.5">ч</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-gray-200">
                                <td colSpan={2+DAY_KEYS.length} className="px-3 py-2.5 text-right font-semibold text-gray-700">Итого в неделю:</td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className={`font-bold text-lg ${isOverloaded ? "text-red-600" : "text-[#0d254c]"}`}>{teacher.total_hours}</span>
                                  <span className="text-xs text-gray-400 ml-0.5">ч</span>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
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
    </div>
  );
}
