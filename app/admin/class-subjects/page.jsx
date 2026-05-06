"use client";
import { useState, useEffect, useCallback } from "react";
import { 
  Users, BookOpen, Trash2, Plus, ChevronDown, ChevronUp, RefreshCw, AlertTriangle, Check, Edit2, Save
} from "lucide-react";

const GROUP_OPTIONS = [
  { value: "full_class", label: "Толық сынып" },
  { value: "subgroup_1", label: "1-топ" },
  { value: "subgroup_2", label: "2-топ" },
  { value: "girls", label: "Қыздар" },
  { value: "boys", label: "Ұлдар" },
];

function BindingRow({ row, subjects, teachers, onDelete, onUpdateHours, onUpdateBinding }) {
  const [deleting, setDeleting] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [hoursValue, setHoursValue] = useState(row.hours_per_week || 0);
  const [savingHours, setSavingHours] = useState(false);

  // Binding edit state
  const [isEditingBinding, setIsEditingBinding] = useState(false);
  const [editTeacherId, setEditTeacherId] = useState(row.teacher_id);
  const [editGroupType, setEditGroupType] = useState(row.group_type);
  const [savingBinding, setSavingBinding] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Отвязать преподавателя ${row.teachers.full_name} от ${row.subjects.name}?`)) return;
    setDeleting(true);
    await onDelete(row.id);
    setDeleting(false);
  };

  const handleSaveHours = async () => {
    setSavingHours(true);
    try {
      if (row.study_plan_id) {
        await fetch("/api/study-plan", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ study_plan_id: row.study_plan_id, hours_per_week: hoursValue })
        });
      } else {
        await fetch("/api/study-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            class_id: row.class_id, 
            subject_name: row.subjects.name, 
            hours_per_week: hoursValue 
          })
        });
      }
      setIsEditingHours(false);
      if (onUpdateHours) onUpdateHours(row.subject_id, hoursValue);
    } catch (e) {
      console.error(e);
      alert("Ошибка при сохранении часов");
    } finally {
      setSavingHours(false);
    }
  };

  const handleSaveBinding = async () => {
    setSavingBinding(true);
    try {
      const res = await fetch("/api/class-subjects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, teacher_id: editTeacherId, group_type: editGroupType })
      });
      const data = await res.json();
      if (data.success) {
        setIsEditingBinding(false);
        if (onUpdateBinding) onUpdateBinding(data.binding);
      } else {
        alert(data.error || "Ошибка сохранения");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingBinding(false);
    }
  };

  const groupLabel = GROUP_OPTIONS.find(o => o.value === row.group_type)?.label || row.group_type;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="p-3 font-medium text-gray-800">{row.subjects.name}</td>
      <td className="p-3">
        {isEditingBinding ? (
          <select 
            className="border border-gray-300 rounded p-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d254c] w-full"
            value={editGroupType}
            onChange={(e) => setEditGroupType(e.target.value)}
          >
            {GROUP_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            {groupLabel}
          </span>
        )}
      </td>
      <td className="p-3 text-gray-700">
        {isEditingBinding ? (
          <select 
            className="border border-gray-300 rounded p-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d254c] w-full"
            value={editTeacherId}
            onChange={(e) => setEditTeacherId(e.target.value)}
          >
            <option value="">-- Выберите --</option>
            {teachers.map(t => (
              <option key={t.teacher_id} value={t.teacher_id}>{t.full_name}</option>
            ))}
          </select>
        ) : (
          row.teachers.full_name
        )}
      </td>
      <td className="p-3 text-center">
        {isEditingHours ? (
          <div className="flex items-center justify-center gap-1">
            <input 
              type="number" 
              className="w-16 border border-gray-300 rounded p-1 text-sm text-center"
              value={hoursValue}
              onChange={e => setHoursValue(e.target.value)}
              min="0"
              max="20"
            />
            <button 
              onClick={handleSaveHours}
              disabled={savingHours}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Сохранить часы"
            >
              {savingHours ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 group">
            <span className="font-medium text-gray-800">{row.hours_per_week || 0}</span>
            <button 
              onClick={() => setIsEditingHours(true)}
              className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-[#0d254c] transition"
              title="Изменить часы"
            >
              <Edit2 size={14} />
            </button>
          </div>
        )}
      </td>
      <td className="p-3 text-right">
        {isEditingBinding ? (
          <div className="flex justify-end gap-1">
            <button 
              onClick={handleSaveBinding} 
              disabled={savingBinding}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition disabled:opacity-50"
              title="Сохранить привязку"
            >
              {savingBinding ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            </button>
            <button 
              onClick={() => setIsEditingBinding(false)} 
              className="p-1.5 text-gray-400 hover:bg-gray-50 rounded transition"
            >
              x
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-1 group">
            <button 
              onClick={() => setIsEditingBinding(true)}
              className="p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-[#0d254c] hover:bg-blue-50 rounded transition"
              title="Редактировать привязку"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={handleDelete} 
              disabled={deleting}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition disabled:opacity-50"
              title="Отвязать"
            >
              {deleting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function AddBindingForm({ classId, subjects, teachers, onAdded, onCancel }) {
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [groupType, setGroupType] = useState("full_class");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!subjectId || !teacherId) {
      setError("Выберите предмет и преподавателя");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/class-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: classId,
          subject_id: subjectId,
          teacher_id: teacherId,
          group_type: groupType
        })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Ошибка сохранения");
      } else {
        onAdded(data.binding);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-b border-blue-100 bg-blue-50/40">
      <td className="p-3">
        <select 
          className="w-full border border-gray-300 rounded p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d254c]"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          <option value="">-- Выберите предмет --</option>
          {subjects.map(s => (
            <option key={s.subject_id} value={s.subject_id}>{s.name}</option>
          ))}
        </select>
      </td>
      <td className="p-3">
        <select 
          className="w-full border border-gray-300 rounded p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d254c]"
          value={groupType}
          onChange={(e) => setGroupType(e.target.value)}
        >
          {GROUP_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </td>
      <td className="p-3">
        <select 
          className="w-full border border-gray-300 rounded p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d254c]"
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
        >
          <option value="">-- Выберите преподавателя --</option>
          {teachers.map(t => (
            <option key={t.teacher_id} value={t.teacher_id}>{t.full_name}</option>
          ))}
        </select>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </td>
      <td className="p-3">
        {/* Placeholder for hours since this is just adding binding */}
        <span className="text-gray-400 text-xs text-center block">Изменить после добавления</span>
      </td>
      <td className="p-3 text-right">
        <div className="flex justify-end gap-1">
          <button 
            onClick={handleAdd} 
            disabled={saving}
            className="p-1.5 bg-[#0d254c] text-white rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
          </button>
          <button 
            onClick={onCancel} 
            className="p-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Отмена
          </button>
        </div>
      </td>
    </tr>
  );
}

function ClassBlock({ cls, subjects, teachers, isExpanded, onToggle, onUpdateClass }) {
  const [bindings, setBindings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Student count state
  const [isEditingCount, setIsEditingCount] = useState(false);
  const [studentCount, setStudentCount] = useState(cls.students_count || "");
  const [savingCount, setSavingCount] = useState(false);

  const handleSaveCount = async (e) => {
    e.stopPropagation();
    setSavingCount(true);
    try {
      const res = await fetch("/api/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: cls.class_id, students_count: studentCount })
      });
      const data = await res.json();
      if (data.success) {
        setIsEditingCount(false);
        if (onUpdateClass) onUpdateClass(data.class);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCount(false);
    }
  };

  const loadBindings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/class-subjects?classId=${cls.class_id}`);
      const data = await res.json();
      if (data.success) {
        setBindings(data.bindings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [cls.class_id]);

  useEffect(() => {
    if (isExpanded && bindings === null) {
      loadBindings();
    }
  }, [isExpanded, bindings, loadBindings]);

  const handleDelete = async (id) => {
    const res = await fetch("/api/class-subjects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data.success) {
      setBindings(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleAdded = (newBinding) => {
    // Attempt to inherit hours from an existing binding for the same subject in this class
    const existingSp = bindings.find(b => b.subject_id === newBinding.subject_id);
    if (existingSp) {
      newBinding.hours_per_week = existingSp.hours_per_week;
      newBinding.study_plan_id = existingSp.study_plan_id;
    }
    setBindings(prev => [...prev, newBinding].sort((a,b) => a.subjects.name.localeCompare(b.subjects.name)));
    setShowAddForm(false);
  };

  const handleUpdateHours = (subjectId, newHours) => {
    setBindings(prev => prev.map(b => 
      b.subject_id === subjectId ? { ...b, hours_per_week: newHours } : b
    ));
  };

  const handleUpdateBinding = (updatedBinding) => {
    setBindings(prev => prev.map(b => 
      b.id === updatedBinding.id ? { ...updatedBinding, hours_per_week: b.hours_per_week, study_plan_id: b.study_plan_id } : b
    ));
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white mb-3 shadow-sm">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left"
      >
        <div className="flex items-center gap-4">
          <span className="font-bold text-[#0d254c] text-lg w-16">{cls.class_name}</span>
          
          <div className="flex items-center gap-2 border-l border-gray-300 pl-4" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm text-gray-600">Кол-во учеников:</span>
            {isEditingCount ? (
              <div className="flex items-center gap-1">
                <input 
                  type="number" 
                  className="w-16 border border-gray-300 rounded px-1 py-0.5 text-sm"
                  value={studentCount}
                  onChange={(e) => setStudentCount(e.target.value)}
                  min="0"
                />
                <button 
                  onClick={handleSaveCount}
                  disabled={savingCount}
                  className="text-green-600 hover:bg-green-50 p-1 rounded"
                >
                  {savingCount ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 group/count">
                <span className="font-medium">{cls.students_count || "—"}</span>
                <button 
                  onClick={() => setIsEditingCount(true)}
                  className="text-gray-400 opacity-0 group-hover/count:opacity-100 hover:text-[#0d254c] p-1 transition"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}
          </div>

          {bindings !== null && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full ml-2">
              {bindings.length} привязок
            </span>
          )}
        </div>
        <div>
          {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 p-0">
          {loading ? (
            <div className="p-6 flex justify-center text-gray-400">
              <RefreshCw size={24} className="animate-spin" />
            </div>
          ) : (
            <div>
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="p-3 font-semibold">Предмет</th>
                    <th className="p-3 font-semibold">Группа</th>
                    <th className="p-3 font-semibold">Преподаватель</th>
                    <th className="p-3 font-semibold text-center w-24">Часы/нед.</th>
                    <th className="p-3 font-semibold text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {bindings && bindings.length === 0 && !showAddForm && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-400">
                        Нет привязок
                      </td>
                    </tr>
                  )}
                  {bindings && bindings.map(b => (
                    <BindingRow 
                      key={b.id} 
                      row={b} 
                      subjects={subjects}
                      teachers={teachers}
                      onDelete={handleDelete} 
                      onUpdateHours={handleUpdateHours}
                      onUpdateBinding={handleUpdateBinding}
                    />
                  ))}
                  {showAddForm && (
                    <AddBindingForm 
                      classId={cls.class_id}
                      subjects={subjects}
                      teachers={teachers}
                      onAdded={handleAdded}
                      onCancel={() => setShowAddForm(false)}
                    />
                  )}
                </tbody>
              </table>
              {!showAddForm && (
                <div className="p-3 border-t border-gray-100">
                  <button 
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#0d254c] font-medium border border-[#0d254c]/30 rounded-lg hover:bg-blue-50 transition"
                  >
                    <Plus size={16} /> Добавить привязку
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClassSubjectsPage() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedClass, setExpandedClass] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [clsRes, subRes, tRes] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/subjects"),
        fetch("/api/teachers")
      ]);
      
      const [clsData, subData, tData] = await Promise.all([
        clsRes.json(), subRes.json(), tRes.json()
      ]);

      const allCls = [...(clsData.small || []), ...(clsData.large || [])]
        .sort((a, b) => a.class_name.localeCompare(b.class_name));
      
      setClasses(allCls);
      
      // Subjects might come as array or { subjects: [...] } based on existing api
      setSubjects(Array.isArray(subData) ? subData : (subData.subjects || []).sort((a,b)=>a.name.localeCompare(b.name)));
      setTeachers(Array.isArray(tData) ? tData : (tData.teachers || []).sort((a,b)=>a.full_name.localeCompare(b.full_name)));
      
    } catch (e) {
      setError("Ошибка загрузки данных: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredClasses = classes.filter(c => 
    c.class_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <RefreshCw size={32} className="animate-spin mr-3" /> Загрузка...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center max-w-lg mx-auto mt-10">
        <AlertTriangle size={32} className="mx-auto mb-3 text-red-400" />
        <p className="font-medium">{error}</p>
        <button onClick={loadData} className="mt-4 bg-red-100 px-4 py-2 rounded-lg hover:bg-red-200 transition">Повторить</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0d254c] flex items-center gap-3">
            <Users size={32} /> Привязка преподавателей
          </h1>
          <p className="text-gray-500 mt-1">
            Назначение учителей на предметы для конкретных классов и подгрупп
          </p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
        >
          <RefreshCw size={16} /> Обновить
        </button>
      </div>

      <div className="mb-6">
        <input 
          type="text"
          placeholder="Поиск класса..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0d254c]"
        />
      </div>

      <div>
        {filteredClasses.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Нет классов, удовлетворяющих поиску
          </div>
        ) : (
          filteredClasses.map(cls => (
            <ClassBlock 
              key={cls.class_id} 
              cls={cls} 
              subjects={subjects}
              teachers={teachers}
              isExpanded={expandedClass === cls.class_id}
              onToggle={() => setExpandedClass(expandedClass === cls.class_id ? null : cls.class_id)}
              onUpdateClass={(updatedCls) => {
                setClasses(prev => prev.map(c => c.class_id === updatedCls.class_id ? updatedCls : c));
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
