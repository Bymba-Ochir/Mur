import Navbar from '../components/Navbar';
import './globals.css';

export const metadata = {
  title: 'МӨР — Гэртээ буцах зам',
  description: 'Алдсан, олдсон гэрийн тэжээвэр амьтныг олоход туслах платформ',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="mn">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
