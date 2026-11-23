import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Flat geometric Narenj brand mark inspired by Narenj Design System V3 Page 11
 */
export function NarenjBrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <svg
        width={compact ? 30 : 34}
        height={compact ? 30 : 34}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Leaf crown */}
        <path
          d="M15 9C16 4 21 3 23 7C25 3.5 30 5 29 9.5C25 10.5 18 10.5 15 9Z"
          fill="#8ed461"
        />
        {/* Tangerine body */}
        <circle cx="20" cy="23" r="14" fill="#ff5c0c" />
        {/* Eyes */}
        <circle cx="15.5" cy="21" r="1.8" fill="#1d1d1b" />
        <circle cx="24.5" cy="21" r="1.8" fill="#1d1d1b" />
        {/* Smile */}
        <path
          d="M14.5 25.5C16.2 28.8 23.8 28.8 25.5 25.5"
          stroke="#1d1d1b"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={`font-bold tracking-tight text-[#ff5c0c] ${
          compact ? 'text-xl' : 'text-[26px] leading-none'
        }`}
      >
        نارنج
      </span>
    </span>
  );
}

/**
 * V3 Page 10 & 11 Sticker 1: Smiling Narenj Orange on Sticky Note Green (#e1eb80)
 * Used for "پاسخ ثبت شده" (Submitted answers)
 */
export function StickerSubmitted({ className = 'w-28 h-28' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      <g transform="rotate(-12 60 60)">
        <rect
          x="16"
          y="16"
          width="88"
          height="88"
          rx="18"
          fill="#e1eb80"
          stroke="#ffffff"
          strokeWidth="5"
        />
        {/* Leaf */}
        <path
          d="M49 34C50 24 59 23 62 30C66 24 75 26 73 35C66 37 55 37 49 34Z"
          fill="#4a9b2f"
        />
        {/* Orange circle */}
        <circle cx="60" cy="64" r="30" fill="#ff5c0c" />
        {/* Eyes */}
        <circle cx="50" cy="59" r="3" fill="#1d1d1b" />
        <circle cx="70" cy="59" r="3" fill="#1d1d1b" />
        {/* Smile */}
        <path
          d="M47 68C51 76 69 76 73 68"
          stroke="#1d1d1b"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/**
 * V3 Page 10 & 11 Sticker 2: Smiling Sky Pop Puzzle Piece (#2ba0ff) on Highlighter Yellow (#f5e211)
 * Used for "پاسخ درست" (Correct answers)
 */
export function StickerCorrect({ className = 'w-28 h-28' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      <g transform="rotate(14 60 60)">
        <rect
          x="16"
          y="16"
          width="88"
          height="88"
          rx="18"
          fill="#f5e211"
          stroke="#ffffff"
          strokeWidth="5"
        />
        {/* Puzzle body */}
        <rect x="34" y="38" width="52" height="48" rx="12" fill="#2ba0ff" />
        {/* Top knob */}
        <circle cx="60" cy="36" r="10" fill="#2ba0ff" />
        {/* Left & Right knobs */}
        <circle cx="33" cy="62" r="9" fill="#2ba0ff" />
        <circle cx="87" cy="62" r="9" fill="#2ba0ff" />
        {/* Eyes */}
        <circle cx="51" cy="57" r="3" fill="#1d1d1b" />
        <circle cx="69" cy="57" r="3" fill="#1d1d1b" />
        {/* Smile */}
        <path
          d="M48 66C52 74 68 74 72 66"
          stroke="#1d1d1b"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/**
 * V3 Page 10 & 11 Sticker 3: Smiling Fresh Grass Triangle (#8ed461) on Coral Pop (#ff705d)
 * Used for "پاسخ نیازمند توجه" (Answers needing attention)
 */
export function StickerAttention({ className = 'w-28 h-28' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      <g transform="rotate(-14 60 60)">
        <rect
          x="16"
          y="16"
          width="88"
          height="88"
          rx="18"
          fill="#ff705d"
          stroke="#ffffff"
          strokeWidth="5"
        />
        {/* Soft rounded green triangle */}
        <path
          d="M55 31C58 25 65 25 68 31L91 74C94 80 90 87 83 87H40C33 87 29 80 32 74L55 31Z"
          fill="#b4e27a"
        />
        {/* Eyes */}
        <circle cx="54" cy="58" r="2.8" fill="#1d1d1b" />
        <circle cx="68" cy="58" r="2.8" fill="#1d1d1b" />
        {/* Gentle smile */}
        <path
          d="M50 68C55 74 68 74 73 67"
          stroke="#1d1d1b"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/**
 * V3 Page 10 & 11 Top-Right Rounded Square Status Badge Icon
 */
export function V3CornerBadge({
  variant,
}: {
  variant: 'submitted' | 'correct' | 'attention';
}) {
  if (variant === 'submitted') {
    return (
      <span
        className="w-12 h-12 rounded-2xl bg-[#2ba0ff] inline-flex items-center justify-center shrink-0"
        aria-hidden="true"
      >
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
          <path
            d="M14 2L17.2 10.8L26 14L17.2 17.2L14 26L10.8 17.2L2 14L10.8 10.8L14 2Z"
            fill="#d9f0ff"
          />
        </svg>
      </span>
    );
  }
  if (variant === 'correct') {
    return (
      <span
        className="w-12 h-12 rounded-2xl bg-[#c9e682] inline-flex items-center justify-center shrink-0"
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12.5L10 17.5L19.5 7.5"
            stroke="#59982c"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="w-12 h-12 rounded-2xl bg-[#ffaa94] inline-flex items-center justify-center shrink-0"
      aria-hidden="true"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 7L17 17M17 7L7 17"
          stroke="#ec5c17"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/**
 * Signature Narenj Design System V3 Pill Button (Page 10 & 11)
 * Vibrant #ff5c0c pill with embedded translucent circular chevron badge
 */
interface V3PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg' | 'sm';
  showArrow?: boolean;
  arrowDirection?: 'forward' | 'back';
  children: React.ReactNode;
}

export function V3PillButton({
  variant = 'primary',
  size = 'md',
  showArrow = true,
  arrowDirection = 'forward',
  className = '',
  disabled,
  children,
  ...props
}: V3PillButtonProps) {
  const sizeStyles = {
    sm: 'h-10 px-4 text-sm gap-2.5',
    md: 'h-12 px-5 text-base gap-3',
    lg: 'h-14 px-6 text-base gap-3.5',
  }[size];

  const variantStyles = {
    primary: disabled
      ? 'bg-[#d5d5d4] text-[#686562] cursor-not-allowed'
      : 'bg-[#ff5c0c] hover:bg-[#ec5c17] active:bg-[#c74809] text-white shadow-[0_3px_0_0_#c74809]',
    secondary: disabled
      ? 'bg-[#d5d5d4] text-[#686562] cursor-not-allowed'
      : 'bg-[#f5f1e4] hover:bg-[#ebe4d0] active:bg-[#e0dbce] text-[#1d1d1b] border border-[#e0dbce]',
    ghost: disabled
      ? 'text-[#686562] cursor-not-allowed'
      : 'bg-transparent hover:bg-[#f5f1e4] text-[#3c3c3c]',
    danger: disabled
      ? 'bg-[#d5d5d4] text-[#686562] cursor-not-allowed'
      : 'bg-[#ff705d] hover:bg-[#e85b48] text-white shadow-[0_3px_0_0_#c44332]',
  }[variant];

  const arrowCircleBg =
    variant === 'primary' || variant === 'danger'
      ? disabled
        ? 'bg-[#686562]/20 text-[#686562]'
        : 'bg-white/25 text-white'
      : 'bg-[#1d1d1b]/10 text-[#1d1d1b]';

  return (
    <button
      disabled={disabled}
      className={`narenj-pill-btn inline-flex items-center justify-center font-semibold whitespace-nowrap shrink-0 cursor-pointer ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      <span>{children}</span>
      {showArrow && (
        <span
          className={`w-7 h-7 rounded-full inline-flex items-center justify-center shrink-0 ${arrowCircleBg}`}
          aria-hidden="true"
        >
          {arrowDirection === 'forward' ? (
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          )}
        </span>
      )}
    </button>
  );
}

/**
 * Medal Icon for Mastery Milestones (80 Bronze, 90 Silver, 100 Gold)
 */
export function MedalIcon({
  tier,
  size = 24,
}: {
  tier: 'none' | 'bronze' | 'silver' | 'gold';
  size?: number;
}) {
  const palette = {
    gold: { outer: '#f5e211', inner: '#ff5c0c', ribbon: '#2ba0ff' },
    silver: { outer: '#c5d3e8', inner: '#686562', ribbon: '#2ba0ff' },
    bronze: { outer: '#ff9d6d', inner: '#9e3908', ribbon: '#8ed461' },
    none: { outer: '#e0dbce', inner: '#d5d5d4', ribbon: '#d5d5d4' },
  }[tier];

  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M9 17L6 26L11.5 23.5L14 26L14 17H9Z" fill={palette.ribbon} />
      <path d="M19 17L22 26L16.5 23.5L14 26L14 17H19Z" fill={palette.ribbon} opacity="0.8" />
      <circle cx="14" cy="11" r="8.5" fill={palette.outer} stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="14" cy="11" r="4.5" fill={palette.inner} opacity="0.85" />
    </svg>
  );
}
