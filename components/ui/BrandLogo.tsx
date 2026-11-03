import Image from 'next/image';

export default function BrandLogo() {
  return (
    <span className="mur-logo" role="img" aria-label="МӨР">
      <Image src="/icon.svg" alt="" width={42} height={42} unoptimized />
      <svg viewBox="0 0 60 21" aria-hidden="true" focusable="false" fill="none" stroke="currentColor">
        <path d="M2.8 18V3l8.3 10.4L19.4 3v15" strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="33.3" cy="10.5" r="7.5" strokeWidth="4.5" />
        <path d="M25.8 10.5h15" strokeWidth="3.8" />
        <path d="M47.8 18V3h5.6a4.2 4.2 0 0 1 0 8.4h-5.6" strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
