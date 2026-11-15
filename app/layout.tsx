import { headers } from 'next/headers';
import NonceStyleRegistry from '../components/StyleRegistry';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, JetBrains_Mono, Montserrat } from 'next/font/google';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FeedbackProvider } from '../components/FeedbackButton';
import InstallPrompt from '../components/InstallPrompt';
import Onboarding from '../components/Onboarding';
import PageTransition from '../components/PageTransition';
import { ToastProvider } from '../components/Toast';
import DocumentLanguage from '../components/DocumentLanguage';
import { LanguageProvider } from '../lib/i18n';
import { AuthProvider } from '../lib/AuthProvider';
import AnalyticsProvider from '../components/AnalyticsProvider';
import { getQPayDonationConfig } from '../lib/qpay';
import { SITE_URL, siteBrandMetadata, websiteStructuredData } from '../lib/siteMetadata';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-body', display: 'swap' });
// Unbounded-ийн Ө/Ү кирилл glyph хэт өвөрмөц харагддаг тул гарчигт
// кирилл бүрэн дэмждэг, уншигдахуйц Montserrat ашиглана.
const montserrat = Montserrat({ subsets: ['latin', 'cyrillic'], variable: '--font-display', display: 'swap' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin', 'cyrillic'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  ...siteBrandMetadata,
  metadataBase: new URL(SITE_URL),
  keywords: ['алдсан нохой', 'алдсан муур', 'олдсон нохой', 'олдсон муур', 'Улаанбаатар тэжээвэр амьтан', 'алдсан амьтан'],
  manifest: '/manifest.json',
  verification: { google: 'U9uX6mECTK3qOk3T2v7q-yoQcNeNtatSKve6Tk8yFAA' },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const iban = process.env.DONATION_IBAN?.trim();
  const bank = process.env.DONATION_BANK?.trim();
  const bankTransfer = iban && bank ? { iban, bank } : undefined;
  const nonce = (await headers()).get('x-nonce') ?? '';
  return (
    <html lang="mn" suppressHydrationWarning>
      <head>
        <meta property="csp-nonce" content={nonce} />
        <script type="application/ld+json" nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData()).replace(/</g, '\\u003c') }} />
        <script nonce={nonce}
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
      <body className={`${inter.variable} ${montserrat.variable} ${jetBrainsMono.variable}`}>
        <NonceStyleRegistry nonce={nonce}>
          <AuthProvider>
            <LanguageProvider>
              <DocumentLanguage />
              <ToastProvider>
                <FeedbackProvider>
                  <Navbar />
                  <main id="main-content"><PageTransition>{children}</PageTransition></main>
                  <Footer bankTransfer={bankTransfer} donationsEnabled={getQPayDonationConfig() !== null} />
                </FeedbackProvider>
                <InstallPrompt />
                <Onboarding />
                <AnalyticsProvider />
              </ToastProvider>
            </LanguageProvider>
          </AuthProvider>
        </NonceStyleRegistry>
      </body>
    </html>
  );
}
