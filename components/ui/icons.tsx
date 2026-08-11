'use client';
import type { ReactNode, SVGProps } from 'react';

/**
 * МӨР-ийн нэгдсэн SVG icon set — орчуулгын текстэд emoji хэрэглэхийн оронд
 * эндээс icon зурна. Бүгд ижил stroke-стандарттай (currentColor, strokeWidth 2).
 */
export type IconName =
  | 'paw'
  | 'shield'
  | 'home'
  | 'bot'
  | 'message'
  | 'cross'
  | 'heart'
  | 'vaccine'
  | 'eye'
  | 'camera'
  | 'search'
  | 'pin'
  | 'bell'
  | 'check'
  | 'alert'
  | 'thumb'
  | 'phone'
  | 'calendar'
  | 'flag'
  | 'lock'
  | 'trash'
  | 'pencil'
  | 'share'
  | 'plus'
  | 'close'
  | 'info'
  | 'sparkles'
  | 'settings';

const ICONS: Record<IconName, { viewBox: string; paths: ReactNode }> = {
  paw: {
    viewBox: '0 0 48 48',
    paths: (
      <>
        <ellipse cx="24" cy="30" rx="11" ry="9" />
        <circle cx="10" cy="18" r="5.5" />
        <circle cx="38" cy="18" r="5.5" />
        <circle cx="17" cy="8" r="5" />
        <circle cx="31" cy="8" r="5" />
      </>
    ),
  },
  shield: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
  home: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M9 21v-6h6v6" />
      </>
    ),
  },
  bot: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
  },
  message: {
    viewBox: '0 0 24 24',
    paths: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
  cross: {
    viewBox: '0 0 24 24',
    paths: <path d="M12 2v20M2 12h20" />,
  },
  heart: {
    viewBox: '0 0 24 24',
    paths: (
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    ),
  },
  vaccine: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
  },
  eye: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  camera: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
  },
  search: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </>
    ),
  },
  pin: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
  },
  bell: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </>
    ),
  },
  check: {
    viewBox: '0 0 24 24',
    paths: <path d="M20 6 9 17l-5-5" />,
  },
  alert: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
  },
  thumb: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <path d="M7 10v12" />
        <path d="M15 5.9 14 10h5a2 2 0 0 1 2 2 2 2 0 0 1-1 1.7A2 2 0 0 1 20 16a2 2 0 0 1-1 1.7A2 2 0 0 1 18 20H7" />
      </>
    ),
  },
  phone: {
    viewBox: '0 0 24 24',
    paths: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    ),
  },
  calendar: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
  },
  flag: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <path d="M4 22v-7" />
      </>
    ),
  },
  lock: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
  },
  trash: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      </>
    ),
  },
  pencil: {
    viewBox: '0 0 24 24',
    paths: <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />,
  },
  share: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
      </>
    ),
  },
  plus: {
    viewBox: '0 0 24 24',
    paths: <path d="M12 5v14M5 12h14" />,
  },
  close: {
    viewBox: '0 0 24 24',
    paths: <path d="M18 6 6 18M6 6l12 12" />,
  },
  info: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 16v-4M12 8h.01" />
      </>
    ),
  },
  sparkles: {
    viewBox: '0 0 24 24',
    paths: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" />,
  },
  settings: {
    viewBox: '0 0 24 24',
    paths: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.14.38.35.73.6 1 .3.3.7.45 1.1.4H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
      </>
    ),
  },
};

export default function Icon({
  name,
  size = 20,
  className = '',
  'aria-hidden': ariaHidden = true,
  focusable = false,
  ...rest
}: { name: IconName; size?: number; className?: string } & SVGProps<SVGSVGElement>) {
  const { viewBox, paths } = ICONS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={ariaHidden}
      focusable={focusable}
      {...rest}
    >
      {paths}
    </svg>
  );
}
