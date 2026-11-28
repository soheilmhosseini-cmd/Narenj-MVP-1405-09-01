import React, { useEffect, useState } from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import {
  SkillRecord,
  toPersianDigits,
  formatElapsedTime,
  getMedalForScore,
  getMasteryLevel,
  MASTERY_META,
} from '../data/narenjData';
import {
  StickerSubmitted,
  V3CornerBadge,
  V3PillButton,
  MedalIcon,
} from './V3Stickers';
import { NarenjCelebrationBurst } from './NarenjCelebrationBurst';

export interface SessionSummaryData {
  skill: SkillRecord;
  answeredCount: number;
  correctCount: number;
  needsAttentionCount: number;
  finalSmartScore: number;
  elapsedSeconds: number;
  coinsEarned: number;
  fromAssignment: boolean;
  reachedMastery: boolean;
}

interface SessionSummaryProps {
  summary: SessionSummaryData;
  onReturnToTasks: () => void;
  onPracticeAgain: () => void;
  onOpenProgress: () => void;
}

/**
 * STU-05 Session Summary — Pixel-Faithful to Narenj Design System V3 Page 11
 * Includes empty-exit handling (0 answers submitted), 3 Cream Paper Result Cards,
 * SmartScore / Medal milestone (secondary to learning result per P-12), and V3 Orange Pill CTA.
 */
export function SessionSummary({
  summary,
  onReturnToTasks,
  onPracticeAgain,
  onOpenProgress,
}: SessionSummaryProps) {
  const medal = getMedalForScore(summary.finalSmartScore);
  const mastery = getMasteryLevel(summary.finalSmartScore, summary.answeredCount);
  const masteryMeta = MASTERY_META[mastery];

  const [coinStage, setCoinStage] = useState<'initial' | 'pop' | 'settled'>('initial');
  const [animatedEarned, setAnimatedEarned] = useState(
    summary.coinsEarned > 0 ? 0 : summary.coinsEarned
  );

  // Trigger staged CSS transition animation when coins are earned on session completion
  useEffect(() => {
    if (summary.coinsEarned <= 0) {
      setCoinStage('settled');
      setAnimatedEarned(0);
      return;
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setCoinStage('settled');
      setAnimatedEarned(summary.coinsEarned);
      return;
    }

    setCoinStage('initial');
    setAnimatedEarned(0);

    const raf1 = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setCoinStage('pop');
      });
    });

    const settleTimer = window.setTimeout(() => {
      setCoinStage('settled');
    }, 520);

    // Smooth count-up synchronized with the CSS transition
    const duration = 560;
    const startTime = performance.now();
    let countRaf = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedEarned(Math.round(summary.coinsEarned * eased));
      if (progress < 1) {
        countRaf = window.requestAnimationFrame(tick);
      }
    };
    countRaf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(countRaf);
      window.clearTimeout(settleTimer);
    };
  }, [summary.coinsEarned, summary.skill.id, summary.answeredCount]);

  // Empty state per STU-05 specification: zero answers submitted before exit
  if (summary.answeredCount === 0) {
    return (
      <div className="max-w-[760px] mx-auto py-12 px-4 text-center space-y-6">
        <div className="narenj-cream-card p-8 md:p-10 space-y-5">
          <div className="flex justify-center">
            <StickerSubmitted className="w-24 h-24" />
          </div>
          <h1 className="text-[28px] md:text-[34px] font-bold text-[#1d1d1b]">
            پیش از ثبت پاسخ از جلسه خارج شدی
          </h1>
          <p className="text-base text-[#3c3c3c] max-w-md mx-auto">
            هنوز پاسخی برای تمرین «{summary.skill.title}» ثبت نشده است. هر زمان آماده بودی می‌توانی دوباره شروع کنی.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <V3PillButton type="button" onClick={onPracticeAgain}>
              ادامه همین تمرین
            </V3PillButton>
            <V3PillButton
              type="button"
              variant="secondary"
              showArrow={false}
              onClick={onReturnToTasks}
            >
              {summary.fromAssignment ? 'بازگشت به تکلیف‌ها' : 'بازگشت به خانه من'}
            </V3PillButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto py-6 md:py-10 px-4">
      {/* V3 Page 11 Title Block with Subtle Narenj Module-Completion Particle Burst */}
      <div className="relative text-center space-y-2.5 mb-10">
        <NarenjCelebrationBurst
          triggerKey={`${summary.skill.id}-${summary.answeredCount}-${summary.finalSmartScore}`}
          variant="module"
          emphasized={summary.reachedMastery}
          className="-top-6"
        />
        <h1 className="relative z-10 text-[30px] md:text-[38px] font-bold text-[#ff5c0c] leading-[1.35] narenj-goal-scale-up">
          {summary.reachedMastery
            ? 'آفرین! به تسلط کامل رسیدی:)'
            : 'یک قدم تازه برداشتی...:)'}
        </h1>
        <p className="relative z-10 text-base md:text-lg text-[#1d1d1b]">
          <span className="font-bold">تمرین: </span>
          <span className="text-[#3c3c3c]">{summary.skill.title}</span>
        </p>
      </div>

      {/* Exact 3 V3 Cream Paper Result Cards with Subtle Staggered Scale-Up Entrance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-9">
        {/* Card 1: پاسخ ثبت شده (Submitted) */}
        <article
          className="narenj-cream-card narenj-card-pop p-5 flex flex-col justify-between min-h-[250px]"
          style={{ animationDelay: '40ms' }}
        >
          <div className="flex items-start justify-between gap-2 px-1 pt-1">
            <V3CornerBadge variant="submitted" />
            <img
              src="/images/ui/ui-23.svg"
              alt="پاسخ ثبت شده"
              className="w-28 h-28 -mt-1 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="narenj-tray px-4 py-3.5 mt-4 flex items-center justify-between gap-3">
            <span className="w-10 h-10 rounded-full bg-[#2ba0ff] text-white font-bold text-lg inline-flex items-center justify-center tabular-nums shrink-0">
              {toPersianDigits(summary.answeredCount)}
            </span>
            <span className="text-base font-bold text-[#1d1d1b]">پاسخ ثبت شده</span>
          </div>
        </article>

        {/* Card 2: پاسخ درست (Correct) */}
        <article
          className="narenj-cream-card narenj-card-pop p-5 flex flex-col justify-between min-h-[250px]"
          style={{ animationDelay: '120ms' }}
        >
          <div className="flex items-start justify-between gap-2 px-1 pt-1">
            <V3CornerBadge variant="correct" />
            <img
              src="/images/ui/ui-24.svg"
              alt="پاسخ درست"
              className="w-28 h-28 -mt-1 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="narenj-tray px-4 py-3.5 mt-4 flex items-center justify-between gap-3">
            <span className="w-10 h-10 rounded-full bg-[#8ed461] text-white font-bold text-lg inline-flex items-center justify-center tabular-nums shrink-0">
              {toPersianDigits(summary.correctCount)}
            </span>
            <span className="text-base font-bold text-[#1d1d1b]">پاسخ درست</span>
          </div>
        </article>

        {/* Card 3: پاسخ نیازمند توجه (Needs Attention — pedagogical, non-punitive!) */}
        <article
          className="narenj-cream-card narenj-card-pop p-5 flex flex-col justify-between min-h-[250px]"
          style={{ animationDelay: '200ms' }}
        >
          <div className="flex items-start justify-between gap-2 px-1 pt-1">
            <V3CornerBadge variant="attention" />
            <img
              src="/images/ui/ui-25.svg"
              alt="پاسخ نیازمند توجه"
              className="w-28 h-28 -mt-1 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="narenj-tray px-4 py-3.5 mt-4 flex items-center justify-between gap-3">
            <span className="w-10 h-10 rounded-full bg-[#ff5c0c] text-white font-bold text-lg inline-flex items-center justify-center tabular-nums shrink-0">
              {toPersianDigits(summary.needsAttentionCount)}
            </span>
            <span className="text-base font-bold text-[#1d1d1b]">پاسخ نیازمند توجه</span>
          </div>
        </article>
      </div>

      {/* Learning Progress & Secondary Reward Strip (Per P-12: Result first, reward second) */}
      <div className="rounded-[24px] bg-white border border-[#e0dbce] p-5 md:p-6 mb-9 grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
        <div className="flex items-center gap-3.5">
          <div
            className="relative inline-flex items-center justify-center shrink-0 narenj-goal-scale-up"
            style={{ animationDelay: '240ms' }}
          >
            {medal.tier !== 'none' && (
              <span
                aria-hidden="true"
                className="narenj-halo-ring absolute inset-0 rounded-full border-2 border-[#f5e211] pointer-events-none"
                style={{ animationDelay: '240ms' }}
              />
            )}
            <MedalIcon tier={medal.tier} size={36} />
          </div>
          <div>
            <p className="text-xs text-[#686562]">امتیاز هوشمند تسلط</p>
            <p className="text-lg font-bold text-[#1d1d1b] tabular-nums">
              {toPersianDigits(summary.finalSmartScore)} از ۱۰۰
              <span
                className="mr-2 text-xs font-semibold px-2.5 py-0.5 rounded-[10px]"
                style={{
                  backgroundColor: masteryMeta.bg,
                  color: masteryMeta.color,
                  border: `1px solid ${masteryMeta.border}`,
                }}
              >
                {masteryMeta.label}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:border-r md:border-[#e0dbce] md:pr-5">
          <Clock className="w-5 h-5 text-[#686562] shrink-0" />
          <div>
            <p className="text-xs text-[#686562]">مدت تمرین این جلسه</p>
            <p className="text-base font-bold text-[#1d1d1b] tabular-nums">
              {formatElapsedTime(summary.elapsedSeconds)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 md:border-r md:border-[#e0dbce] md:pr-5">
          {/* V3 Coin Emblem with Pure CSS Transition Pop, Halo Ring & Shine Dots */}
          <div className="relative w-10 h-10 inline-flex items-center justify-center shrink-0">
            <span
              data-stage={coinStage}
              aria-hidden="true"
              className="narenj-coin-ring absolute inset-0 rounded-full border-2 border-[#f5e211] pointer-events-none"
            />
            <span
              data-stage={coinStage}
              aria-hidden="true"
              className="narenj-coin-spark narenj-coin-spark--1 absolute w-1.5 h-1.5 rounded-full bg-[#ff5c0c] pointer-events-none"
            />
            <span
              data-stage={coinStage}
              aria-hidden="true"
              className="narenj-coin-spark narenj-coin-spark--2 absolute w-1.5 h-1.5 rounded-full bg-[#f5e211] pointer-events-none"
            />
            <span
              data-stage={coinStage}
              aria-hidden="true"
              className="narenj-coin-spark narenj-coin-spark--3 absolute w-1.5 h-1.5 rounded-full bg-[#8ed461] pointer-events-none"
            />
            <span
              data-stage={coinStage}
              aria-hidden="true"
              className="narenj-coin-emblem relative w-9 h-9 rounded-full bg-[#f5e211] border-2 border-[#ff5c0c] inline-flex items-center justify-center shadow-[0_2px_0_0_#c74809]"
            >
              <span className="w-4 h-4 rounded-full bg-[#ff5c0c]/90 inline-block" />
            </span>
          </div>

          <div data-stage={coinStage} className="narenj-coin-value">
            <p className="text-xs text-[#686562]">پاداش تلاش و پیوستگی</p>
            <p className="text-base font-bold text-[#9e3908] tabular-nums">
              +{toPersianDigits(animatedEarned)} سکه · {medal.label}
            </p>
          </div>
        </div>
      </div>

      {/* V3 Page 11 Signature Centered Primary CTA + Quiet Secondary Links */}
      <div className="flex flex-col items-center gap-4">
        <V3PillButton
          type="button"
          size="lg"
          onClick={onReturnToTasks}
          className="min-w-[240px]"
        >
          {summary.fromAssignment ? 'بازگشت به تکلیف‌ها' : 'بازگشت به خانه یادگیری'}
        </V3PillButton>

        <div className="flex flex-wrap items-center justify-center gap-5 text-sm font-semibold text-[#686562]">
          {!summary.reachedMastery && (
            <button
              type="button"
              onClick={onPracticeAgain}
              className="inline-flex items-center gap-1.5 hover:text-[#ff5c0c] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ادامه تمرین برای رسیدن به امتیاز ۱۰۰</span>
            </button>
          )}
          <span aria-hidden="true" className="text-[#d5d5d4]">
            ·
          </span>
          <button
            type="button"
            onClick={onOpenProgress}
            className="hover:text-[#1d1d1b] transition-colors cursor-pointer"
          >
            مشاهده مسیر رشد من
          </button>
        </div>
      </div>
    </div>
  );
}
