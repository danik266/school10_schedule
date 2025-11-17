"use client";
import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { lang } = useLanguage();

  return (
    <footer className="relative bg-[#0a1c3a] text-white text-end text-xs p-3 mt-auto w-full overflow-hidden">

      {/* Основной текст */}
      <div className="relative z-10">
        {lang === "ru" ? (
          <>
            При поддержке GymCoders<br />
            Колледж информационных технологий
          </>
        ) : (
          <>
            GymCoders қолдауымен<br />
            Ақпараттық технологиялар колледжі
          </>
        )}
      </div>
    </footer>
  );
}
