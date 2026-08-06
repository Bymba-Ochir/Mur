// components/PetIcon.tsx
// Emoji (🐕🐈) систем бүр дээр өөр харагддаг тул тогтвортой SVG icon-оор сольсон.
// currentColor ашигладаг тул dark mode-д автоматаар зохицно.
// Шинэчилсэн: илүү тод, танигдахуйц, хөөрхөн загвар.
import type { PetType } from '../lib/types';

function CatIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      {/* Чих — хоёр шулуун гурвалжин */}
      <path d="M13 18L7 4L19 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M35 18L41 4L29 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Дотоод чих */}
      <path d="M14 16L10 7L18 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      <path d="M34 16L38 7L30 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      {/* Толгой */}
      <circle cx="24" cy="28" r="14" stroke="currentColor" strokeWidth="2.2" />
      {/* Нүд — том, тод */}
      <circle cx="18" cy="26" r="2.4" fill="currentColor" />
      <circle cx="30" cy="26" r="2.4" fill="currentColor" />
      {/* Нүдний гэрэл */}
      <circle cx="19" cy="25" r="0.8" fill="var(--bg, #fff)" />
      <circle cx="31" cy="25" r="0.8" fill="var(--bg, #fff)" />
      {/* Хамар — жижиг гурвалжин */}
      <path d="M22 31L24 29.5L26 31" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" />
      {/* Ам — W хэлбэр */}
      <path d="M20 33.5Q22 35.5 24 33.5Q26 35.5 28 33.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Саадаг — тал бүр 3 шугам */}
      <path d="M8 28L15 30" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M7 31L15 31.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 34L15 33" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M40 28L33 30" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M41 31L33 31.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M40 34L33 33" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function DogIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      {/* Чих — зөөлөн унжсан */}
      <path d="M12 18C8 16 5 18 5 22C5 27 9 29 13 27" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 18C40 16 43 18 43 22C43 27 39 29 35 27" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Дотоод чих */}
      <path d="M11 19C8 17.5 6 19 6 22C6 25.5 9 27 12 26" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      <path d="M37 19C40 17.5 42 19 42 22C42 25.5 39 27 36 26" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      {/* Толгой — бага зэрэг өргөн */}
      <ellipse cx="24" cy="28" rx="14" ry="13" stroke="currentColor" strokeWidth="2.2" />
      {/* Нүд — том, тод */}
      <circle cx="18" cy="25" r="2.4" fill="currentColor" />
      <circle cx="30" cy="25" r="2.4" fill="currentColor" />
      {/* Нүдний гэрэл */}
      <circle cx="19" cy="24" r="0.8" fill="var(--bg, #fff)" />
      <circle cx="31" cy="24" r="0.8" fill="var(--bg, #fff)" />
      {/* Хамар — том, дугуй */}
      <ellipse cx="24" cy="30" rx="3" ry="2.4" fill="currentColor" />
      {/* Хамарний гэрэл */}
      <ellipse cx="25" cy="29.5" rx="0.8" ry="0.6" fill="var(--bg, #fff)" opacity="0.6" />
      {/* Ам — инээмсэглэл */}
      <path d="M24 32.5V35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 36C21 37.5 22.5 38 24 38C25.5 38 27 37.5 28 36" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Хэлний нэмэлт */}
      <path d="M22.5 37Q24 39.5 25.5 37" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function PawIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      {/* Их хуруу — дээр */}
      <ellipse cx="24" cy="12" rx="4" ry="5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Зүүн дээд */}
      <ellipse cx="14" cy="18" rx="3.5" ry="4.5" transform="rotate(-20 14 18)" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Баруун дээд */}
      <ellipse cx="34" cy="18" rx="3.5" ry="4.5" transform="rotate(20 34 18)" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Зүүн доод */}
      <ellipse cx="10" cy="27" rx="3" ry="4" transform="rotate(-30 10 27)" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Баруун доод */}
      <ellipse cx="38" cy="27" rx="3" ry="4" transform="rotate(30 38 27)" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Тулгуурын хөл */}
      <path d="M16 33C16 33 18 38 24 40C30 38 32 33 32 33C32 33 30 35 24 36C18 35 16 33 16 33Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PetIcon({ type, size = 40 }: { type: PetType; size?: number }) {
  switch (type) {
    case 'Муур':
      return <CatIcon size={size} />;
    case 'Нохой':
      return <DogIcon size={size} />;
    case 'Бусад':
      return <PawIcon size={size} />;
  }
}
