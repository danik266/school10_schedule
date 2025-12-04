"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AuthPage() {
  const [login, setLogin] = useState(""); // исправлено
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false); // исправлено
  const [error, setError] = useState("");
  const router = useRouter();
  const { lang } = useLanguage();

  // Пути к вашим SVG-файлам в папке public
  const HIDDEN_EYE_SRC = "/eye-hide-svgrepo-com.svg"; 
  const VISIBLE_EYE_SRC = "/lasteye.svg"; 

  const t = {
    ru: {
      login: "Логин",
      pass: "Пароль",
      loginPh: "Введите ваш логин...",
      passPh: "Введите ваш пароль...",
      btn: "Войти",
      err: "Неверный логин или пароль",
      netErr: "Ошибка сети",
    },
    kz: {
      login: "Логин",
      pass: "Құпия сөз",
      loginPh: "Логин енгізіңіз...",
      passPh: "Құпия сөзді енгізіңіз...",
      btn: "Кіру",
      err: "Қате логин немесе құпия сөз",
      netErr: "Желі қатесі",
    },
  };

  const handleLogin = async (e) => {
  e.preventDefault();
  setError("");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password: pass }),
    });

    const data = await res.json();

    if (data.success) {
  router.push("/schedule-view");
} else {
  setError(t[lang].err);
}

  } catch {
    setError(t[lang].netErr);
  }
};


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header showLogin={false} />

      <main className="flex flex-1 flex-col md:flex-row justify-center items-center py-10 gap-50 px-6">  
        <div className="flex justify-center items-center w-full max-w-md">
          <img
            src="/photo.svg"
            alt="Logo"
            className="w-80 md:w-full object-contain"
          />
        </div>

        <div className="rounded-xl p-8 w-full max-w-md text-center">
          <form 
            className="flex flex-col gap-6 p-8 bg-white rounded-xl shadow-2xl max-w-sm w-full" 
            onSubmit={handleLogin}
          >
            <h2 className="text-3xl font-bold text-center text-[#0d254c] mb-4">{t[lang].btn}</h2>

            {/* Поле для Логина */}
            <div className="relative">
              <input 
                type="text" 
                placeholder={t[lang].loginPh} 
                value={login} 
                onChange={(e) => setLogin(e.target.value)} 
                className="w-full border border-gray-300 rounded-xl p-4 focus:ring-[#0d254c] focus:border-transparent transition duration-300 placeholder-gray-500 text-gray-800"
              />
            </div>

            {/* Поле для Пароля с глазиком */}
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder={t[lang].passPh} 
                value={pass} 
                onChange={(e) => setPass(e.target.value)} 
                className="w-full border border-gray-300 rounded-xl p-4 pr-12 focus:ring-[#0d254c] focus:border-transparent transition duration-300 placeholder-gray-500 text-gray-800"
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility} 
                className="absolute inset-y-0 right-0 pr-3 flex items-center transition"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                <img 
                  src={showPassword ? VISIBLE_EYE_SRC : HIDDEN_EYE_SRC} 
                  alt={showPassword ? "Глаз открыт" : "Глаз закрыт"}
                  className="w-5 h-5 opacity-60 hover:opacity-100"
                />
              </button>
            </div>

            {/* Сообщение об ошибке */}
            {error && (
              <p className="text-red-600 text-sm font-medium text-center bg-red-50 p-2 rounded-lg border border-red-300 animate-pulse">
                {error}
              </p>
            )}

            {/* Кнопка Войти */}
            <button 
              type="submit" 
              className="bg-[#0d254c] text-white rounded-full py-3 mt-2 font-semibold text-lg shadow-lg hover:bg-blue-800 transition duration-300 transform hover:scale-[1.01]"
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
