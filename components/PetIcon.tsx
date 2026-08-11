import type { PetType } from "../lib/types";

type IconProps = {
  size: number;
};

const sharedSvgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true,
  focusable: false,
} as const;

function CatIcon({ size }: IconProps) {
  return (
    <svg {...sharedSvgProps} width={size} height={size}>
      <path
        d="M5.75 9.05 5.2 3.9l4.13 2.5A9.4 9.4 0 0 1 12 6c.93 0 1.82.14 2.67.4l4.13-2.5-.55 5.15A7.85 7.85 0 0 1 20 14c0 4.1-3.58 6.5-8 6.5S4 18.1 4 14c0-1.88.66-3.58 1.75-4.95Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 12.5h.01M15.5 12.5h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="m10.4 15.1 1.6 1.1 1.6-1.1M12 16.2v1.25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m7.6 15.25-3.1-.4m3.35 2.05-2.9.75m11.45-2.4 3.1-.4m-3.35 2.05 2.9.75" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

function DogIcon({ size }: IconProps) {
  return (
    <svg {...sharedSvgProps} width={size} height={size}>
      <path
        d="M7.2 7.25 4.55 5.5a1.5 1.5 0 0 0-2.3 1.27v2.88a4.1 4.1 0 0 0 3.1 3.98V15c0 3.45 2.98 5.5 6.65 5.5s6.65-2.05 6.65-5.5v-1.37a4.1 4.1 0 0 0 3.1-3.98V6.77a1.5 1.5 0 0 0-2.3-1.27L16.8 7.25A8.15 8.15 0 0 0 12 5.75c-1.8 0-3.45.56-4.8 1.5Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 12.25h.01M15.5 12.25h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M10.1 15.1c.35-.8 1.04-1.2 1.9-1.2s1.55.4 1.9 1.2c-.4.7-1.08 1.05-1.9 1.05s-1.5-.35-1.9-1.05ZM12 16.15v1.3m0 0c-.75 0-1.25-.22-1.6-.65m1.6.65c.75 0 1.25-.22 1.6-.65"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OtherPetIcon({ size }: IconProps) {
  return (
    <svg {...sharedSvgProps} width={size} height={size}>
      <path
        d="M7.3 18.85c-1.35-1.45-.62-3.83 1.28-4.48.75-.26 1.27-.92 1.42-1.7.2-1.04 1.02-1.77 2-1.77s1.8.73 2 1.77c.15.78.67 1.44 1.42 1.7 1.9.65 2.63 3.03 1.28 4.48-1.16 1.24-2.7 1.18-4.7.15-2 1.03-3.54 1.09-4.7-.15Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6.95 11.15c1.17-.3 1.76-1.88 1.3-3.53-.45-1.65-1.77-2.74-2.94-2.43-1.18.3-1.76 1.88-1.31 3.53.46 1.65 1.78 2.74 2.95 2.43Zm10.1 0c-1.17-.3-1.76-1.88-1.3-3.53.45-1.65 1.77-2.74 2.94-2.43 1.18.3 1.76 1.88 1.31 3.53-.46 1.65-1.78 2.74-2.95 2.43ZM12 9.3c1.2 0 2.17-1.4 2.17-3.13S13.2 3.05 12 3.05 9.83 4.45 9.83 6.17 10.8 9.3 12 9.3Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.65"
      />
    </svg>
  );
}

export default function PetIcon({ type, size = 40 }: { type: PetType; size?: number }) {
  if (type === "Муур") return <CatIcon size={size} />;
  if (type === "Нохой") return <DogIcon size={size} />;
  return <OtherPetIcon size={size} />;
}
