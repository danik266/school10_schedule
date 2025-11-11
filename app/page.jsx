"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "./context/LanguageContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function Home() {
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [schedule, setSchedule] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { lang } = useLanguage();

  const t = {
    ru: {
      title: "Создание расписания\nДля Гимназии №10 г.Павлодар",
      login: "Логин",
      pass: "Пароль",
      loginPh: "Введите ваш логин...",
      passPh: "Введите ваш пароль...",
      info: "Создавайте, редактируйте и просматривайте школьное расписание онлайн.",
      btn: "Войти",
      err: "Неверный логин или пароль",
      actual: "Актуальное расписание",
    },
    kz: {
      title: "Павлодар қ. №10 гимназиясының\nСабақ кестесін құру",
      login: "Логин",
      pass: "Құпия сөз",
      loginPh: "Логин енгізіңіз...",
      passPh: "Құпия сөзді енгізіңіз...",
      info: "Мектеп кестесін онлайн жасаңыз, түзетіңіз және қараңыз.",
      btn: "Кіру",
      err: "Қате логин немесе құпия сөз",
      actual: "Актуалды сабақ кестесі",
    },
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: pass }),
    });
    if (res.ok) router.push("/schedule-view");
    else setError(t[lang].err);
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const dayNamesRu = {
    Monday: "Понедельник",
    Tuesday: "Вторник",
    Wednesday: "Среда",
    Thursday: "Четверг",
    Friday: "Пятница",
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch("/api/get-schedule");
        const data = await res.json();
        if (data.success) {
          setSchedule(data.schedule);
          setTeachers(data.teachers);
        }
      } catch (err) {
        console.error("Ошибка загрузки расписания:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  // ---------- Список классов ----------
  const classesList = Object.values(schedule)
    .filter((cls) => {
      const match = cls.class_name.match(/^(\d+)/);
      if (!match) return false;
      const grade = parseInt(match[1], 10);
      return grade >= 5 && grade <= 11;
    })
    .sort((a, b) => parseInt(a.class_name) - parseInt(b.class_name));

  // ---------- Пользовательские стрелки ----------
  const Arrow = ({ className, style, onClick, direction }) => (
    <div
      className={`absolute top-1/2 transform -translate-y-1/2 z-10 cursor-pointer p-2 bg-white rounded-full shadow hover:bg-gray-100 ${
        direction === "next" ? "right-2" : "left-2"
      }`}
      style={{ ...style }}
      onClick={onClick}
    >
      {direction === "next" ? "→" : "←"}
    </div>
  );

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    nextArrow: <Arrow direction="next" />,
    prevArrow: <Arrow direction="prev" />,
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header />

      <main className="flex flex-1 justify-around items-center flex-col md:flex-row gap-10 p-6">
        <img src="/photo.svg" alt="Logo" className="w-80 md:w-120 object-contain" />

        <div className="bg-white rounded-xl border border-gray-300 p-8 w-full max-w-md text-center">
          <h2 className="text-xl font-semibold mb-4 whitespace-pre-line">{t[lang].title}</h2>

          <form className="flex flex-col gap-10" onSubmit={handleLogin}>
            <div className="text-left">
              <label className="block mb-1">{t[lang].login}</label>
              <input
                type="text"
                placeholder={t[lang].loginPh}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border rounded-lg p-3 outline-none"
              />
            </div>

            <div className="text-left relative">
              <label className="block mb-1">{t[lang].pass}</label>
              <input
                type={show ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder={t[lang].passPh}
                className="w-full border rounded-lg p-3 pr-10 outline-none"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
              >
                <img
                  src={show ? "/lasteye.svg" : "/eye-hide-svgrepo-com.svg"}
                  alt="eye"
                  className="w-6"
                />
              </button>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <p className="text-sm text-gray-500">{t[lang].info}</p>

            <button
              type="submit"
              className="bg-[#0d254c] text-white rounded-full py-3 mt-2 hover:bg-blue-900 transition"
            >
              {t[lang].btn}
            </button>
          </form>
        </div>
      </main>

      {/* ---------- Слайдер с расписанием ---------- */}
      <section className="bg-white border-t border-gray-300 py-8 px-4 relative">
        <h2 className="text-2xl font-bold text-center mb-6">{t[lang].actual}</h2>

        {loading ? (
          <p className="text-center text-gray-500">Загрузка расписания...</p>
        ) : classesList.length === 0 ? (
          <p className="text-center text-gray-500">Расписание пока не создано.</p>
        ) : (
          <Slider {...sliderSettings}>
            {classesList.map((cls) => {
              const maxLessons = Math.max(...Object.values(cls.days).map((day) => day.length));
              return (
                <div key={cls.class_name} className="p-4">
                  <h3 className="text-lg font-semibold mb-4 text-center">{cls.class_name}</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 p-2">#</th>
                          {days.map((day) => (
                            <th key={day} className="border border-gray-300 p-2">
                              {dayNamesRu[day]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: maxLessons }).map((_, i) => (
                          <tr key={i}>
                            <td className="border border-gray-300 p-2 text-center">{i + 1}</td>
                            {days.map((day) => {
                              const lessons =
                                cls.days[day]?.filter((l) => l.lesson_num === i + 1) || [];
                              if (!lessons.length)
                                return (
                                  <td
                                    key={day}
                                    className="border border-gray-300 p-2 text-center text-gray-400"
                                  >
                                    —
                                  </td>
                                );
                              return (
                                <td key={day} className="border border-gray-300 p-2">
  {lessons.length > 0 ? (
lessons.map((lesson, idx) => {
  const teacherObj = teachers.find(
    (t) => t.teacher_id.toString() === lesson.teacher_id?.toString()
  );

  const teacherName = teacherObj ? teacherObj.full_name : "Не назначен";
  const room = teacherObj?.classroom ? teacherObj.classroom : "Кабинет не назначен";

  return (
    <div key={idx} className="mb-2 p-2 rounded bg-white border border-gray-200">
      <div className="font-semibold">
        {lesson.subject}
        {lessons.length > 1 ? ` (${idx + 1} подгруппа)` : ""}
      </div>
      <div className="text-xs text-gray-600 mt-1">{teacherName}</div>
      <div className="text-xs text-gray-500 mt-1 italic">{room}</div>
    </div>
  );
})
  ) : (
    <div className="text-center text-gray-400">—</div>
  )}
</td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </Slider>
        )}
      </section>

      <Footer />
    </div>
  );
}
