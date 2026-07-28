// components/PetIcon.js
// Emoji (🐕🐈) systemь бүр дээр өөр харагддаг тул тогтвортой SVG icon-оор сольсон.
// currentColor ашигладаг тул dark mode-д автоматаар зохицно.
export default function PetIcon({ type, size = 40 }) {
  const isCat = type === 'Муур';

  if (isCat) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path d="M14 10L10 4L16 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M34 10L38 4L32 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="26" r="16" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="18" cy="24" r="1.6" fill="currentColor" />
        <circle cx="30" cy="24" r="1.6" fill="currentColor" />
        <path d="M22 30C22.6 30.8 23.3 31.2 24 31.2C24.7 31.2 25.4 30.8 26 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 30L6 29M12 32L5 33M36 30L42 29M36 32L43 33" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M14 12C11 10 7 11 6 15C5 19 8 22 12 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 12C37 10 41 11 42 15C43 19 40 22 36 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="24" cy="27" rx="15" ry="13" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="18" cy="25" r="1.6" fill="currentColor" />
      <circle cx="30" cy="25" r="1.6" fill="currentColor" />
      <ellipse cx="24" cy="30" rx="2.6" ry="2" fill="currentColor" />
      <path d="M24 32V35M24 35C22.5 35 21.5 36 21.5 37M24 35C25.5 35 26.5 36 26.5 37" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
