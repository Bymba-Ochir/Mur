import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import InstallPrompt from '../components/InstallPrompt';
import Onboarding from '../components/Onboarding';
import PageTransition from '../components/PageTransition';
import { ToastProvider } from '../components/Toast';
import { LanguageProvider } from '../lib/i18n';
import { AuthProvider } from '../lib/AuthProvider';
import AnalyticsProvider from '../components/AnalyticsProvider';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mur-chi.vercel.app';

export const metadata: Metadata = {
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('mur-theme');
                  var theme = saved || 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">Үндсэн агуулга руу шилжих</a>
        <AuthProvider>
          <LanguageProvider>
            <ToastProvider>
              <Navbar />
              <main id="main-content"><PageTransition>{children}</PageTransition></main>
              <Footer />
              <InstallPrompt />
              <Onboarding />
              <AnalyticsProvider />
            </ToastProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
