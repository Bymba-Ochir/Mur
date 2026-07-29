// lib/i18n.js
// Хялбар, dependency-гүй монгол/англи хэлний сан. Одоогоор Navbar болон Нүүр
// хуудсыг бүрэн орчуулсан — бусад хуудсыг ижил загвараар үргэлжлүүлж болно.
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export const DICT = {
  mn: {
    nav_lost: 'Алдсан', nav_found: 'Олдсон', nav_listings: 'Жагсаалт',
    nav_mypets: 'Миний амьтад', nav_admin: '🛡️ Админ', nav_login: 'Нэвтрэх',
    nav_logout_prefix: 'Гарах',
    login_title: 'Нэвтрэх', login_email_label: 'Имэйл хаяг',
    login_button: 'Нэвтрэх холбоос авах', login_sent: '✅ Нэвтрэх холбоос имэйл рүү тань илгээгдлээ. Имэйлээ шалгаарай.',
    login_error: 'Алдаа гарлаа. Имэйлээ шалгаад дахин оролдоно уу.', close: 'Хаах',
    hero_eyebrow: '🐾 Улаанбаатараас эхэлж байна',
    hero_title_1: 'Алдсан амьтан', hero_title_accent: 'гэрээ', hero_title_2: 'олж чадна',
    hero_desc: 'Зураг оруулаад, ойр орчмынхонтой шууд холбогдоорой. Нэг платформ дээр мэдэгдэж, хайж, тохируулна.',
    hero_btn_lost: '🐾 Алдсан мэдэгдэх', hero_btn_found: '👀 Олсон зурагтай',
    how_it_works: 'Яаж ажилладаг вэ',
    step1_title: '1. Бүртгэх', step1_desc: 'Зураг, өнгө, газраа оруулна.',
    step2_title: '2. Харах', step2_desc: 'Дүүргээр шүүж, жагсаалт үзнэ.',
    step3_title: '3. Холбогдох', step3_desc: 'Утсаар шууд холбогдоно.',
  },
  en: {
    nav_lost: 'Lost', nav_found: 'Found', nav_listings: 'Listings',
    nav_mypets: 'My Pets', nav_admin: '🛡️ Admin', nav_login: 'Log in',
    nav_logout_prefix: 'Log out',
    login_title: 'Log in', login_email_label: 'Email address',
    login_button: 'Send login link', login_sent: '✅ A login link has been sent to your email. Please check your inbox.',
    login_error: 'Something went wrong. Please check your email and try again.', close: 'Close',
    hero_eyebrow: '🐾 Starting in Ulaanbaatar',
    hero_title_1: 'A lost pet', hero_title_accent: 'can find', hero_title_2: 'its way home',
    hero_desc: 'Upload a photo and connect directly with people nearby. Post, search, and coordinate all in one place.',
    hero_btn_lost: '🐾 Report lost pet', hero_btn_found: '👀 Report found pet',
    how_it_works: 'How it works',
    step1_title: '1. Post', step1_desc: 'Add a photo, color, and location.',
    step2_title: '2. Browse', step2_desc: 'Filter by district, view listings.',
    step3_title: '3. Connect', step3_desc: 'Reach out directly by phone.',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('mn');

  useEffect(() => {
    const saved = localStorage.getItem('mur-lang');
    if (saved === 'en' || saved === 'mn') setLang(saved);
  }, []);

  function toggle() {
    const next = lang === 'mn' ? 'en' : 'mn';
    setLang(next);
    localStorage.setItem('mur-lang', next);
  }

  function t(key) {
    return DICT[lang][key] || DICT.mn[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage нь LanguageProvider дотор ашиглагдах ёстой');
  return ctx;
}
