'use client';
import Link from 'next/link';
import { useLanguage } from '../lib/i18n';
import PawTrail from '../components/PawTrail';
import ScrollReveal from '../components/ScrollReveal';
import Button from '../components/ui/Button';

// Hero-ийн зөөлөн paw-print хээ (data-URI SVG) — зөвхөн гоёл чимэглэл
const PAW_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cg fill='%23625BF6'%3E%3Cellipse cx='24' cy='30' rx='11' ry='9'/%3E%3Ccircle cx='10' cy='18' r='5.5'/%3E%3Ccircle cx='38' cy='18' r='5.5'/%3E%3Ccircle cx='17' cy='8' r='5'/%3E%3Ccircle cx='31' cy='8' r='5'/%3E%3C/g%3E%3C/svg%3E\")";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="page-shell">
      <section className="relative overflow-hidden py-[var(--sp-8)] max-sm:pt-[var(--sp-5)] max-sm:pb-[var(--sp-6)] max-[480px]:pt-[var(--sp-4)] max-[480px]:pb-[var(--sp-5)] min-[1025px]:pb-[calc(var(--sp-8)+var(--sp-4))] min-[1440px]:pt-[calc(var(--sp-8)+var(--sp-3))] min-[1440px]:pb-[calc(var(--sp-8)+var(--sp-6))]">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.04]" style={{ backgroundImage: PAW_PATTERN, backgroundSize: '110px 110px' }} aria-hidden="true" />
        {/* Indigo / Coral ambient glows */}
        <div className="hero-glow absolute -top-[260px] -left-[180px] size-[560px] bg-[var(--primary)] opacity-10" aria-hidden="true" />
        <div className="hero-glow absolute top-20 -right-40 size-[420px] bg-[var(--accent)] opacity-[0.06]" aria-hidden="true" />

        <div className="relative z-1 grid grid-cols-[1.15fr_.85fr] items-center gap-[var(--sp-7)] max-[900px]:grid-cols-1 max-[900px]:gap-[var(--sp-5)]">
          <div className="max-w-[720px] min-[1025px]:max-w-[800px]">
            <div className="eyebrow">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 21s-7-4.5-9.5-9C.7 8.3 2 4.8 5.4 4.1 7.6 3.6 9.8 4.6 12 7c2.2-2.4 4.4-3.4 6.6-2.9 3.4.7 4.7 4.2 2.9 7.9C19 16.5 12 21 12 21z" /></svg>
              {t('hero_eyebrow')}
            </div>
            <h1 className="mb-[var(--sp-5)] text-[clamp(2.6rem,5.4vw,4.4rem)] leading-[1.06] max-sm:mb-[var(--sp-3)] max-sm:text-[length:var(--text-2xl)] max-[480px]:text-[length:var(--text-xl)] min-[1025px]:text-[length:var(--text-display-lg)]">
              {t('hero_title_1')} <span className="text-[var(--accent)]">{t('hero_title_accent')}</span> {t('hero_title_2')}
            </h1>
            <p className="mb-[var(--sp-5)] max-w-[480px] text-[16.5px] leading-[1.6] text-[var(--text-secondary)] max-sm:mb-[var(--sp-4)] max-sm:text-[15px] max-[480px]:text-[14.5px] max-[480px]:leading-[1.65] min-[1025px]:mb-[var(--sp-6)] min-[1025px]:max-w-[540px] min-[1025px]:text-[17px] min-[1025px]:leading-[1.7]">{t('hero_desc')}</p>
            <div className="flex flex-wrap gap-[var(--sp-3)] [&_[data-variant='accent']]:shadow-[var(--shadow-glow)] [&_.arrow]:transition-transform [&_.btn-base:hover_.arrow]:translate-x-[3px] max-[480px]:flex-col max-[480px]:gap-[var(--sp-2)] max-[480px]:[&_.btn-base]:w-full max-[480px]:[&_.btn-base]:justify-center min-[1025px]:gap-[var(--sp-4)]">
              <Button as="link" href="/report-lost" variant="accent">
                {t('hero_btn_lost')}
                <svg className="arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Button>
              <Button as="link" href="/report-found" variant="secondary">{t('hero_btn_found')}</Button>
            </div>

            <ul className="mt-[var(--sp-5)] flex list-none flex-wrap gap-x-[var(--sp-4)] gap-y-[var(--sp-2)] p-0 [&_li]:inline-flex [&_li]:items-center [&_li]:gap-[7px] [&_li]:text-[length:var(--text-xs)] [&_li]:font-medium [&_li]:text-[var(--text-secondary)] [&_svg]:shrink-0 [&_svg]:text-[var(--primary-light)] max-[480px]:mt-[var(--sp-4)] max-[480px]:flex-col max-[480px]:[&_li]:text-[13px]" aria-label="Платформын давуу талууд">
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span>{t('hero_trust_location')}</span>
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
                </svg>
                <span>{t('hero_trust_photo')}</span>
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
                </svg>
                <span>{t('hero_trust_direct')}</span>
              </li>
            </ul>
          </div>

          {/* Харагдац карт — гоёл чимэглэл */}
          <div className="relative flex min-h-[320px] w-full min-w-0 items-center justify-center px-3 max-[900px]:min-h-0 max-[900px]:px-0 max-[900px]:pt-[var(--sp-4)] max-[900px]:pb-[var(--sp-5)]" aria-hidden="true">
            <div className="relative w-[min(280px,calc(100%-24px))] overflow-hidden rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] shadow-[var(--shadow-lift)] motion-safe:animate-[pulse_6s_ease-in-out_infinite]">
              <div className="relative flex h-[180px] items-center justify-center bg-[radial-gradient(circle_at_40%_30%,color-mix(in_srgb,var(--primary)_24%,transparent),transparent_72%),var(--surface-3)] [&>svg]:text-[var(--primary)] [&>svg]:opacity-35">
                <span className="absolute top-3 left-3 rounded-[var(--r-pill)] bg-[var(--accent)] px-[11px] py-[5px] text-[11px] font-bold tracking-[0.03em] text-[var(--text-on-accent)]">АЛДСАН</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64" focusable="false">
                  <circle cx="12" cy="12" r="7" />
                  <path d="M9 10.5c0-1 .6-1.5 1.4-1.5M14.6 10.5c0-1-.6-1.5-1.4-1.5M9.5 15c1.5 1 3.5 1 5 0" strokeLinecap="round" />
                </svg>
              </div>
              <div className="p-[var(--sp-4)]">
                <h4 className="mb-0.5 font-[family-name:var(--font-display)] text-[17px] text-[var(--text-primary)]">Нохой</h4>
                <p className="mb-2.5 text-[13px] text-[var(--text-tertiary)]">Голден ретривер, шаргал</p>
                <div className="flex items-center gap-1.5 text-[12.5px] text-[var(--text-secondary)] [&_svg]:text-[var(--alert-light)]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" focusable="false">
                    <path d="M12 21s-7-4.5-8.5-9.6C2.6 7.8 4.4 5 7.3 4.9c1.9-.1 3.5 1 4.7 2.6C13.2 5.9 14.8 4.8 16.7 4.9c2.9.1 4.7 2.9 3.8 6.5C19 16.5 12 21 12 21z" />
                  </svg>
                  Баянзүрх — 22 хороо
                </div>
              </div>
            </div>
            <div className="absolute bottom-2 left-1/2 flex w-max max-w-[min(240px,calc(100%-24px))] -translate-x-1/2 items-center gap-2 rounded-[var(--r-md)] border border-[var(--border-strong)] bg-[var(--surface-3)] p-[var(--sp-3)] shadow-[var(--shadow-md)] max-[900px]:bottom-3">
              <span className="size-2 shrink-0 rounded-full bg-[var(--confirmed)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--confirmed)_18%,transparent)]" />
              <p className="min-w-0 overflow-wrap-anywhere text-[11.5px] font-semibold leading-[1.35] whitespace-normal text-[var(--text-secondary)]">Шинэ тохирол олдлоо</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-[var(--sp-9)] max-sm:mt-[var(--sp-6)] max-[480px]:mt-[var(--sp-5)]">
        <div className="eyebrow">{t('services_title')}</div>
        <h2 className="max-w-[640px] text-[clamp(1.8rem,3.2vw,2.6rem)] leading-[1.15] max-sm:text-[length:var(--text-xl)]">{t('services_subtitle')}</h2>

        <div className="mt-[var(--sp-5)] grid grid-cols-12 gap-[var(--sp-4)] max-[900px]:gap-[var(--sp-3)] [&>a]:relative [&>a]:col-span-3 [&>a]:block [&>a]:h-full [&>a]:min-h-[150px] [&>a]:rounded-[var(--r-lg)] [&>a]:border [&>a]:border-[var(--border-subtle)] [&>a]:bg-[var(--surface-2)] [&>a]:p-[var(--sp-5)] [&>a]:no-underline [&>a]:shadow-[var(--shadow-sm)] [&>a]:transition-[transform,box-shadow,border-color] [&>a]:duration-[var(--dur-base)] [&>a]:ease-[var(--ease-out)] [&>a:hover]:-translate-y-1 [&>a:hover]:border-[var(--primary-light)] [&>a:hover]:shadow-[var(--shadow-md)] [&>a:nth-child(-n+2)]:col-span-6 max-[900px]:[&>a]:col-span-6 max-[600px]:[&>a]:col-span-12 [&_.service-icon]:mb-[var(--sp-4)] [&_.service-icon]:inline-flex [&_.service-icon]:size-12 [&_.service-icon]:items-center [&_.service-icon]:justify-center [&_.service-icon]:rounded-[var(--r-md)] [&_.service-icon]:bg-[var(--primary)] [&_.service-icon]:text-white [&_.service-icon]:transition-transform [&>a:nth-child(1)_.service-icon]:bg-[var(--accent)] [&>a:nth-child(2)_.service-icon]:bg-[var(--found)] [&>a:nth-child(4)_.service-icon]:bg-[var(--found)] [&>a:nth-child(5)_.service-icon]:bg-[var(--clinic)] [&>a:nth-child(6)_.service-icon]:bg-[var(--assistant)] [&>a:hover_.service-icon]:-rotate-3 [&>a:hover_.service-icon]:scale-105 [&>a_h3]:mb-[var(--sp-1)] [&>a_h3]:font-[family-name:var(--font-display)] [&>a_h3]:text-[length:var(--text-base)] [&>a_h3]:font-bold [&>a_h3]:text-[var(--text-primary)] [&>a_p]:text-[length:var(--text-xs)] [&>a_p]:leading-[1.5] [&>a_p]:text-[var(--text-secondary)] [&_.service-arrow]:absolute [&_.service-arrow]:top-[var(--sp-5)] [&_.service-arrow]:right-[var(--sp-4)] [&_.service-arrow]:text-[var(--text-tertiary)] [&_.service-arrow]:transition-transform [&>a:hover_.service-arrow]:translate-x-[3px] [&>a:hover_.service-arrow]:text-[var(--primary)]">
          <Link href="/report-lost" className="service-card">
            <span className="service-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <h3>{t('services_lost')}</h3>
            <p>{t('services_lost_desc')}</p>
            <span className="service-arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </span>
          </Link>
          <Link href="/report-found" className="service-card">
            <span className="service-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
              </svg>
            </span>
            <h3>{t('services_found')}</h3>
            <p>{t('services_found_desc')}</p>
            <span className="service-arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </span>
          </Link>
          <Link href="/adoptions" className="service-card">
            <span className="service-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              </svg>
            </span>
            <h3>{t('services_adopt')}</h3>
            <p>{t('services_adopt_desc')}</p>
            <span className="service-arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </span>
          </Link>
          <Link href="/sitting" className="service-card">
            <span className="service-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
              </svg>
            </span>
            <h3>{t('services_sitting')}</h3>
            <p>{t('services_sitting_desc')}</p>
            <span className="service-arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </span>
          </Link>
          <Link href="/clinics" className="service-card">
            <span className="service-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="M12 22V10" />
              </svg>
            </span>
            <h3>{t('services_clinics')}</h3>
            <p>{t('services_clinics_desc')}</p>
            <span className="service-arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </span>
          </Link>
          <Link href="/assistant" className="service-card">
            <span className="service-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /><path d="M8 9h8M8 13h5" />
              </svg>
            </span>
            <h3>{t('services_assistant')}</h3>
            <p>{t('services_assistant_desc')}</p>
            <span className="service-arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </span>
          </Link>
        </div>
      </section>

      <section className="py-[var(--sp-9)] max-sm:mt-[var(--sp-5)] max-[480px]:mt-[var(--sp-4)] min-[1025px]:mt-[var(--sp-7)]">
        <div className="mb-[var(--sp-5)] flex items-center justify-between gap-[var(--sp-3)] max-sm:mb-[var(--sp-4)] max-sm:flex-col max-sm:items-start max-[480px]:mb-[var(--sp-3)] min-[1025px]:mb-[var(--sp-6)]">
          <h2 className="mb-0 text-[clamp(1.4rem,3vw,1.9rem)] max-[480px]:text-[length:var(--text-xl)] min-[1025px]:text-[length:var(--text-3xl)]">{t('how_it_works')}</h2>
          <button type="button" className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 font-bold text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_8%,var(--surface-2))] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] max-[480px]:w-full max-[480px]:justify-center" onClick={() => window.dispatchEvent(new Event('mur:open-onboarding'))}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 17h.01"/></svg>
            {t('how_it_works')}
          </button>
        </div>
        <div className="mb-[var(--sp-4)] w-full max-[480px]:mb-[var(--sp-3)] min-[1025px]:mb-[var(--sp-5)]">
          <PawTrail labels={[t('step1_title'), t('step2_title'), t('step3_title')]} current={2} />
        </div>

        <div className="grid grid-cols-3 gap-[var(--sp-5)] max-[800px]:grid-cols-1 max-sm:gap-[var(--sp-4)] max-[480px]:gap-[var(--sp-3)] min-[1025px]:gap-[var(--sp-6)]">
          <ScrollReveal className="relative overflow-hidden rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-[var(--sp-5)] py-[var(--sp-6)] shadow-[var(--shadow-sm)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[var(--shadow-lift)] max-sm:rounded-[var(--r-md)] max-sm:px-[var(--sp-4)] max-sm:py-[var(--sp-5)] max-[480px]:px-[var(--sp-3)] max-[480px]:py-[var(--sp-4)] min-[1025px]:rounded-[var(--r-xl)] min-[1025px]:px-[var(--sp-6)] min-[1025px]:py-[var(--sp-7)]">
            <span className="mb-[var(--sp-3)] block bg-[var(--grad-accent)] bg-clip-text font-[family-name:var(--font-display)] text-[clamp(2.2rem,7vw,3rem)] leading-none font-extrabold text-transparent opacity-60" aria-hidden="true">01</span>
            <p className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)] max-[480px]:text-sm max-[480px]:leading-[1.6] min-[1025px]:text-[15px] min-[1025px]:leading-[1.65]">{t('step1_desc')}</p>
          </ScrollReveal>
          <ScrollReveal className="reveal-delay-1 relative overflow-hidden rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-[var(--sp-5)] py-[var(--sp-6)] shadow-[var(--shadow-sm)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[var(--shadow-lift)] max-sm:rounded-[var(--r-md)] max-sm:px-[var(--sp-4)] max-sm:py-[var(--sp-5)] max-[480px]:px-[var(--sp-3)] max-[480px]:py-[var(--sp-4)] min-[1025px]:rounded-[var(--r-xl)] min-[1025px]:px-[var(--sp-6)] min-[1025px]:py-[var(--sp-7)]">
            <span className="mb-[var(--sp-3)] block bg-[var(--grad-accent)] bg-clip-text font-[family-name:var(--font-display)] text-[clamp(2.2rem,7vw,3rem)] leading-none font-extrabold text-transparent opacity-60" aria-hidden="true">02</span>
            <p className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)] max-[480px]:text-sm max-[480px]:leading-[1.6] min-[1025px]:text-[15px] min-[1025px]:leading-[1.65]">{t('step2_desc')}</p>
          </ScrollReveal>
          <ScrollReveal className="reveal-delay-2 relative overflow-hidden rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-[var(--sp-5)] py-[var(--sp-6)] shadow-[var(--shadow-sm)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[var(--shadow-lift)] max-sm:rounded-[var(--r-md)] max-sm:px-[var(--sp-4)] max-sm:py-[var(--sp-5)] max-[480px]:px-[var(--sp-3)] max-[480px]:py-[var(--sp-4)] min-[1025px]:rounded-[var(--r-xl)] min-[1025px]:px-[var(--sp-6)] min-[1025px]:py-[var(--sp-7)]">
            <span className="mb-[var(--sp-3)] block bg-[var(--grad-accent)] bg-clip-text font-[family-name:var(--font-display)] text-[clamp(2.2rem,7vw,3rem)] leading-none font-extrabold text-transparent opacity-60" aria-hidden="true">03</span>
            <p className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)] max-[480px]:text-sm max-[480px]:leading-[1.6] min-[1025px]:text-[15px] min-[1025px]:leading-[1.65]">{t('step3_desc')}</p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
