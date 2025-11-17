"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AuthPage() {
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { lang } = useLanguage();

  const t = {
    ru: {
      login: "Логин",
      pass: "Пароль",
      loginPh: "Введите ваш логин...",
      passPh: "Введите ваш пароль...",
      btn: "Войти",
      err: "Неверный логин или пароль",
    },
    kz: {
      login: "Логин",
      pass: "Құпия сөз",
      loginPh: "Логин енгізіңіз...",
      passPh: "Құпия сөзді енгізіңіз...",
      btn: "Кіру",
      err: "Қате логин немесе құпия сөз",
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
        <div className="bg-white rounded-xl border p-8 w-full max-w-md text-center shadow">
          <h2 className="text-xl font-semibold mb-6">Авторизация</h2>

          <form className="flex flex-col gap-8" onSubmit={handleLogin}>
            <div className="text-left">
              <label className="block mb-1">{t[lang].login}</label>
              <input
                type="text"
                placeholder={t[lang].loginPh}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div className="text-left relative">
              <label className="block mb-1">{t[lang].pass}</label>
              <input
                type={show ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder={t[lang].passPh}
                className="w-full border rounded-lg p-3 pr-10"
              />
            <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute  right-3 top-3 mt-7" 
              >
                  <img
                  src={show ? "/lasteye.svg" : "/eye-hide-svgrepo-com.svg"}
                  alt="Toggle Password"
                  className="w-6"
                  />
            </button>
          </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              className="bg-[#0d254c] text-white rounded-full py-3 hover:bg-blue-900 transition"
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
