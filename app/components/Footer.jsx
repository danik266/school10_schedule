"use client";
import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { lang } = useLanguage();

  return (
    <>
      <style>{`
        .ftr {
          background: linear-gradient(135deg, #040e1d 0%, #071628 100%);
          border-top: 1px solid rgba(56,189,248,0.1);
          padding: 10px 24px;
          display: flex; align-items: center; justify-content: space-between;
          position: relative; overflow: hidden; flex-shrink: 0;
          margin-top: auto;
        }
        .ftr::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(56,189,248,0.3), transparent);
        }
        .ftr-left { display: flex; align-items: center; gap: 8px; }
        .ftr-logo {
          width: 22px; height: 22px;
          background: linear-gradient(135deg, #1565c0, #0891b2);
          border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 8px rgba(8,145,178,0.3);
        }
        .ftr-brand { font-size: 12px; font-weight: 700; color: rgba(148,185,255,0.7); letter-spacing: 0.03em; }
        .ftr-brand span { color: #38bdf8; }
        .ftr-sep { width: 1px; height: 14px; background: rgba(56,139,255,0.15); }
        .ftr-college { font-size: 10px; color: rgba(100,140,180,0.5); font-weight: 500; letter-spacing: 0.04em; }
        .ftr-year { font-size: 10px; color: rgba(100,140,180,0.35); font-weight: 500; letter-spacing: 0.05em; }
      `}</style>
      <footer className="ftr">
        <div className="ftr-left">
          <div className="ftr-logo">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(186,230,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <span className="ftr-brand"><span>GymCoders</span></span>
          <div className="ftr-sep" />
          <span className="ftr-college">
            {lang === "ru" ? "Колледж информационных технологий" : "Ақпараттық технологиялар колледжі"}
          </span>
        </div>
        <div className="ftr-year">© {new Date().getFullYear()}</div>
      </footer>
    </>
  );
}