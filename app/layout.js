export const metadata = {
  title: 'School Schedule',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <header className="bg-blue-600 text-white p-4 font-bold text-xl">
          School Schedule Constructor
        </header>
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
