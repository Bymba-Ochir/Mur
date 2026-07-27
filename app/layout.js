import Navbar from '../components/Navbar';
import InstallPrompt from '../components/InstallPrompt';
import Onboarding from '../components/Onboarding';
import { ToastProvider } from '../components/Toast';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mur-chi.vercel.app';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'МӨР — Гэртээ буцах зам | Алдсан, олдсон нохой муур',
  description: 'Улаанбаатар хотод алдсан, олдсон гэрийн тэжээвэр амьтныг (нохой, муур) хурдан олоход туслах платформ. Зураг оруулаад, ойр орчмынхонтой шууд холбогдоорой.',
  keywords: ['алдсан нохой', 'алдсан муур', 'олдсон нохой', 'олдсон муур', 'Улаанбаатар тэжээвэр амьтан', 'алдсан амьтан'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'МӨР — Гэртээ буцах зам',
    description: 'Алдсан, олдсон гэрийн тэжээвэр амьтныг олоход туслах платформ',
    url: SITE_URL,
    siteName: 'МӨР',
    locale: 'mn_MN',
    type: 'website',
  },
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
        <ToastProvider>
          <Navbar />
          <main>{children}</main>
          <InstallPrompt />
          <Onboarding />
        </ToastProvider>
      </body>
    </html>
  );
}
