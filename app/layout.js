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
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
