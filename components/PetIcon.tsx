import type { PetType } from "../lib/types";

function CatIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g>
        {/* ears */}
        <path
          d="M16 25L10 8L27 19"
          fill="currentColor"
          fillOpacity=".12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        <path
          d="M48 25L54 8L37 19"
          fill="currentColor"
          fillOpacity=".12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* head */}
        <circle cx="32" cy="35" r="20" fill="currentColor" fillOpacity=".08" />

        <circle
          cx="32"
          cy="35"
          r="20"
          stroke="currentColor"
          strokeWidth="2.5"
        />

        {/* eyes */}
        <circle cx="24" cy="33" r="3.2" fill="currentColor" />
        <circle cx="40" cy="33" r="3.2" fill="currentColor" />

        {/* eye shine */}
        <circle cx="25" cy="32" r="1" fill="white" />
        <circle cx="41" cy="32" r="1" fill="white" />

        {/* cheeks */}
        <circle cx="18" cy="40" r="2" fill="#ff9fba" opacity=".7" />

        <circle cx="46" cy="40" r="2" fill="#ff9fba" opacity=".7" />

        {/* nose */}
        <path d="M29 39L32 41L35 39" fill="currentColor" />

        {/* mouth */}
        <path
          d="M27 43C29 46 35 46 37 43"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* whiskers */}
        <path
          d="M8 38L18 40M8 44L18 43"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <path
          d="M56 38L46 40M56 44L46 43"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function DogIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ears */}

      <path
        d="M16 24C7 19 5 28 8 35C10 40 16 41 20 37"
        fill="currentColor"
        fillOpacity=".12"
        stroke="currentColor"
        strokeWidth="2.5"
      />

      <path
        d="M48 24C57 19 59 28 56 35C54 40 48 41 44 37"
        fill="currentColor"
        fillOpacity=".12"
        stroke="currentColor"
        strokeWidth="2.5"
      />

      {/* face */}

      <ellipse
        cx="32"
        cy="36"
        rx="21"
        ry="19"
        fill="currentColor"
        fillOpacity=".08"
      />

      <ellipse
        cx="32"
        cy="36"
        rx="21"
        ry="19"
        stroke="currentColor"
        strokeWidth="2.5"
      />

      {/* eyes */}

      <circle cx="24" cy="33" r="3.2" fill="currentColor" />

      <circle cx="40" cy="33" r="3.2" fill="currentColor" />

      <circle cx="25" cy="32" r="1" fill="white" />

      <circle cx="41" cy="32" r="1" fill="white" />

      {/* nose */}

      <ellipse cx="32" cy="40" rx="5" ry="4" fill="currentColor" />

      <ellipse cx="33.5" cy="39" rx="1.5" ry="1" fill="white" opacity=".6" />

      {/* smile */}

      <path
        d="M32 44V47"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M25 48C28 52 36 52 39 48"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* tongue */}

      <path d="M28 50C30 56 34 56 36 50" fill="#ff8fab" />
    </svg>
  );
}

function PawIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* toes */}

      <circle cx="32" cy="16" r="6" fill="currentColor" />

      <circle cx="18" cy="25" r="5" fill="currentColor" />

      <circle cx="46" cy="25" r="5" fill="currentColor" />

      <circle cx="14" cy="37" r="4.5" fill="currentColor" />

      <circle cx="50" cy="37" r="4.5" fill="currentColor" />

      {/* pad */}

      <path
        d="
        M20 42
        C20 32 44 32 44 42
        C44 52 36 55 32 55
        C28 55 20 52 20 42Z
        "
        fill="currentColor"
      />

      {/* shine */}

      <ellipse cx="37" cy="45" rx="3" ry="2" fill="white" opacity=".2" />
    </svg>
  );
}

export default function PetIcon({
  type,
  size = 40,
}: {
  type: PetType;
  size?: number;
}) {
  switch (type) {
    case "Муур":
      return <CatIcon size={size} />;

    case "Нохой":
      return <DogIcon size={size} />;

    case "Бусад":
      return <PawIcon size={size} />;

    default:
      return <PawIcon size={size} />;
  }
}
