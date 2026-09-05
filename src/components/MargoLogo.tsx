import React from "react";

interface MargoLogoProps {
  className?: string;
  variant?: "dark" | "light";
}

export default function MargoLogo({ className = "w-9 h-9", variant = "dark" }: MargoLogoProps) {
  const isLight = variant === "light";
  return (
    <svg
      viewBox="0 0 44 44"
      className={`${className} select-none shrink-0 transition-all duration-300 drop-shadow-xs`}
      id="margo-brand-logo"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer Circle */}
      <circle
        cx="22"
        cy="22"
        r="21"
        fill={isLight ? "#FAF5EA" : "#121824"}
        stroke="#C5A059"
        strokeWidth="1.5"
        strokeOpacity={isLight ? "1" : "0.75"}
      />
      {/* Inner Accent Ring */}
      <circle
        cx="22"
        cy="22"
        r="18.5"
        fill="none"
        stroke="#C5A059"
        strokeWidth="0.5"
        strokeOpacity="0.35"
      />
      {/* Monogram 'M' in Cormorant Garamond */}
      <text
        x="22"
        y="29"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="22"
        fontWeight="700"
        fill={isLight ? "#121824" : "#FAF5EA"}
        letterSpacing="-0.5"
      >
        M
      </text>
    </svg>
  );
}

