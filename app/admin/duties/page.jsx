"use client";
import { useState, useEffect } from "react";
import { Shield, Plus, Trash2, CalendarDays, RefreshCw, Save, X, AlertCircle, CheckCircle } from "lucide-react";

const DAYS = [
  { key:"monday",    label:"Понедельник", short:"Пн" },
  { key:"tuesday",   label:"Вторник",     short:"Вт" },
  { key:"wednesday", label:"Среда",       short:"Ср" },
  { key:"thursday",  label:"Четверг",     short:"Чт" },
  { key:"friday",    label:"Пятница",     short:"Пт" },
];

export default function DutiesPage() {
  const [teachers, setTeachers] = useState([]);
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState({ text:"", type:"" });
  const emptyForm = { teacher_id:"", days:[], reason:"", date_from:"", date_to:"", is_recurring:false };
  const [form, setForm] = useState(emptyForm);

  const showMsg = (text, type="success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text:"", type:"" }), 3500);
  };

  useEffect(() => {
    fetch("/api/teachers").then(r=>r.json()).then(d => setTeachers(Array.isArray(d)?d:[])).catch(()=>{});
    const stored = localStorage.getItem("teacher_duties");
    setDuties(stored ? JSON.parse(stored) : []);
    setLoading(false);
  }, []);

  const toggleDay = day => setForm(p => ({
    ...p, days: p.days.includes(day) ? p.days.filter(d=>d!==day) : [...p.days, day]
  }));

  const handleAdd = () => {
    if (!form.teacher_id) return showMsg("⚠️ Выберите учителя", "error");
    if (!form.days.length) return showMsg("⚠️ Выберите хотя бы один день", "error");
    const teacher = teachers.find(t => t.teacher_id === Number(form.teacher_id));
    const newDuty = {
      id: Date.now(),
      teacher_id: Number(form.teacher_id),
      teacher_name: teacher?.full_name || "—",
      days: form.days,
      reason: form.reason || "Дежурство",
      date_from: form.date_from,
      date_to: form.date_to,
      is_recurring: form.is_recurring,
    };
    const updated = [...duties, newDuty];
    setDuties(updated);
    localStorage.setItem("teacher_duties", JSON.stringify(updated));
    setForm(emptyForm);
    setShowForm(false);
    showMsg("✅ Дежурство добавлено");
  };

  const handleDelete = id => {
    const updated = duties.filter(d => d.id !== id);
    setDuties(updated);
    localStorage.setItem("teacher_duties", JSON.stringify(updated));
    showMsg("✅ Удалено");
  };

  const grouped = {};
  duties.forEach(d => {
    if (!grouped[d.teacher_id]) grouped[d.teacher_id] = { teacher_name: d.teacher_name, entries:[] };
    grouped[d.teacher_id].entries.push(d);
  });

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin text-[#0d254c]" size={32}/></div>;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0d254c] flex items-center gap-3"><Shield size={32}/>Дежурства</h1>
          <p className="text-gray-500 mt-1">Освобождение учителей от занятий на выбранные дни</p>
        </div>
        <button onClick={()=>setShowForm(true)} className="flex items-center gap-2 bg-[#0d254c] text-white px-6 py-3 rounded-xl hover:bg-blue-800 transition font-semibold shadow">
          <Plus size={18}/> Добавить дежурство
        </button>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl border font-medium flex items-center gap-2 ${message.type==="error"?"bg-red-50 text-red-700 border-red-200":"bg-green-50 text-green-700 border-green-200"}`}>
          {message.type==="error"?<AlertCircle size={18}/>:<CheckCircle size={18}/>} {message.text}
        </div>
      )}

      {/* Форма */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#0d254c]">Новое дежурство</h2>
              <button onClick={()=>setShowForm(false)} className="text-gray-400 hover:text-gray-700"><X size={24}/></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Учитель *</label>
                <select value={form.teacher_id} onChange={e=>setForm(p=>({...p,teacher_id:e.target.value}))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0d254c]">
                  <option value="">-- Выберите учителя --</option>
                  {teachers.map(t=>(
                    <option key={t.teacher_id} value={t.teacher_id}>{t.full_name}{t.classroom ? ` (каб. ${t.classroom})` : ""}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Дни без занятий *</label>
                <div className="flex gap-2">
                  {DAYS.map(day=>(
                    <button key={day.key} type="button" onClick={()=>toggleDay(day.key)}
                      className={`flex-1 py-2 rounded-xl font-semibold text-sm transition border-2 ${form.days.includes(day.key)?"bg-[#0d254c] text-white border-[#0d254c]":"bg-white text-gray-600 border-gray-200 hover:border-[#0d254c]"}`}>
                      {day.short}
                    </button>
                  ))}
                </div>
                {form.days.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    Освобождён: {form.days.map(k=>DAYS.find(d=>d.key===k)?.label).join(", ")}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Причина</label>
                <input type="text" placeholder="Например: административное дежурство..." value={form.reason}
                  onChange={e=>setForm(p=>({...p,reason:e.target.value}))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0d254c]"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">С даты</label>
                  <input type="date" value={form.date_from} onChange={e=>setForm(p=>({...p,date_from:e.target.value}))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0d254c]"/>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">По дату</label>
                  <input type="date" value={form.date_to} onChange={e=>setForm(p=>({...p,date_to:e.target.value}))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0d254c]"/>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-blue-50 rounded-xl">
                <input type="checkbox" checked={form.is_recurring} onChange={e=>setForm(p=>({...p,is_recurring:e.target.checked}))} className="w-5 h-5 accent-[#0d254c]"/>
                <div>
                  <div className="font-medium text-gray-800">Постоянное (каждую неделю)</div>
                  <div className="text-xs text-gray-500">Учитель всегда свободен в эти дни</div>
                </div>
              </label>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0"/>
                <span>Дежурство <strong>не меняет</strong> данные в расписании. Это информационная метка для учёта.</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleAdd} className="flex-1 bg-[#0d254c] text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition flex items-center justify-center gap-2">
                  <Save size={18}/> Сохранить
                </button>
                <button onClick={()=>setShowForm(false)} className="flex-1 border border-gray-300 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Сводка по дням */}
      {duties.length > 0 && (
        <div className="mb-6 grid grid-cols-5 gap-3">
          {DAYS.map(day => {
            const cnt = duties.filter(d=>d.days.includes(day.key)).length;
            return (
              <div key={day.key} className={`rounded-xl p-3 text-center border ${cnt>0?"bg-blue-50 border-blue-200":"bg-white border-gray-200"}`}>
                <div className="font-bold text-[#0d254c] text-lg">{day.short}</div>
                <div className="text-xs text-gray-500">{day.label}</div>
                {cnt>0 ? (
                  <div className="mt-1 text-sm font-semibold text-blue-700">{cnt} учит.<div className="text-xs font-normal text-blue-500">освобождены</div></div>
                ) : (
                  <div className="mt-1 text-xs text-gray-400">нет</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Список */}
      {duties.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
          <Shield size={48} className="mx-auto mb-4 opacity-30"/>
          <p className="text-xl font-medium">Дежурств нет</p>
          <p className="text-sm mt-2">Добавьте дежурство чтобы освободить учителя от занятий</p>
          <button onClick={()=>setShowForm(true)} className="mt-4 bg-[#0d254c] text-white px-6 py-2 rounded-xl hover:bg-blue-800 transition text-sm font-semibold">+ Добавить</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([tid, group]) => (
            <div key={tid} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-[#0d254c]/5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0d254c] text-white flex items-center justify-center font-bold">{group.teacher_name?.[0]||"?"}</div>
                <div>
                  <div className="font-semibold text-gray-900">{group.teacher_name}</div>
                  <div className="text-xs text-gray-500">
                    Освобождён в дни: <span className="font-medium text-blue-600">
                      {[...new Set(group.entries.flatMap(e=>e.days))].map(k=>DAYS.find(d=>d.key===k)?.short).join(", ") || "—"}
                    </span>
                  </div>
                </div>
              </div>
              {group.entries.map(duty => (
                <div key={duty.id} className="px-4 py-3 flex items-center justify-between border-t border-gray-50 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                      {DAYS.map(day=>(
                        <span key={day.key} className={`text-xs px-2 py-1 rounded-lg font-semibold ${duty.days.includes(day.key)?"bg-[#0d254c] text-white":"bg-gray-100 text-gray-400"}`}>{day.short}</span>
                      ))}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {duty.reason}
                        {duty.is_recurring && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Постоянное</span>}
                      </div>
                      {(duty.date_from||duty.date_to) && (
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <CalendarDays size={12}/>
                          {duty.date_from && <span>с {new Date(duty.date_from).toLocaleDateString("ru-RU")}</span>}
                          {duty.date_to && <span>по {new Date(duty.date_to).toLocaleDateString("ru-RU")}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={()=>handleDelete(duty.id)} className="text-red-400 hover:text-red-600 transition p-1 rounded-lg hover:bg-red-50"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
