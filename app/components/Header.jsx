"use client";
import { useLanguage } from "../context/LanguageContext";

export default function Header() {
  const { lang, toggleLang } = useLanguage();

  return (
    <header className="bg-[#0a1c3a] text-white flex justify-between items-center p-3">
      <h1 className="text-lg font-semibold">
        {lang === "ru" ? "Гимназия №10 г.Павлодар" : "Павлодар қ. №10 гимназия"}
      </h1>
      <button
        onClick={toggleLang}
        className="border rounded-full px-3 py-1 text-sm"
      >
        {lang === "ru" ? "KZ" : "RU"}
      </button>
    </header>
  );
}
