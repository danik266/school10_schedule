"use client";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");

  // Добавляем состояние для списка пользователей
  const [users, setUsers] = useState([]);

  // Функция для загрузки пользователей с сервера
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", {
        method: "GET",
      });
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Ошибка при загрузке пользователей:", error);
    }
  };

  // Загружаем пользователей при первом рендере страницы
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage("Создание...");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password, role }),
    });

    const data = await res.json();
    setMessage(data.message);

    if (data.success) {
      setLogin("");
      setPassword("");
      // Обновляем список пользователей после успешного добавления
      fetchUsers();
    }
  };

  return (
    <div className="min-h-screen p-10 bg-white text-gray-800">
      <h1 className="text-3xl font-bold mb-8 text-[#0d254c]">
        Панель администратора
      </h1>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Левая колонка: Форма создания */}
        <div className="bg-white w-full max-w-md">
          <h2 className="text-xl font-semibold mb-6">Добавить пользователя</h2>

          <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Логин (например, teacher10)"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d254c]"
              required
            />

            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d254c]"
              required
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d254c]"
            >
              <option value="user">Генератор расписания</option>
              <option value="admin">Администратор</option>
            </select>

            <button
              type="submit"
              className="bg-[#0d254c] text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition"
            >
              Создать
            </button>
          </form>

          {message && (
            <p className="mt-5 font-medium text-blue-600">{message}</p>
          )}
        </div>

        {/* Правая колонка: Список пользователей */}
        <div className="w-full lg:max-w-2xl">
          <h2 className="text-xl font-semibold mb-6">Список пользователей</h2>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left bg-white">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="p-4 font-semibold text-gray-700">Логин</th>
                  <th className="p-4 font-semibold text-gray-700">Пароль</th>
                  <th className="p-4 font-semibold text-gray-700">Роль</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((u, index) => (
                    <tr
                      key={u.id || index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="p-4">{u.login}</td>
                      <td className="p-4 text-gray-500 font-mono text-sm">
                        {u.password}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {u.role === "admin" ? "Администратор" : "Генератор"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-4 text-center text-gray-500">
                      Пользователи не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
