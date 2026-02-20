"use client";
import { useState, useEffect } from "react";

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Состояния для формы ДОБАВЛЕНИЯ
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [classroom, setClassroom] = useState("");

  // Состояния для РЕДАКТИРОВАНИЯ
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editClassroom, setEditClassroom] = useState("");

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

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subject, classroom }),
    });
    if (res.ok) {
      setName("");
      setSubject("");
      setClassroom("");
      fetchTeachers();
    }
  };

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

  const handleDelete = async (id) => {
    if (!confirm("Удалить учителя?")) return;
    const res = await fetch("/api/teachers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchTeachers();
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.subject && t.subject.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-[#0d254c] mb-8">
        Управление учителями
      </h1>

      {/* ФОРМА ДОБАВЛЕНИЯ */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          Добавить преподавателя
        </h2>
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 md:grid-cols-4 gap-3"
        >
          <input
            type="text"
            placeholder="ФИО учителя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 text-black outline-none focus:ring-2 focus:ring-[#0d254c]"
            required
          />
          <input
            type="text"
            placeholder="Предмет"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 text-black outline-none focus:ring-2 focus:ring-[#0d254c]"
          />
          <input
            type="text"
            placeholder="Кабинет"
            value={classroom}
            onChange={(e) => setClassroom(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 text-black outline-none focus:ring-2 focus:ring-[#0d254c]"
          />
          <button
            type="submit"
            className="bg-[#0d254c] text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-900 transition shadow-md"
          >
            Добавить
          </button>
        </form>
      </div>

      {/* ПОИСК */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <input
          type="text"
          placeholder="Поиск по ФИО или предмету..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 text-black outline-none focus:ring-2 focus:ring-[#0d254c]"
        />
      </div>

      {/* ТАБЛИЦА */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr className="text-sm text-gray-500 uppercase">
              <th className="p-4">ID</th>
              <th className="p-4">ФИО</th>
              <th className="p-4">Предмет</th>
              <th className="p-4">Кабинет</th>
              <th className="p-4 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.map((t) => (
              <tr
                key={t.teacher_id}
                className="hover:bg-gray-50 border-b last:border-0 transition"
              >
                <td className="p-4 text-gray-400 text-sm">#{t.teacher_id}</td>
                {editId === t.teacher_id ? (
                  <>
                    <td className="p-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border p-2 rounded text-black"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="w-full border p-2 rounded text-black"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={editClassroom}
                        onChange={(e) => setEditClassroom(e.target.value)}
                        className="w-full border p-2 rounded text-black"
                      />
                    </td>
                    <td className="p-4 text-right flex gap-2 justify-end">
                      <button
                        onClick={handleUpdate}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Сохранить
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="bg-gray-400 text-white px-3 py-1 rounded text-sm"
                      >
                        Отмена
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4 font-medium text-gray-800">
                      {t.full_name}
                    </td>
                    <td className="p-4 text-gray-600">{t.subject || "—"}</td>
                    <td className="p-4 text-gray-600">{t.classroom || "—"}</td>
                    <td className="p-4 text-right flex gap-3 justify-end">
                      <button
                        onClick={() => startEdit(t)}
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(t.teacher_id)}
                        className="text-red-500 hover:underline text-sm font-medium"
                      >
                        Удалить
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
