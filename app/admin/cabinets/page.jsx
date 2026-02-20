"use client";

import { useState, useEffect } from "react";

export default function CabinetsPage() {
  const [cabinets, setCabinets] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Состояния для формы добавления
  const [roomNumber, setRoomNumber] = useState("");
  const [roomName, setRoomName] = useState("");
  const [message, setMessage] = useState("");

  // Состояния для редактирования
  const [editingCabinet, setEditingCabinet] = useState(null);
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editRoomName, setEditRoomName] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cabinets");
      const data = await res.json();
      if (data.success) {
        setCabinets(data.cabinets);
        setTeachers(data.teachers);
      }
    } catch (err) {
      console.error("Ошибка загрузки:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Добавление кабинета
  const handleAddCabinet = async (e) => {
    e.preventDefault();
    if (!roomNumber) return;

    try {
      const res = await fetch("/api/cabinets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_number: roomNumber, room_name: roomName }),
      });
      const data = await res.json();

      if (data.success) {
        setRoomNumber("");
        setRoomName("");
        setMessage("Кабинет успешно добавлен!");
        fetchData();
        setTimeout(() => setMessage(""), 3000);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Открытие модалки редактирования
  const openEditModal = (cab) => {
    setEditingCabinet(cab);
    setEditRoomNumber(cab.room_number);
    setEditRoomName(cab.room_name || "");
  };

  // Сохранение изменений кабинета
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editRoomNumber) return;

    try {
      const res = await fetch("/api/cabinets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: editingCabinet.room_id,
          new_room_number: editRoomNumber,
          new_room_name: editRoomName,
          old_room_number: editingCabinet.room_number, // Нужно, чтобы обновить привязку у учителей
        }),
      });
      const data = await res.json();

      if (data.success) {
        setEditingCabinet(null);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Закрепление учителя за кабинетом
  const handleAssignTeacher = async (room_number, teacher_id) => {
    try {
      const res = await fetch("/api/cabinets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_number, teacher_id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData(); // Перезагружаем данные, чтобы обновить таблицу
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Удаление кабинета
  const handleDelete = async (room_id, room_number) => {
    if (!confirm(`Удалить кабинет ${room_number}?`)) return;

    try {
      const res = await fetch(
        `/api/cabinets?room_id=${room_id}&room_number=${room_number}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="p-6 text-gray-500 font-medium">Загрузка данных...</div>
    );

  return (
    <div className="text-gray-800 relative">
      <h1 className="text-3xl font-bold mb-8 text-[#0d254c]">
        Управление кабинетами
      </h1>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Форма добавления */}
        <div className="w-full xl:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-semibold mb-5 border-b pb-2">
            Добавить кабинет
          </h2>

          <form onSubmit={handleAddCabinet} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Номер кабинета *
              </label>
              <input
                type="text"
                placeholder="Например: 301, Спортивный зал"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d254c]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Специфика (Название)
              </label>
              <input
                type="text"
                placeholder="Например: Кабинет информатики"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d254c]"
              />
            </div>

            <button
              type="submit"
              className="mt-2 bg-[#0d254c] text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition shadow-md"
            >
              Сохранить
            </button>
            {message && (
              <p className="text-green-600 font-medium text-sm mt-2">
                {message}
              </p>
            )}
          </form>
        </div>

        {/* Таблица кабинетов */}
        <div className="w-full xl:w-2/3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <h2 className="text-xl font-semibold mb-5 border-b pb-2">
            Список и закрепление
          </h2>

          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="p-3 border-b border-gray-200">Номер</th>
                <th className="p-3 border-b border-gray-200">Название</th>
                <th className="p-3 border-b border-gray-200">
                  Закрепленный учитель
                </th>
                <th className="p-3 border-b border-gray-200 text-center">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {cabinets.length > 0 ? (
                cabinets.map((cab) => {
                  // Ищем учителя, у которого в поле classroom прописан этот кабинет
                  const assignedTeacher = teachers.find(
                    (t) =>
                      t.classroom &&
                      t.classroom.toLowerCase() ===
                        cab.room_number.toLowerCase(),
                  );

                  return (
                    <tr
                      key={cab.room_id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="p-3 font-semibold text-[#0d254c]">
                        {cab.room_number}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {cab.room_name || "—"}
                      </td>
                      <td className="p-3">
                        <select
                          className="w-full border border-gray-300 rounded p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                          value={
                            assignedTeacher ? assignedTeacher.teacher_id : ""
                          }
                          onChange={(e) =>
                            handleAssignTeacher(cab.room_number, e.target.value)
                          }
                        >
                          <option value="">-- Общий (Свободный) --</option>
                          {teachers.map((t) => (
                            <option key={t.teacher_id} value={t.teacher_id}>
                              {t.full_name} ({t.subject})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-center flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(cab)}
                          className="text-blue-500 hover:text-blue-700 font-medium text-sm px-2 py-1 rounded hover:bg-blue-50 transition"
                        >
                          Редакт.
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(cab.room_id, cab.room_number)
                          }
                          className="text-red-500 hover:text-red-700 font-medium text-sm px-2 py-1 rounded hover:bg-red-50 transition"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-gray-500">
                    Кабинеты не найдены. Добавьте первый кабинет слева.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ */}
      {editingCabinet && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">
              Редактировать кабинет
            </h2>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Номер кабинета *
                </label>
                <input
                  type="text"
                  value={editRoomNumber}
                  onChange={(e) => setEditRoomNumber(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d254c]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={editRoomName}
                  onChange={(e) => setEditRoomName(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d254c]"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCabinet(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2.5 rounded-lg transition"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
