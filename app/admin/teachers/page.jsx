
"use client";
import { useState, useEffect } from "react";
import { 
  ChevronDown, ChevronUp, Plus, Trash2, Save, X, 
  BookOpen, Users, Clock, Search, UserPlus, Pencil
} from "lucide-react";

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // Редактирование учителя
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editClassroom, setEditClassroom] = useState("");

  const startEdit = (t) => {
    setEditId(t.teacher_id);
    setEditName(t.full_name);
    setEditSubject(t.subject || "");
    setEditClassroom(t.classroom || "");
  };

  const handleUpdate = async () => {
    const res = await fetch("/api/teachers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId,
        name: editName,
        subject: editSubject,
        classroom: editClassroom,
      }),
    });
    if (res.ok) {
      setEditId(null);
      fetchTeachers();
    }
  };

  // Форма добавления учителя
  const [newName, setNewName] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newClassroom, setNewClassroom] = useState("");

  // Форма добавления привязки (локальная для каждого учителя)
  const [bindClassId, setBindClassId] = useState("");
  const [bindSubjectId, setBindSubjectId] = useState("");
  const [bindGroup, setBindGroup] = useState("Толық сынып");

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teachers");
      const data = await res.json();
      setTeachers(Array.isArray(data) ? data : data.teachers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      const all = [...(data.small || []), ...(data.large || [])];
      all.sort((a, b) => a.class_name.localeCompare(b.class_name, "ru"));
      setClasses(all);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchClasses();
  }, []);

  // Подгружаем предметы для выбранного класса при настройке нагрузки
  useEffect(() => {
    if (bindClassId) {
      fetch(`/api/subjects/${bindClassId}`)
        .then(r => r.json())
        .then(data => {
          // API /api/subjects/[classId] возвращает массив объектов {subject_id, name, ...}
          setSubjects(Array.isArray(data) ? data : []);
        })
        .catch(err => {
          console.error("Ошибка загрузки предметов:", err);
          setSubjects([]);
        });
    } else {
      setSubjects([]);
    }
  }, [bindClassId]);

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        subject: newSubject,
        classroom: newClassroom,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewName("");
      setNewSubject("");
      setNewClassroom("");
      fetchTeachers();
      // Раскрываем нового учителя для настройки классов
      if (data.teacher) setExpandedId(data.teacher.teacher_id);
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!confirm("Удалить учителя и все его привязки к классам?")) return;
    const res = await fetch("/api/teachers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchTeachers();
  };

  const handleAddBinding = async (teacherId) => {
    if (!bindClassId || !bindSubjectId) return;
    const res = await fetch("/api/class-subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacher_id: teacherId,
        class_id: bindClassId,
        subject_id: bindSubjectId,
        group_type: bindGroup
      }),
    });
    if (res.ok) {
      setBindClassId("");
      setBindSubjectId("");
      fetchTeachers();
    }
  };

  const handleDeleteBinding = async (id) => {
    const res = await fetch("/api/class-subjects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchTeachers();
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.subject && t.subject.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0d254c] tracking-tight">
            Преподаватели и Нагрузка
          </h1>
          <p className="text-gray-500 mt-1">Управление составом учителей и распределение учебных часов</p>
        </div>
      </div>

      {/* ФОРМА ДОБАВЛЕНИЯ */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 transition-all hover:shadow-md">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <UserPlus size={20} />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Новый преподаватель</h2>
        </div>
        <form onSubmit={handleAddTeacher} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">ФИО Учителя</label>
            <input
              type="text"
              placeholder="Иванов Иван Иванович"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#0d254c] outline-none transition"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Основной предмет</label>
            <input
              type="text"
              placeholder="Например, Математика"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#0d254c] outline-none transition"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Кабинет</label>
            <input
              type="text"
              placeholder="№305"
              value={newClassroom}
              onChange={(e) => setNewClassroom(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#0d254c] outline-none transition"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-[#0d254c] text-white py-3 rounded-xl font-bold hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 h-[46px]"
            >
              <Plus size={18} /> Создать
            </button>
          </div>
        </form>
      </div>

      {/* ПОИСК */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Поиск учителя по имени или предмету..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#0d254c] outline-none shadow-sm transition"
        />
      </div>

      {/* СПИСОК УЧИТЕЛЕЙ */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="animate-spin text-blue-600"><Clock size={32} /></div>
            <p className="text-gray-400 font-medium">Загрузка данных...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-400">Никого не нашли. Попробуйте изменить поиск.</p>
          </div>
        ) : (
          filteredTeachers.map((t) => {
            const isExpanded = expandedId === t.teacher_id;
            const isEditing = editId === t.teacher_id;
            
            return (
              <div 
                key={t.teacher_id} 
                className={`bg-white rounded-2xl border transition-all duration-300 ${isExpanded ? 'ring-2 ring-blue-500 border-transparent shadow-xl' : 'border-gray-100 hover:border-gray-300 shadow-sm'}`}
              >
                {/* Заголовок карточки */}
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer"
                  onClick={() => !isEditing && setExpandedId(isExpanded ? null : t.teacher_id)}
                >
                  <div className="flex items-center gap-5 flex-1">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
                      {t.full_name[0]}
                    </div>
                    {isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 mr-4" onClick={e => e.stopPropagation()}>
                        <input 
                          value={editName} onChange={e => setEditName(e.target.value)}
                          className="border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="ФИО"
                        />
                        <input 
                          value={editSubject} onChange={e => setEditSubject(e.target.value)}
                          className="border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Предмет"
                        />
                        <input 
                          value={editClassroom} onChange={e => setEditClassroom(e.target.value)}
                          className="border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Кабинет"
                        />
                      </div>
                    ) : (
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{t.full_name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <BookOpen size={14} /> {t.subject || "Без предмета"}
                          </span>
                          {t.classroom && (
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              · каб. {t.classroom}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {!isEditing && (
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Нагрузка</p>
                        <p className="text-xl font-black text-[#0d254c]">{t.total_workload || 0} <span className="text-xs font-medium text-gray-400">ч/нед</span></p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={handleUpdate} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            <Save size={18} />
                          </button>
                          <button onClick={() => setEditId(null)} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition">
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); startEdit(t); }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteTeacher(t.teacher_id); }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 size={18} />
                          </button>
                          <div className={`p-2 rounded-lg transition ${isExpanded ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}>
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Раскрывающаяся панель управления нагрузкой */}
                {isExpanded && (
                  <div className="p-6 border-t border-gray-50 bg-gray-50/50 rounded-b-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Список текущих классов */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2">
                          <Users size={16} /> Закрепленные классы
                        </h4>
                        <div className="space-y-2">
                          {t.class_subjects && t.class_subjects.length > 0 ? (
                            t.class_subjects.map((cs) => (
                              <div key={cs.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm group">
                                <div className="flex items-center gap-3">
                                  <span className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-700">
                                    {cs.classes.class_name}
                                  </span>
                                  <div>
                                    <p className="font-bold text-sm text-gray-800">{cs.subjects.name}</p>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase">{cs.group_type}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleDeleteBinding(cs.id)}
                                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="py-10 text-center text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-2xl bg-white">
                              Классы пока не добавлены
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Форма добавления привязки */}
                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                          <Plus size={16} /> Добавить нагрузку
                        </h4>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 ml-1">Класс</label>
                            <select 
                              value={bindClassId}
                              onChange={(e) => setBindClassId(e.target.value)}
                              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50"
                            >
                              <option value="">Выберите класс...</option>
                              {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 ml-1">Предмет</label>
                            <select 
                              value={bindSubjectId}
                              onChange={(e) => setBindSubjectId(e.target.value)}
                              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50"
                            >
                              <option value="">Выберите предмет...</option>
                              {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 ml-1">Группа</label>
                            <select 
                              value={bindGroup}
                              onChange={(e) => setBindGroup(e.target.value)}
                              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50"
                            >
                              <option value="Толық сынып">Весь класс (Толық сынып)</option>
                              <option value="1 топ">1 подгруппа</option>
                              <option value="2 топ">2 подгруппа</option>
                              <option value="ұлдар">Мальчики (Ұлдар)</option>
                              <option value="қыздар">Девочки (Қыздар)</option>
                            </select>
                          </div>
                          <button 
                            onClick={() => handleAddBinding(t.teacher_id)}
                            disabled={!bindClassId || !bindSubjectId}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-30 disabled:grayscale shadow-lg shadow-blue-600/20"
                          >
                            Привязать к учителю
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
        <span>Всего в штате: {teachers.length}</span>
        <span>Школа №10 · Система Управления Нагрузкой</span>
      </div>
    </div>
  );
}