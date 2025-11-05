"use client";
import { useState } from "react";
import { useLanguage } from "./context/LanguageContext";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Home() {
  const [show, setShow] = useState(false);
  const [pass, setPass] = useState("");
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
    },
    kz: {
      title: "Павлодар қ. №10 гимназиясының\nСабақ кестесін құру",
      login: "Логин",
      pass: "Құпия сөз",
      loginPh: "Логин енгізіңіз...",
      passPh: "Құпия сөзді енгізіңіз...",
      info: "Мектеп кестесін онлайн жасаңыз, түзетіңіз және қараңыз.",
      btn: "Кіру",
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header />

      <main className="flex flex-1 justify-around items-center flex-col md:flex-row gap-10 p-6">
        <img src="/photo.svg" alt="Logo" className="w-80 md:w-120 object-contain" />

        <div className="bg-white rounded-xl border border-gray-300 p-8 w-full max-w-md text-center">
          <h2 className="text-xl font-semibold mb-4 whitespace-pre-line">
            {t[lang].title}
          </h2>

          <form className="flex flex-col gap-10" onSubmit={(e) => e.preventDefault()}>
            <div className="text-left">
              <label className="block mb-1">{t[lang].login}</label>
              <input
                type="text"
                placeholder={t[lang].loginPh}
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
                  alt="icon"
                  className="w-6"
                />
              </button>
            </div>

            <p className="text-sm text-gray-500">{t[lang].info}</p>

            <button
              type="submit"
              className="bg-[#0a1c3a] text-white rounded-full py-3 mt-2 hover:bg-blue-900 transition"
            >
              {t[lang].btn}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
