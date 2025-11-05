import "./globals.css";
import { LanguageProvider } from "./context/LanguageContext";

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}