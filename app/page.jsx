"use client";
import { useEffect, useState } from "react";
import { useLanguage } from "./context/LanguageContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function Home() {
  const [schedule, setSchedule] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [cabinets, setCabinets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();

  const t = {
    ru: {
      title: "Актуальное расписание",
    },
    kz: {
      title: "Актуалды сабақ кестесі",
    },
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

    const fetchCabinets = async () => {
      try {
        const res = await fetch("/api/get-cabinets");
        const data = await res.json();
        if (data.success) setCabinets(data.cabinets);
      } catch (err) {
        console.error("Ошибка загрузки кабинетов:", err);
      }
    };

    fetchSchedule();
    fetchCabinets();
  }, []);

  const classesList = Object.values(schedule)
    .filter((cls) => {
      const match = cls.class_name.match(/^(\d+)/);
      if (!match) return false;
      const grade = parseInt(match[1], 10);
      return grade >= 5 && grade <= 11;
    })
    .sort((a, b) => parseInt(a.class_name) - parseInt(b.class_name));

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
      <Header showLogin={true} />

      {/* --- Контент на главной --- */}
      <main className="flex flex-col justify-center items-center py-10">
        <img src="/photo.svg" alt="Logo" className="w-80 object-contain mb-6" />

        <h1 className="text-3xl">
          {t[lang].title}
        </h1>
      </main>

      {/* --- Слайдер расписания --- */}
      <section className="bg-white border-t border-gray-300 py-8 px-4 relative">
        {loading ? (
          <p className="text-center text-gray-500">Загрузка расписания...</p>
        ) : classesList.length === 0 ? (
          <p className="text-center text-gray-500">Расписание пока не создано.</p>
        ) : (
          <Slider {...sliderSettings}>
            {classesList.map((cls) => {
              const maxLessons = Math.max(
                ...Object.values(cls.days).map((day) => day.length)
              );

              return (
                <div key={cls.class_name} className="p-4">
                  <h3 className="text-lg font-semibold mb-4 text-center">
                    {cls.class_name}
                  </h3>
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
                            <td className="border border-gray-300 p-2 text-center">
                              {i + 1}
                            </td>

                            {days.map((day) => {
                              const lessons =
                                cls.days[day]?.filter(
                                  (l) => l.lesson_num === i + 1
                                ) || [];

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
                                <td
                                  key={day}
                                  className="border border-gray-300 p-2"
                                >
                                  {lessonRender(
                                    lessons,
                                    teachers,
                                    cabinets
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

function lessonRender(lessons, teachers, cabinets) {
  return lessons.map((lesson, idx) => {
    const teacherObj = teachers.find(
      (t) => t.teacher_id.toString() === lesson.teacher_id?.toString()
    );

    const teacherName = teacherObj ? teacherObj.full_name : "Не назначен";

    const roomObj =
      lesson.room ||
      cabinets.find((c) => c.room_id === lesson.room_id);

    const room = roomObj
      ? `${roomObj.room_number}${
          roomObj.room_name ? ` (${roomObj.room_name})` : ""
        }`
      : "Кабинет не назначен";

    return (
      <div
        key={idx}
        className="mb-2 p-2 rounded bg-white border border-gray-200"
      >
        <div className="font-semibold">
          {lesson.subject}
          {lessons.length > 1 ? ` (${idx + 1} подгруппа)` : ""}
        </div>
        <div className="text-xs text-gray-600 mt-1">{teacherName}</div>
        <div className="text-xs text-gray-500 mt-1 italic">{room}</div>
      </div>
    );
  });
}
