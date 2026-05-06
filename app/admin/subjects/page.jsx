"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Edit2, Info, CheckCircle, Save, X, AlertTriangle } from "lucide-react";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subjects");
      const data = await res.json();
      if (data.success) setSubjects(data.subjects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id) => {
    if (!confirm("Удалить предмет? Это может повлиять на учебные планы.")) return;
    try {
      const res = await fetch("/api/subjects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        showMsg("Предмет удален");
        fetchSubjects();
      } else {
        showMsg(data.message || data.error, "error");
      }
    } catch {
      showMsg("Ошибка сети", "error");
    }
  };

  const startEdit = (sub) => {
    setEditingId(sub.subject_id);
    setEditName(sub.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    try {
      const res = await fetch("/api/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name: editName })
      });
      const data = await res.json();
      if (data.success) {
        showMsg("Предмет обновлен");
        setEditingId(null);
        fetchSubjects();
      } else {
        showMsg(data.message || data.error, "error");
      }
    } catch {
      showMsg("Ошибка сети", "error");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#0d254c] tracking-tight flex items-center gap-3 mb-2">
          <BookOpen className="text-blue-500" size={32} /> Справочник предметов
        </h1>
        <p className="text-gray-500">Управление единым списком предметов школы</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 font-medium transition-all ${
          message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
        }`}>
          {message.type === "error" ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Объяснение логики базы данных */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0d254c] mb-4 flex items-center gap-2">
          <Info className="text-blue-500" size={20} /> Как работает логика предметов и учителей?
        </h2>
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>
            База данных школы может показаться сложной, но она строго разделена на независимые части (таблицы), чтобы расписание генерировалось умно:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Справочник предметов (эта страница):</strong> Это просто "Словарь" всех предметов, которые вообще существуют в школе. Если предмета нет здесь, его нельзя добавить ни в расписание, ни учителю.
            </li>
            <li>
              <strong>Учебный план (вкладка ниже):</strong> Это связка <i>"Класс" + "Предмет из словаря" + "Кол-во часов в неделю"</i>. Здесь вы указываете, что, например, у 5А есть 2 часа "Математики". Но здесь <b>не указывается</b>, кто именно ведет урок!
            </li>
            <li>
              <strong>Профиль учителя (Вкладка "Учителя"):</strong> У каждого учителя текстом прописан предмет (например, "Математика"). Алгоритм при генерации расписания читает предмет учителя и сравнивает его с названием предмета в Учебном плане. Если они совпадают (или похожи), алгоритм понимает: этот учитель МОЖЕТ вести этот урок.
            </li>
            <li>
              <strong>Таблицы привязок (Нагрузка/Часы):</strong> Если вы хотите жестко сказать генератору: <i>"Только учитель Иванов ведет Математику в 5А"</i>, вы создаете жесткую привязку. Если привязки нет — генератор просто случайным образом выберет любого свободного учителя с предметом "Математика". 
            </li>
          </ul>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-yellow-800 mt-4">
            <strong className="flex items-center gap-2 mb-1"><AlertTriangle size={16}/> Почему возникают "дыры" в расписании?</strong>
            Если в Учебном плане указан предмет (например, "Жаратылыстану"), но во вкладке "Учителя" нет ни одного учителя, у которого в профиле указано слово "Жаратылыстану", то генератор не сможет найти преподавателя на этот урок. Урок просто выпадет (образуется дыра).
            <br/><br/>
            <b>Решение:</b> Убедитесь, что название предмета в профиле учителя совпадает с названием предмета здесь (в справочнике).
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-[#0d254c]">Список предметов</h2>

        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Загрузка...</div>
        ) : subjects.length === 0 ? (
          <div className="p-12 text-center text-gray-400">В базе пока нет предметов. Добавьте первый предмет выше.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold w-20 text-center">ID</th>
                  <th className="p-4 font-semibold">Название предмета</th>
                  <th className="p-4 font-semibold w-32 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjects.map((sub) => (
                  <tr key={sub.subject_id} className="hover:bg-blue-50/30 transition group">
                    <td className="p-4 text-center text-sm text-gray-400">{sub.subject_id}</td>
                    <td className="p-4 text-sm font-medium text-[#0d254c]">
                      {editingId === sub.subject_id ? (
                        <input
                          type="text"
                          className="w-full border border-blue-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                      ) : (
                        sub.name
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {editingId === sub.subject_id ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={saveEdit} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition" title="Сохранить">
                            <Save size={16} />
                          </button>
                          <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition" title="Отмена">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => startEdit(sub)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Редактировать">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(sub.subject_id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Удалить">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
