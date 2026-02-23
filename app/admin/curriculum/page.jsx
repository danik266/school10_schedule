"use client";
import { useState, useEffect, useCallback } from "react";
import {
  BarChart2, BookOpen, TrendingUp, AlertTriangle, CheckCircle,
  RefreshCw, ChevronDown, ChevronUp, Pencil, Trash2, Plus, Check, X,
} from "lucide-react";

function StatusBadge({ ok, diff }) {
  if (ok) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle size={12} /> Соответствует
    </span>
  );
  if (diff > 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      <TrendingUp size={12} /> Превышение
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <AlertTriangle size={12} /> Нехватка
    </span>
  );
}

function PlanRow({ row, actual, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [hw, setHw] = useState(String(row.hours_per_week));
  const [hy, setHy] = useState(String(row.hours_per_year));
  const [saving, setSaving] = useState(false);

  const planned = Number(row.hours_per_week);
  const diff = (actual ?? 0) - Math.ceil(planned);
  const ok = diff === 0;

  const handleSave = async () => {
    setSaving(true);
    await onSave(row.study_plan_id, Number(hw), Number(hy));
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setHw(String(row.hours_per_week));
    setHy(String(row.hours_per_year));
    setEditing(false);
  };

  return (
    <tr className={`border-b border-gray-100 ${!ok ? "bg-red-50/30" : ""}`}>
      <td className="p-3 font-medium">
        {row.subjects.name}
        {planned % 1 !== 0 && <span className="ml-2 text-xs text-gray-400">(чередование)</span>}
      </td>
      <td className="p-3">
        {editing ? (
          <input type="number" step="0.5" min="0.5"
            className="border border-gray-300 rounded p-1 w-20 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d254c]"
            value={hw} onChange={(e) => setHw(e.target.value)} />
        ) : <span>{row.hours_per_week}</span>}
      </td>
      <td className="p-3">
        {editing ? (
          <input type="number" min="1"
            className="border border-gray-300 rounded p-1 w-24 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d254c]"
            value={hy} onChange={(e) => setHy(e.target.value)} />
        ) : <span>{row.hours_per_year}</span>}
      </td>
      <td className="p-3 text-gray-500">{actual ?? "—"}</td>
      <td className={`p-3 font-semibold ${ok ? "text-green-600" : diff > 0 ? "text-blue-500" : "text-red-500"}`}>
        {actual !== undefined ? (diff > 0 ? `+${diff}` : diff) : "—"}
      </td>
      <td className="p-3">
        {actual !== undefined ? <StatusBadge ok={ok} diff={diff} /> : <span className="text-gray-400 text-xs">нет данных</span>}
      </td>
      <td className="p-3">
        {editing ? (
          <div className="flex gap-1">
            <button onClick={handleSave} disabled={saving}
              className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition disabled:opacity-50">
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
            </button>
            <button onClick={handleCancel} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="flex gap-1">
            <button onClick={() => setEditing(true)}
              className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition" title="Редактировать">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(row.study_plan_id, row.subjects.name)}
              className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition" title="Удалить">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function AddRow({ classId, onAdded, onCancel }) {
  const [subjectName, setSubjectName] = useState("");
  const [hw, setHw] = useState("1");
  const [hy, setHy] = useState("34");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleAdd = async () => {
    if (!subjectName.trim()) { setErr("Введите название предмета"); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: classId, subject_name: subjectName.trim(), hours_per_week: Number(hw), hours_per_year: Number(hy) }),
      });
      const data = await res.json();
      if (!data.success) setErr(data.error || "Ошибка");
      else onAdded(data.row);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <tr className="border-b border-blue-100 bg-blue-50/40">
      <td className="p-3">
        <input autoFocus
          className="border border-gray-300 rounded p-1.5 w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#0d254c]"
          placeholder="Название предмета"
          value={subjectName} onChange={(e) => setSubjectName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") onCancel(); }} />
        {err && <p className="text-red-500 text-xs mt-1">{err}</p>}
      </td>
      <td className="p-3">
        <input type="number" step="0.5" min="0.5"
          className="border border-gray-300 rounded p-1.5 w-20 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d254c]"
          value={hw} onChange={(e) => setHw(e.target.value)} />
      </td>
      <td className="p-3">
        <input type="number" min="1"
          className="border border-gray-300 rounded p-1.5 w-24 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d254c]"
          value={hy} onChange={(e) => setHy(e.target.value)} />
      </td>
      <td className="p-3 text-gray-400 text-sm" colSpan={3}>—</td>
      <td className="p-3">
        <div className="flex gap-1">
          <button onClick={handleAdd} disabled={saving}
            className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition disabled:opacity-50">
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
          </button>
          <button onClick={onCancel} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">
            <X size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// classId -> stats передаётся снаружи; внутри только детали плана (ленивая загрузка)
function ClassBlock({ cls, preloadedStats, onStatsUpdate, isExpanded, onToggle }) {
  const [planRows, setPlanRows] = useState(null);
  const [localStats, setLocalStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);

  // stats = локальные (после редактирования) или preloaded
  const stats = localStats ?? preloadedStats;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [planData, statsData] = await Promise.all([
        fetch(`/api/study-plan?classId=${cls.class_id}`).then((r) => r.json()),
        fetch(`/api/class-stats?classId=${cls.class_id}`).then((r) => r.json()),
      ]);
      setPlanRows(planData.rows || []);
      setLocalStats(statsData);
      onStatsUpdate(cls.class_id, statsData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [cls.class_id]);

  useEffect(() => {
    if (isExpanded && planRows === null) load();
  }, [isExpanded, planRows, load]);

  const refreshStats = async () => {
    const statsData = await fetch(`/api/class-stats?classId=${cls.class_id}`).then((r) => r.json());
    setLocalStats(statsData);
    onStatsUpdate(cls.class_id, statsData);
  };

  const handleSave = async (study_plan_id, hours_per_week, hours_per_year) => {
    const res = await fetch("/api/study-plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ study_plan_id, hours_per_week, hours_per_year }),
    });
    const data = await res.json();
    if (data.success) {
      setPlanRows((prev) => prev.map((r) =>
        r.study_plan_id === study_plan_id ? { ...r, hours_per_week, hours_per_year } : r
      ));
      refreshStats();
    }
  };

  const handleDelete = async (study_plan_id, subjectName) => {
    if (!confirm(`Удалить «${subjectName}» из учебного плана ${cls.class_name}?`)) return;
    const res = await fetch("/api/study-plan", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ study_plan_id }),
    });
    const data = await res.json();
    if (data.success) {
      setPlanRows((prev) => prev.filter((r) => r.study_plan_id !== study_plan_id));
      refreshStats();
    }
  };

  const handleAdded = (newRow) => {
    setPlanRows((prev) => [...prev, newRow]);
    setShowAddRow(false);
    refreshStats();
  };

  const actualMap = {};
  if (stats?.subjects) for (const s of stats.subjects) actualMap[s.subject_id] = s.actual;

  const issues = stats?.issuesCount ?? null;
  const totalPlanned = stats?.totalPlanned;
  const totalActual = stats?.totalActual;

  // Считаем кол-во предметов из planRows если загружено, иначе из статистики
  const subjectCount = planRows !== null ? planRows.length : stats?.subjects?.length;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Заголовок */}
      <button onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition text-left">
        <div className="flex items-center gap-4">
          <span className="font-bold text-[#0d254c] text-lg w-16">{cls.class_name}</span>
          <div className="flex items-center gap-3 text-sm">
            {subjectCount !== undefined && (
              <span className="text-gray-500">{subjectCount} предметов</span>
            )}
            {issues === null ? (
              // данных ещё нет — пустой спиннер чтобы не прыгал layout
              <span className="w-4 h-4 inline-block" />
            ) : issues > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <AlertTriangle size={11} /> {issues} несоответствий
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle size={11} /> Всё в норме
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {totalPlanned !== undefined && (
            <>
              <span>план: <b className="text-gray-700">{totalPlanned} ч/нед</b></span>
              <span>расписание: <b className={totalActual !== totalPlanned ? "text-orange-500" : "text-gray-700"}>{totalActual} ч/нед</b></span>
            </>
          )}
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Тело — ленивая загрузка */}
      {isExpanded && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <RefreshCw size={20} className="animate-spin mr-2" /> Загрузка...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left bg-white">
                <thead className="bg-gray-50 border-b border-t border-gray-200">
                  <tr>
                    <th className="p-3 font-semibold text-gray-600 text-sm">Предмет</th>
                    <th className="p-3 font-semibold text-gray-600 text-sm">План (ч/нед)</th>
                    <th className="p-3 font-semibold text-gray-600 text-sm">План (ч/год)</th>
                    <th className="p-3 font-semibold text-gray-600 text-sm">Расписание (ч/нед)</th>
                    <th className="p-3 font-semibold text-gray-600 text-sm">Разница</th>
                    <th className="p-3 font-semibold text-gray-600 text-sm">Статус</th>
                    <th className="p-3 font-semibold text-gray-600 text-sm">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {planRows && planRows.length === 0 && !showAddRow && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-400 text-sm">
                        Учебный план пуст — добавьте предметы
                      </td>
                    </tr>
                  )}
                  {planRows && planRows.map((row) => (
                    <PlanRow key={row.study_plan_id} row={row}
                      actual={actualMap[row.subject_id]}
                      onSave={handleSave} onDelete={handleDelete} />
                  ))}
                  {showAddRow && (
                    <AddRow classId={cls.class_id} onAdded={handleAdded} onCancel={() => setShowAddRow(false)} />
                  )}
                </tbody>
                {planRows && planRows.length > 0 && (
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td className="p-3 font-bold text-gray-700">Итого</td>
                      <td className="p-3 font-bold">{totalPlanned} ч/нед</td>
                      <td className="p-3 text-gray-400">—</td>
                      <td className={`p-3 font-bold ${totalActual !== totalPlanned ? "text-orange-500" : "text-green-600"}`}>
                        {totalActual} ч/нед
                      </td>
                      <td className={`p-3 font-bold ${(totalActual - totalPlanned) === 0 ? "text-green-600" : "text-orange-500"}`}>
                        {(totalActual - totalPlanned) > 0 ? "+" : ""}{totalActual - totalPlanned}
                      </td>
                      <td className="p-3" colSpan={2}>
                        {issues === 0
                          ? <span className="text-green-600 text-sm font-medium">✓ Соответствует плану</span>
                          : <span className="text-red-500 text-sm font-medium">{issues} несоответствий</span>}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
              {!showAddRow && (
                <div className="p-3 border-t border-gray-100">
                  <button onClick={() => setShowAddRow(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#0d254c] border border-[#0d254c]/30 rounded-lg hover:bg-blue-50 transition font-medium">
                    <Plus size={15} /> Добавить предмет
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

// ===== ГЛАВНАЯ СТРАНИЦА =====
export default function CurriculumPage() {
  const [classes, setClasses] = useState([]);
  const [statsMap, setStatsMap] = useState({}); // classId -> stats (загружается сразу для всех)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("plan");
  const [expandedClass, setExpandedClass] = useState(null);

  // Загрузить классы + статистику всех сразу
  const loadAll = async () => {
    setLoading(true); setError(null);
    try {
      const classesData = await fetch("/api/classes").then((r) => r.json());
      const all = [...(classesData.small || []), ...(classesData.large || [])]
        .sort((a, b) => a.class_name.localeCompare(b.class_name));
      setClasses(all);

      // Грузим статистику всех классов параллельно
      const statsArr = await Promise.all(
        all.map((cls) =>
          fetch(`/api/class-stats?classId=${cls.class_id}`)
            .then((r) => r.json())
            .catch(() => ({ success: false }))
        )
      );
      const map = {};
      all.forEach((cls, i) => { map[cls.class_id] = statsArr[i]; });
      setStatsMap(map);
    } catch (e) {
      setError("Ошибка загрузки: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // Callback для обновления статистики одного класса (после редактирования)
  const handleStatsUpdate = (classId, newStats) => {
    setStatsMap((prev) => ({ ...prev, [classId]: newStats }));
  };

  // Данные для вкладки статистики
  const allSubjects = classes.flatMap((cls) =>
    (statsMap[cls.class_id]?.subjects || []).map((s) => ({ ...s, className: cls.class_name }))
  );
  const totalIssues = allSubjects.filter((s) => !s.ok).length;
  const totalOk = allSubjects.filter((s) => s.ok).length;
  const totalShortage = allSubjects.filter((s) => !s.ok && s.diff < 0).length;
  const totalExcess = allSubjects.filter((s) => !s.ok && s.diff > 0).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <RefreshCw size={32} className="animate-spin" /><p>Загрузка...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md">
        <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={loadAll} className="mt-4 px-4 py-2 bg-[#0d254c] text-white rounded-lg text-sm hover:bg-blue-800 transition">Повторить</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0d254c]">Учебный план</h1>
          <p className="text-gray-500 text-sm mt-1">Просмотр, редактирование и сравнение с расписанием</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadAll}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
            <RefreshCw size={14} /> Обновить
          </button>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab("plan")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === "plan" ? "bg-[#0d254c] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              <BookOpen size={16} /> По классам
            </button>
            <button onClick={() => setActiveTab("stats")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === "stats" ? "bg-[#0d254c] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              <BarChart2 size={16} /> Статистика
            </button>
          </div>
        </div>
      </div>

      {/* ===== ВКЛАДКА: ПО КЛАССАМ ===== */}
      {activeTab === "plan" && (
        <div className="flex flex-col gap-3">
          {classes.length === 0 && <div className="text-center text-gray-400 py-16">Классы не найдены</div>}
          {classes.map((cls) => (
            <ClassBlock
              key={cls.class_id}
              cls={cls}
              preloadedStats={statsMap[cls.class_id] ?? null}
              onStatsUpdate={handleStatsUpdate}
              isExpanded={expandedClass === cls.class_id}
              onToggle={() => setExpandedClass(expandedClass === cls.class_id ? null : cls.class_id)}
            />
          ))}
        </div>
      )}

      {/* ===== ВКЛАДКА: СТАТИСТИКА ===== */}
      {activeTab === "stats" && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#0d254c] text-white rounded-xl p-5">
              <p className="text-blue-200 text-sm mb-1">Всего предметов</p>
              <p className="text-3xl font-bold">{allSubjects.length}</p>
              <p className="text-blue-300 text-xs mt-1">по {classes.length} классам</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Соответствуют плану</p>
              <p className="text-3xl font-bold text-green-600">{totalOk}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Нехватка часов</p>
              <p className="text-3xl font-bold text-red-500">{totalShortage}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Превышение часов</p>
              <p className="text-3xl font-bold text-blue-500">{totalExcess}</p>
            </div>
          </div>

          {totalIssues > 0 && (
            <div className="mb-8">
              <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-400" />
                Несоответствия учебному плану ({totalIssues})
              </h2>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left bg-white">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-4 font-semibold text-gray-600 text-sm">Класс</th>
                      <th className="p-4 font-semibold text-gray-600 text-sm">Предмет</th>
                      <th className="p-4 font-semibold text-gray-600 text-sm">По плану</th>
                      <th className="p-4 font-semibold text-gray-600 text-sm">В расписании</th>
                      <th className="p-4 font-semibold text-gray-600 text-sm">Разница</th>
                      <th className="p-4 font-semibold text-gray-600 text-sm">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSubjects.filter((s) => !s.ok).sort((a, b) => a.diff - b.diff).map((s, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4 font-semibold text-[#0d254c]">{s.className}</td>
                        <td className="p-4 font-medium">
                          {s.name}
                          {s.biweekly && <span className="ml-2 text-xs text-gray-400">(чередование)</span>}
                        </td>
                        <td className="p-4">{s.planned}</td>
                        <td className="p-4">{s.actual}</td>
                        <td className={`p-4 font-semibold ${s.diff > 0 ? "text-blue-500" : "text-red-500"}`}>
                          {s.diff > 0 ? `+${s.diff}` : s.diff}
                        </td>
                        <td className="p-4"><StatusBadge ok={s.ok} diff={s.diff} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <h2 className="font-semibold text-gray-700 mb-3">Сводка по классам</h2>
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left bg-white">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Класс</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Предметов</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">По плану (ч/нед)</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">В расписании (ч/нед)</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Несоответствий</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Итог</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => {
                    const s = statsMap[cls.class_id];
                    return (
                      <tr key={cls.class_id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => { setActiveTab("plan"); setExpandedClass(cls.class_id); }}>
                        <td className="p-4 font-bold text-[#0d254c]">{cls.class_name}</td>
                        <td className="p-4 text-gray-500">{s?.subjects?.length ?? "—"}</td>
                        <td className="p-4">{s?.totalPlanned ?? "—"}</td>
                        <td className={`p-4 font-medium ${s && s.totalActual !== s.totalPlanned ? "text-orange-500" : ""}`}>
                          {s?.totalActual ?? "—"}
                        </td>
                        <td className="p-4">
                          {s?.issuesCount > 0
                            ? <span className="font-bold text-red-500">{s.issuesCount}</span>
                            : <span className="text-green-500">0</span>}
                        </td>
                        <td className="p-4">
                          {!s?.success ? <span className="text-gray-400 text-sm">Нет плана</span>
                            : s.issuesCount === 0
                              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle size={11} /> ОК</span>
                              : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><AlertTriangle size={11} /> Ошибки</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">Нажмите на строку, чтобы перейти к редактированию плана класса</p>
          </div>
        </div>
      )}
    </div>
  );
}