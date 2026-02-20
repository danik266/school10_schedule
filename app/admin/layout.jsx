import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  Shield,
  Settings,
  ArrowLeft,
  DoorOpen,
} from "lucide-react";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Сайдбар */}
      <aside className="w-64 bg-[#0d254c] text-white flex flex-col shadow-2xl">
        {/* Лого / Заголовок */}
        <div className="p-6 text-2xl font-bold border-b border-blue-800/50">
          Админ-панель
        </div>

        {/* Навигация */}
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-800 transition"
          >
            <Users size={18} />
            Пользователи
          </Link>

          <Link
            href="/admin/teachers"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-800 transition"
          >
            <GraduationCap size={18} />
            Учителя
          </Link>

          <Link
            href="/admin/cabinets"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-800 transition"
          >
            <DoorOpen size={18} />
            Кабинеты
          </Link>

          {/* Разделитель */}
          <div className="mt-8 mb-2 px-3 text-xs uppercase text-blue-300/50 font-bold">
            В разработке
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg text-gray-400 opacity-50 cursor-not-allowed">
            <BookOpen size={18} />
            Нагрузка (Часы)
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg text-gray-400 opacity-50 cursor-not-allowed">
            <Shield size={18} />
            Дежурства
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg text-gray-400 opacity-50 cursor-not-allowed">
            <Settings size={18} />
            Перепады (Окна)
          </div>
        </nav>

        {/* Низ сайдбара */}
        <div className="p-4 border-t border-blue-800/50">
          <Link
            href="/schedule-view"
            className="text-sm text-blue-300 hover:text-white transition flex items-center gap-2"
          >
            <ArrowLeft size={16} />В расписание
          </Link>
        </div>
      </aside>

      {/* Основной контент */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
