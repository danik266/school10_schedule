"use client";
import { useLanguage } from "../context/LanguageContext";
import Link from "next/link";

export default function Header({ showLogin = false }) {
  const { lang, toggleLang } = useLanguage();

  return (
    <header className="bg-[#0a1c3a] text-white flex justify-between items-center p-3">
      <h1 className="text-lg font-semibold">
        {lang === "ru" ? "Гимназия №10 г.Павлодар" : "Павлодар қ. №10 гимназия"}
      </h1>

      <div className="flex items-center gap-3">
        {showLogin && (
          <Link href="/auth">
            <button className="border rounded-full px-3 py-1 text-sm bg-[#0a1c3a]  text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {lang === "ru" ? "Войти" : "Кіру"}
            </button>
          </Link>
        )}

        <button
          onClick={toggleLang}
          className="border rounded-full px-3 py-1 text-sm bg-[#0a1c3a]  text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {lang === "ru" ? "KZ" : "RU"}
        </button>
      </div>
    </header>
  );
}
