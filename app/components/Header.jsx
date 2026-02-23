"use client";
import { useLanguage } from "../context/LanguageContext";
import Link from "next/link";

export default function Header({ showLogin = false }) {
  const { lang, toggleLang } = useLanguage();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .hdr {
          background: linear-gradient(135deg, #040e1d 0%, #071628 60%, #050f1e 100%);
          border-bottom: 1px solid rgba(56,189,248,0.12);
          display: flex; justify-content: space-between; align-items: center;
          padding: 0 24px; height: 58px; position: relative; overflow: hidden; flex-shrink: 0;
        }
        .hdr::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.4) 30%, rgba(99,179,237,0.6) 50%, rgba(56,189,248,0.4) 70%, transparent 100%);
        }
        .hdr-beam {
          position: absolute; top: -60px; left: 15%;
          width: 200px; height: 120px;
          background: radial-gradient(ellipse, rgba(56,189,248,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .hdr-logo { display: flex; align-items: center; gap: 12px; }
        .hdr-badge {
          width: 34px; height: 34px;
          background: linear-gradient(145deg, #1565c0, #0891b2);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 0 1px rgba(56,189,248,0.3), 0 4px 12px rgba(8,145,178,0.4);
          flex-shrink: 0;
        }
        .hdr-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px; font-weight: 800;
          color: #e8f4fd; letter-spacing: -0.02em;
        }
        .hdr-sub {
          font-size: 10px; color: rgba(148,185,255,0.5);
          font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 1px;
        }
        .hdr-right { display: flex; align-items: center; gap: 8px; position: relative; z-index: 1; }
        .hdr-status {
          display: flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 20px;
          background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2);
          font-size: 10px; color: #4ade80; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
        }
        .hdr-status-dot {
          width: 5px; height: 5px; border-radius: 50%; background: #4ade80;
          box-shadow: 0 0 6px #4ade80;
          animation: hdrdot 2.5s ease-in-out infinite;
        }
        @keyframes hdrdot { 0%,100%{opacity:1} 50%{opacity:0.4;box-shadow:0 0 10px #4ade80} }
        .hdr-sep { width:1px; height:22px; background: rgba(56,139,255,0.18); }
        .hdr-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 13px; border-radius: 8px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          border: 1px solid rgba(56,189,248,0.2);
          background: rgba(255,255,255,0.04);
          color: rgba(186,230,255,0.85);
          transition: all 0.18s; letter-spacing: 0.02em;
          text-decoration: none; font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .hdr-btn:hover {
          background: rgba(56,189,248,0.12); border-color: rgba(56,189,248,0.4);
          color: #e0f7ff; box-shadow: 0 0 14px rgba(56,189,248,0.15);
          transform: translateY(-1px);
        }
        .hdr-btn-login {
          background: linear-gradient(135deg, rgba(21,101,192,0.4), rgba(8,145,178,0.3));
          border-color: rgba(56,189,248,0.35); color: #bae6fd;
          padding: 6px 18px;
        }
        .hdr-btn-login:hover { box-shadow: 0 0 20px rgba(56,189,248,0.25); }
      `}</style>
      <header className="hdr">
        <div className="hdr-beam" />
        <div className="hdr-logo">
          <div>
            <div className="hdr-name">{lang === "ru" ? "Гимназия №10 г. Павлодар" : "Павлодар қ. №10 Гимназия"}</div>
            <div className="hdr-sub">{lang === "ru" ? "Система управления расписанием" : "Кесте басқару жүйесі"}</div>
          </div>
        </div>
        <div className="hdr-right">
          
          <div className="hdr-sep" />
          {showLogin && (
            <Link href="/auth">
              <button className="hdr-btn hdr-btn-login">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                {lang === "ru" ? "Войти" : "Кіру"}
              </button>
            </Link>
          )}
          <button className="hdr-btn" onClick={toggleLang}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
            </svg>
            {lang === "ru" ? "KZ" : "RU"}
          </button>
        </div>
      </header>
    </>
  );
}