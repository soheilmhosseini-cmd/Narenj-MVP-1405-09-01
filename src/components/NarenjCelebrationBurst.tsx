import React, { useEffect, useState } from 'react';

interface NarenjCelebrationBurstProps {
  /** Increment or change this key to re-trigger the burst animation */
  triggerKey: string | number;
  /** 'goal' = compact localized burst (e.g. crossing 80/90/100 milestone); 'module' = graceful wider completion burst */
  variant?: 'goal' | 'module';
  /** Optional extra richness when reaching 100% mastery */
  emphasized?: boolean;
  className?: string;
}

interface ParticleSpec {
  id: number;
  tx: number;
  ty: number;
  rot: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
  shape: 'circle' | 'pill' | 'square' | 'star';
}

// Strict Narenj Design System V3 Palette
const NARENJ_PALETTE = [
  '#ff5c0c', // Brand Orange 500
  '#f5e211', // Highlighter Yellow
  '#8ed461', // Fresh Grass
  '#2ba0ff', // Sky Pop
  '#ff705d', // Coral Pop
  '#e1eb80', // Sticky Note Green
] as const;

const GOAL_PARTICLES: ParticleSpec[] = [
  { id: 1, tx: -76, ty: -42, rot: -45, size: 7, delay: 0, duration: 760, color: NARENJ_PALETTE[0], shape: 'circle' },
  { id: 2, tx: -46, ty: -62, rot: 35, size: 8, delay: 35, duration: 820, color: NARENJ_PALETTE[1], shape: 'star' },
  { id: 3, tx: -16, ty: -68, rot: -20, size: 7, delay: 20, duration: 780, color: NARENJ_PALETTE[2], shape: 'pill' },
  { id: 4, tx: 18, ty: -66, rot: 40, size: 7, delay: 50, duration: 800, color: NARENJ_PALETTE[3], shape: 'square' },
  { id: 5, tx: 52, ty: -58, rot: -55, size: 8, delay: 25, duration: 840, color: NARENJ_PALETTE[0], shape: 'star' },
  { id: 6, tx: 78, ty: -38, rot: 60, size: 7, delay: 45, duration: 760, color: NARENJ_PALETTE[4], shape: 'circle' },
  { id: 7, tx: -84, ty: -8, rot: 25, size: 6, delay: 60, duration: 720, color: NARENJ_PALETTE[5], shape: 'pill' },
  { id: 8, tx: 86, ty: -6, rot: -30, size: 6, delay: 55, duration: 740, color: NARENJ_PALETTE[2], shape: 'circle' },
  { id: 9, tx: -58, ty: 24, rot: 45, size: 6, delay: 40, duration: 760, color: NARENJ_PALETTE[3], shape: 'circle' },
  { id: 10, tx: 60, ty: 22, rot: -40, size: 6, delay: 70, duration: 780, color: NARENJ_PALETTE[1], shape: 'square' },
];

const MODULE_PARTICLES: ParticleSpec[] = [
  { id: 1, tx: -168, ty: -48, rot: -55, size: 9, delay: 20, duration: 960, color: NARENJ_PALETTE[0], shape: 'star' },
  { id: 2, tx: -136, ty: -78, rot: 42, size: 8, delay: 55, duration: 920, color: NARENJ_PALETTE[1], shape: 'pill' },
  { id: 3, tx: -98, ty: -92, rot: -30, size: 7, delay: 10, duration: 880, color: NARENJ_PALETTE[2], shape: 'circle' },
  { id: 4, tx: -56, ty: -86, rot: 65, size: 8, delay: 75, duration: 940, color: NARENJ_PALETTE[3], shape: 'square' },
  { id: 5, tx: -18, ty: -96, rot: -40, size: 9, delay: 30, duration: 980, color: NARENJ_PALETTE[0], shape: 'circle' },
  { id: 6, tx: 22, ty: -94, rot: 35, size: 8, delay: 60, duration: 920, color: NARENJ_PALETTE[1], shape: 'star' },
  { id: 7, tx: 62, ty: -84, rot: -50, size: 8, delay: 15, duration: 940, color: NARENJ_PALETTE[4], shape: 'pill' },
  { id: 8, tx: 104, ty: -88, rot: 45, size: 7, delay: 80, duration: 900, color: NARENJ_PALETTE[2], shape: 'square' },
  { id: 9, tx: 142, ty: -72, rot: -25, size: 9, delay: 40, duration: 960, color: NARENJ_PALETTE[3], shape: 'star' },
  { id: 10, tx: 172, ty: -42, rot: 55, size: 8, delay: 70, duration: 940, color: NARENJ_PALETTE[5], shape: 'circle' },
  { id: 11, tx: -154, ty: 16, rot: 30, size: 7, delay: 90, duration: 860, color: NARENJ_PALETTE[4], shape: 'circle' },
  { id: 12, tx: -112, ty: 38, rot: -45, size: 7, delay: 65, duration: 880, color: NARENJ_PALETTE[5], shape: 'pill' },
  { id: 13, tx: 118, ty: 36, rot: 40, size: 7, delay: 85, duration: 880, color: NARENJ_PALETTE[0], shape: 'pill' },
  { id: 14, tx: 158, ty: 14, rot: -35, size: 7, delay: 50, duration: 860, color: NARENJ_PALETTE[2], shape: 'circle' },
  { id: 15, tx: -72, ty: -46, rot: 20, size: 6, delay: 110, duration: 840, color: NARENJ_PALETTE[1], shape: 'circle' },
  { id: 16, tx: 76, ty: -44, rot: -20, size: 6, delay: 100, duration: 840, color: NARENJ_PALETTE[3], shape: 'circle' },
];

/**
 * Subtle compositor-only geometric particle burst in Narenj Design System V3 colors.
 * Automatically mounts for the animation lifecycle and cleans up cleanly.
 */
export function NarenjCelebrationBurst({
  triggerKey,
  variant = 'goal',
  emphasized = false,
  className = '',
}: NarenjCelebrationBurstProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const totalMs = variant === 'module' ? 1250 : 980;
    const timer = window.setTimeout(() => setVisible(false), totalMs);
    return () => window.clearTimeout(timer);
  }, [triggerKey, variant]);

  if (!visible) return null;

  const baseParticles = variant === 'module' ? MODULE_PARTICLES : GOAL_PARTICLES;
  const spreadMultiplier = emphasized ? 1.12 : 1;

  return (
    <div
      key={triggerKey}
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-visible ${className}`}
    >
      {/* Expanding subtle Narenj halo ring */}
      <span
        className={`narenj-halo-ring absolute rounded-full border-2 ${
          variant === 'module' ? 'w-20 h-20 border-[#ff5c0c]/60' : 'w-12 h-12 border-[#8ed461]/70'
        }`}
      />
      {emphasized && (
        <span
          className="narenj-halo-ring absolute w-16 h-16 rounded-full border-2 border-[#f5e211]/70"
          style={{ animationDelay: '120ms' }}
        />
      )}

      {/* Flat geometric V3 particles */}
      {baseParticles.map((p) => {
        const style = {
          '--tx': `${Math.round(p.tx * spreadMultiplier)}px`,
          '--ty': `${Math.round(p.ty * spreadMultiplier)}px`,
          '--rot': `${p.rot}deg`,
          animationDelay: `${p.delay}ms`,
          animationDuration: `${p.duration}ms`,
        } as React.CSSProperties;

        if (p.shape === 'star') {
          return (
            <svg
              key={p.id}
              width={p.size + 4}
              height={p.size + 4}
              viewBox="0 0 16 16"
              fill="none"
              style={style}
              className="narenj-celebration-particle absolute"
            >
              <path
                d="M8 1L9.9 6.1L15 8L9.9 9.9L8 15L6.1 9.9L1 8L6.1 6.1L8 1Z"
                fill={p.color}
              />
            </svg>
          );
        }

        const shapeClass =
          p.shape === 'circle'
            ? 'rounded-full'
            : p.shape === 'pill'
            ? 'rounded-full'
            : 'rounded-[3px]';

        return (
          <span
            key={p.id}
            style={{
              ...style,
              width: p.shape === 'pill' ? `${p.size + 4}px` : `${p.size}px`,
              height: p.shape === 'pill' ? `${Math.max(4, p.size - 3)}px` : `${p.size}px`,
              backgroundColor: p.color,
            }}
            className={`narenj-celebration-particle absolute ${shapeClass}`}
          />
        );
      })}
    </div>
  );
}
