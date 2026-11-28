import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  LogOut,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  ActivePracticeState,
  DEMO_QUESTIONS_BY_SKILL,
  GridShapeOption,
  PracticeQuestion,
  SkillRecord,
  formatElapsedTime,
  normalizeDigitsToLatin,
  toPersianDigits,
} from '../data/narenjData';
import { MedalIcon, V3PillButton } from './V3Stickers';
import { SessionSummaryData } from './SessionSummary';
import { NarenjCelebrationBurst } from './NarenjCelebrationBurst';

interface PracticeSessionProps {
  skill: SkillRecord;
  initialState: ActivePracticeState;
  onUpdateActiveSession: (next: ActivePracticeState) => void;
  onFinishSession: (summary: SessionSummaryData) => void;
  onPauseAndExit: (savedState: ActivePracticeState) => void;
}

/**
 * Renders an interactive SVG unit-square grid shape for area comparison questions
 */
function AreaGridGraphic({
  shape,
  highlightCells = false,
  compact = false,
}: {
  shape: GridShapeOption;
  highlightCells?: boolean;
  compact?: boolean;
}) {
  const cellSize = compact ? 26 : 32;
  const pad = 6;
  const width = shape.cols * cellSize + pad * 2;
  const height = shape.rows * cellSize + pad * 2;
  const filledSet = new Set(shape.cells.map(([r, c]) => `${r}-${c}`));

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mx-auto block select-none"
      role="img"
      aria-label={`${shape.label} با ${toPersianDigits(shape.cells.length)} مربع واحد`}
    >
      <rect
        x="1"
        y="1"
        width={width - 2}
        height={height - 2}
        rx="12"
        fill="#ffffff"
        stroke="#e0dbce"
        strokeWidth="1.5"
      />
      {Array.from({ length: shape.rows }).map((_, r) =>
        Array.from({ length: shape.cols }).map((__, c) => {
          const isFilled = filledSet.has(`${r}-${c}`);
          return (
            <rect
              key={`${r}-${c}`}
              x={pad + c * cellSize + 1.5}
              y={pad + r * cellSize + 1.5}
              width={cellSize - 3}
              height={cellSize - 3}
              rx="5"
              fill={isFilled ? shape.color : '#f5f1e4'}
              fillOpacity={isFilled ? (highlightCells ? 1 : 0.92) : 0.65}
              stroke={isFilled ? '#1d1d1b' : '#d5d5d4'}
              strokeOpacity={isFilled ? 0.25 : 0.8}
              strokeWidth="1.2"
            />
          );
        })
      )}
    </svg>
  );
}

/**
 * STU-04 Practice Session
 * Strictly enforces every binding rule from Naranj Product Source of Truth (§5 & §16):
 * - One question visible at a time
 * - Forward-only progression (no previous button, no editing submitted answer, no retry)
 * - Count-up elapsed timer (never countdown)
 * - Hint does NOT reduce SmartScore
 * - Explicit Continue button after feedback (never auto-advances)
 * - Safe Exit preserves confirmed answers and supports resume
 */
export function PracticeSession({
  skill,
  initialState,
  onUpdateActiveSession,
  onFinishSession,
  onPauseAndExit,
}: PracticeSessionProps) {
  const questions: PracticeQuestion[] = DEMO_QUESTIONS_BY_SKILL[skill.id] ?? [];

  const [session, setSession] = useState<ActivePracticeState>(initialState);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [shadedIndices, setShadedIndices] = useState<number[]>([]);
  const [numericText, setNumericText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [showHint, setShowHint] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    isCorrect: boolean;
    delta: number;
  } | null>(null);
  const [goalMilestone, setGoalMilestone] = useState<{
    tier: 'bronze' | 'silver' | 'gold';
    label: string;
    score: number;
    burstKey: number;
  } | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  const currentQuestion = questions[session.currentIndex];
  const isLastQuestion = session.currentIndex >= questions.length - 1;

  // Elapsed count-up timer (pauses while exit modal is open)
  useEffect(() => {
    if (showExitModal || !currentQuestion) return;
    const timer = window.setInterval(() => {
      setSession((prev) => {
        const updated = { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
        return updated;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [showExitModal, currentQuestion]);

  // Empty-state guard per STU-04 spec (never render a blank session)
  if (!currentQuestion) {
    return (
      <div className="max-w-[720px] mx-auto py-12 px-4">
        <div className="narenj-cream-card p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#1d1d1b]">
            سوالی برای این مهارت ثبت نشده است
          </h1>
          <p className="text-base text-[#3c3c3c]">
            محتوای تمرین «{skill.title}» در حال تکمیل است. می‌توانی مهارت دیگری را از کتابخانه انتخاب کنی.
          </p>
          <V3PillButton type="button" onClick={() => onPauseAndExit(session)}>
            بازگشت به کتابخانه مهارت‌ها
          </V3PillButton>
        </div>
      </div>
    );
  }

  const toggleFractionCell = (idx: number) => {
    if (submittedResult) return; // Immutable after submit
    setValidationError(null);
    setShadedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const evaluateCurrentAnswer = (): { valid: boolean; isCorrect: boolean; error?: string } => {
    if (currentQuestion.kind === 'area_grid_select') {
      if (!selectedChoice) {
        return { valid: false, isCorrect: false, error: 'لطفاً یکی از شکل‌ها را انتخاب کن.' };
      }
      return { valid: true, isCorrect: selectedChoice === currentQuestion.correctGridId };
    }

    if (currentQuestion.kind === 'multiple_choice') {
      if (!selectedChoice) {
        return { valid: false, isCorrect: false, error: 'لطفاً یکی از گزینه‌ها را انتخاب کن.' };
      }
      return { valid: true, isCorrect: selectedChoice === currentQuestion.correctOptionId };
    }

    if (currentQuestion.kind === 'fraction_shade') {
      if (shadedIndices.length === 0) {
        return {
          valid: false,
          isCorrect: false,
          error: 'لطفاً حداقل یک خانه از شکل را رنگ کن.',
        };
      }
      const target = currentQuestion.fractionConfig?.targetParts ?? 0;
      return { valid: true, isCorrect: shadedIndices.length === target };
    }

    // numeric_input
    const normalized = normalizeDigitsToLatin(numericText);
    if (!normalized) {
      return { valid: false, isCorrect: false, error: 'لطفاً پاسخ عددی خود را بنویس.' };
    }
    const accepted = currentQuestion.correctNumericAnswers ?? [];
    return { valid: true, isCorrect: accepted.includes(normalized) };
  };

  const handleSubmitAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submittedResult) return; // Prevent duplicate submission

    const check = evaluateCurrentAnswer();
    if (!check.valid) {
      setValidationError(check.error ?? 'لطفاً پاسخ خود را کامل کن.');
      return;
    }

    setValidationError(null);

    // SmartScore progression: Hint usage NEVER penalizes score (Binding rule §5)
    const remainingQuestions = Math.max(1, questions.length - session.currentIndex);
    const gain = check.isCorrect
      ? Math.max(18, Math.ceil((100 - session.smartScore) / remainingQuestions))
      : 0;
    const drop = check.isCorrect ? 0 : Math.min(session.smartScore, 6);
    const nextSmartScore = Math.max(0, Math.min(100, session.smartScore + gain - drop));

    const nextSession: ActivePracticeState = {
      ...session,
      answeredCount: session.answeredCount + 1,
      correctCount: session.correctCount + (check.isCorrect ? 1 : 0),
      needsAttentionCount: session.needsAttentionCount + (check.isCorrect ? 0 : 1),
      smartScore: nextSmartScore,
      history: [
        ...session.history,
        {
          questionId: currentQuestion.id,
          isCorrect: check.isCorrect,
          usedHint: showHint,
        },
      ],
    };

    setSession(nextSession);
    onUpdateActiveSession(nextSession);
    setSubmittedResult({ isCorrect: check.isCorrect, delta: check.isCorrect ? gain : -drop });

    // Detect SmartScore goal milestones (80 Bronze, 90 Silver, 100 Gold mastery)
    if (check.isCorrect) {
      if (session.smartScore < 100 && nextSmartScore >= 100) {
        setGoalMilestone({
          tier: 'gold',
          label: 'تسلط کامل! به هدف امتیاز ۱۰۰ و مدال طلا رسیدی',
          score: 100,
          burstKey: Date.now(),
        });
      } else if (session.smartScore < 90 && nextSmartScore >= 90) {
        setGoalMilestone({
          tier: 'silver',
          label: 'عالی بود! به هدف امتیاز ۹۰ و مدال نقره رسیدی',
          score: 90,
          burstKey: Date.now(),
        });
      } else if (session.smartScore < 80 && nextSmartScore >= 80) {
        setGoalMilestone({
          tier: 'bronze',
          label: 'آفرین! به هدف امتیاز ۸۰ و مدال برنز رسیدی',
          score: 80,
          burstKey: Date.now(),
        });
      } else {
        setGoalMilestone(null);
      }
    } else {
      setGoalMilestone(null);
    }
  };

  const buildSummary = (state: ActivePracticeState): SessionSummaryData => {
    const coinsEarned =
      state.correctCount * 15 + (state.smartScore >= 100 ? 40 : state.smartScore >= 80 ? 20 : 5);
    return {
      skill,
      answeredCount: state.answeredCount,
      correctCount: state.correctCount,
      needsAttentionCount: state.needsAttentionCount,
      finalSmartScore: state.smartScore,
      elapsedSeconds: state.elapsedSeconds,
      coinsEarned: state.answeredCount === 0 ? 0 : coinsEarned,
      fromAssignment: Boolean(state.assignmentId),
      reachedMastery: state.smartScore >= 100,
    };
  };

  const handleContinue = () => {
    if (!submittedResult) return;

    // Session ends at SmartScore 100 OR when all demo questions in the skill are completed
    if (session.smartScore >= 100 || isLastQuestion) {
      onFinishSession(buildSummary(session));
      return;
    }

    const nextState: ActivePracticeState = {
      ...session,
      currentIndex: session.currentIndex + 1,
    };
    setSession(nextState);
    onUpdateActiveSession(nextState);
    setSelectedChoice(null);
    setShadedIndices([]);
    setNumericText('');
    setShowHint(false);
    setSubmittedResult(null);
    setGoalMilestone(null);
    setValidationError(null);
  };

  return (
    <div className="max-w-[880px] mx-auto py-4 md:py-7 px-4">
      {/* Compact Secondary Session Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-[#e0dbce]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#686562]">
            <span>{skill.topicTitle}</span>
          </div>
          <h1 className="text-lg md:text-xl font-bold text-[#1d1d1b] mt-0.5 truncate">
            {skill.title}
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Always-reachable Safe Exit */}
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="h-10 px-3.5 rounded-[14px] border border-[#e0dbce] bg-white hover:bg-[#f5f1e4] text-sm font-semibold text-[#3c3c3c] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج امن</span>
          </button>

          {/* Count-up Elapsed Timer (Positioned on the left with custom Narenj V3 stopwatch design) */}
          <div
            className="h-10 pl-3.5 pr-1.5 rounded-[14px] bg-[#f5f1e4] border border-[#e0dbce] inline-flex items-center gap-2.5 shrink-0"
            title="زمان سپری‌شده (بدون محدودیت زمانی)"
          >
            <span
              className="w-7 h-7 rounded-[10px] bg-white border border-[#e0dbce]/80 inline-flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Top crown button */}
                <path
                  d="M9.5 2.75H14.5"
                  stroke="#ff5c0c"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 2.75V5.25"
                  stroke="#ff5c0c"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Side reset stem */}
                <path
                  d="M17.8 6.4L19.4 4.8"
                  stroke="#ff9d6d"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                />
                {/* Main dial body */}
                <circle
                  cx="12"
                  cy="13.25"
                  r="7.75"
                  fill="#fff2eb"
                  stroke="#ff5c0c"
                  strokeWidth="2"
                />
                {/* Subtle dial quarter ticks */}
                <circle cx="12" cy="8.2" r="0.85" fill="#ff9d6d" />
                <circle cx="17.05" cy="13.25" r="0.85" fill="#ff9d6d" />
                <circle cx="12" cy="18.3" r="0.85" fill="#ff9d6d" />
                <circle cx="6.95" cy="13.25" r="0.85" fill="#ff9d6d" />
                {/* Active stopwatch hand */}
                <path
                  d="M12 13.25L14.85 10.4"
                  stroke="#1d1d1b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="13.25" r="1.45" fill="#ff5c0c" />
              </svg>
            </span>
            <span
              dir="ltr"
              className="text-sm font-bold text-[#1d1d1b] tracking-wide tabular-nums leading-none"
            >
              {formatElapsedTime(session.elapsedSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Subtle SmartScore Progress Bar with 80 / 90 / 100 Medal Markers & Goal Burst */}
      <div className="mb-6 relative">
        <div className="relative h-2.5 w-full rounded-full bg-[#f5f1e4] overflow-hidden border border-[#e0dbce]/80">
          <div
            className="h-full rounded-full bg-[#ff5c0c] transition-all duration-300"
            style={{ width: `${Math.max(4, session.smartScore)}%` }}
          />
          <span
            className="absolute top-0 bottom-0 w-0.5 bg-white/90"
            style={{ insetInlineStart: '80%' }}
            title="مدال برنز (۸۰)"
          />
          <span
            className="absolute top-0 bottom-0 w-0.5 bg-white/90"
            style={{ insetInlineStart: '90%' }}
            title="مدال نقره (۹۰)"
          />
        </div>

        {goalMilestone && (
          <div
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 w-10 h-10 -ms-5"
            style={{ insetInlineStart: `${Math.min(96, goalMilestone.score)}%` }}
          >
            <NarenjCelebrationBurst
              triggerKey={goalMilestone.burstKey}
              variant="goal"
              emphasized={goalMilestone.tier === 'gold'}
            />
          </div>
        )}
      </div>

      {/* Primary Question Stage (Zero-Jump Container) */}
      <section className="narenj-cream-card p-6 md:p-8 space-y-6">
        {/* Prompt */}
        <div className="space-y-3">
          <p className="text-lg md:text-[21px] font-bold text-[#1d1d1b] leading-[1.6]">
            {currentQuestion.prompt}
          </p>
          {currentQuestion.mathExpr && (
            <div
              dir="ltr"
              className="inline-block px-5 py-2.5 rounded-[16px] bg-white border border-[#e0dbce] text-xl md:text-2xl font-bold text-[#1d1d1b] tracking-wider tabular-nums"
            >
              {currentQuestion.mathExpr}
            </div>
          )}
        </div>

        {/* Question Type 1: Area Grid Comparison (V3 Signature Exercise) */}
        {currentQuestion.kind === 'area_grid_select' &&
          currentQuestion.referenceShape &&
          currentQuestion.gridOptions && (
            <div className="space-y-6">
              {/* Reference Shape */}
              <div className="bg-white rounded-[20px] p-5 border border-[#e0dbce] flex flex-col sm:flex-row items-center justify-center gap-6 narenj-drafting-grid">
                <AreaGridGraphic shape={currentQuestion.referenceShape} />
                <div className="text-center sm:text-start space-y-1">
                  <p className="text-base font-bold text-[#1d1d1b]">
                    {currentQuestion.referenceShape.label}
                  </p>
                  <p className="text-sm text-[#686562]">
                    مساحت این شکل را با شمارش مربع‌های رنگی پیدا کن.
                  </p>
                </div>
              </div>

              {/* Selectable Grid Options */}
              <div
                role="radiogroup"
                aria-label="گزینه‌های شکل"
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {currentQuestion.gridOptions.map((opt) => {
                  const isSelected = selectedChoice === opt.id;
                  const isCorrectOpt = opt.id === currentQuestion.correctGridId;
                  let borderClass = 'border-[#e0dbce] bg-white hover:border-[#ff9d6d]';
                  if (submittedResult) {
                    if (isCorrectOpt) {
                      borderClass = 'border-[#8ed461] bg-[#eef9e6] border-2';
                    } else if (isSelected && !isCorrectOpt) {
                      borderClass = 'border-[#ff705d] bg-[#fff2eb] border-2';
                    } else {
                      borderClass = 'border-[#e0dbce] bg-white/70 opacity-75';
                    }
                  } else if (isSelected) {
                    borderClass = 'border-[#ff5c0c] bg-[#fff2eb] border-2 shadow-sm';
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={Boolean(submittedResult)}
                      onClick={() => {
                        setSelectedChoice(opt.id);
                        setValidationError(null);
                      }}
                      className={`rounded-[20px] p-4 border transition-all flex flex-col items-center gap-3 ${borderClass} ${
                        submittedResult ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      <AreaGridGraphic shape={opt} highlightCells={isSelected} compact />
                      <span className="text-base font-bold text-[#1d1d1b]">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        {/* Question Type 2: Interactive Fraction Area Model Shader */}
        {currentQuestion.kind === 'fraction_shade' && currentQuestion.fractionConfig && (
          <div className="bg-white rounded-[20px] p-6 border border-[#e0dbce] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[#3c3c3c]">
                {currentQuestion.fractionConfig.shapeLabel} — برای رنگ کردن یا پاک کردن روی هر خانه کلیک کن
              </span>
              <span className="text-sm font-bold text-[#ff5c0c] tabular-nums">
                {toPersianDigits(shadedIndices.length)} از{' '}
                {toPersianDigits(currentQuestion.fractionConfig.totalParts)} خانه رنگ شده
              </span>
            </div>

            <div
              className="grid gap-3 max-w-md mx-auto py-3"
              style={{
                gridTemplateColumns: `repeat(${currentQuestion.fractionConfig.cols}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: currentQuestion.fractionConfig.totalParts }).map((_, idx) => {
                const isShaded = shadedIndices.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={Boolean(submittedResult)}
                    aria-pressed={isShaded}
                    aria-label={`خانه ${toPersianDigits(idx + 1)} — ${
                      isShaded ? 'رنگ شده' : 'خالی'
                    }`}
                    onClick={() => toggleFractionCell(idx)}
                    className={`h-20 rounded-[14px] border-2 font-bold text-base transition-all tabular-nums ${
                      isShaded
                        ? 'bg-[#2ba0ff] border-[#1b6fb8] text-white shadow-inner'
                        : 'bg-[#f5f1e4] border-[#d5d5d4] text-[#686562] hover:border-[#2ba0ff]'
                    } ${submittedResult ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {toPersianDigits(idx + 1)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Question Type 3: Multiple Choice */}
        {currentQuestion.kind === 'multiple_choice' && currentQuestion.options && (
          <div role="radiogroup" aria-label="گزینه‌های پاسخ" className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedChoice === opt.id;
              const isCorrectOpt = opt.id === currentQuestion.correctOptionId;
              let cardStyle = 'bg-white border-[#e0dbce] hover:border-[#ff9d6d]';

              if (submittedResult) {
                if (isCorrectOpt) {
                  cardStyle = 'bg-[#eef9e6] border-[#8ed461] border-2';
                } else if (isSelected && !isCorrectOpt) {
                  cardStyle = 'bg-[#fff2eb] border-[#ff705d] border-2';
                } else {
                  cardStyle = 'bg-white/70 border-[#e0dbce] opacity-75';
                }
              } else if (isSelected) {
                cardStyle = 'bg-[#fff2eb] border-[#ff5c0c] border-2';
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={Boolean(submittedResult)}
                  onClick={() => {
                    setSelectedChoice(opt.id);
                    setValidationError(null);
                  }}
                  className={`w-full min-h-[56px] px-4 py-3.5 rounded-[16px] border text-start flex items-center gap-3.5 transition-all ${cardStyle} ${
                    submittedResult ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-full text-sm font-bold inline-flex items-center justify-center shrink-0 tabular-nums ${
                      isSelected
                        ? 'bg-[#ff5c0c] text-white'
                        : 'bg-[#f5f1e4] text-[#3c3c3c]'
                    }`}
                  >
                    {toPersianDigits(idx + 1)}
                  </span>
                  <span className="text-base font-semibold text-[#1d1d1b]">{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Question Type 4: Numeric Input (LTR inside RTL per §16.10) */}
        {currentQuestion.kind === 'numeric_input' && (
          <form onSubmit={handleSubmitAnswer} className="bg-white rounded-[20px] p-5 border border-[#e0dbce]">
            <label
              htmlFor="numeric-answer"
              className="block text-sm font-semibold text-[#3c3c3c] mb-2"
            >
              پاسخ عددی خود را وارد کن (اعداد فارسی یا انگلیسی هر دو پذیرفته می‌شوند):
            </label>
            <div className="flex items-center gap-3 max-w-sm">
              <input
                id="numeric-answer"
                type="text"
                inputMode="numeric"
                dir="ltr"
                disabled={Boolean(submittedResult)}
                value={numericText}
                onChange={(e) => {
                  setNumericText(e.target.value);
                  setValidationError(null);
                }}
                placeholder={currentQuestion.numericPlaceholder ?? 'پاسخ را بنویس'}
                className="flex-1 h-14 px-4 rounded-[16px] border-2 border-[#e0dbce] bg-[#faf9f6] text-xl font-bold text-[#1d1d1b] text-left tabular-nums focus:border-[#2ba0ff] focus:bg-white disabled:opacity-75"
              />
              {currentQuestion.numericUnit && (
                <span className="text-base font-semibold text-[#3c3c3c] whitespace-nowrap">
                  {currentQuestion.numericUnit}
                </span>
              )}
            </div>
          </form>
        )}

        {/* Hint Panel (Zero-Penalty per Binding Rule §5) */}
        {showHint && (
          <div className="rounded-[18px] bg-[#f9f4ae] border border-[#f5e211] p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-[#9e3908] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#1d1d1b]">
                راهنمای گام‌به‌گام (بدون کسر امتیاز)
              </p>
              <p className="text-sm text-[#3c3c3c]">{currentQuestion.hint}</p>
            </div>
          </div>
        )}

        {/* Validation Alert */}
        {validationError && (
          <p role="alert" className="text-sm font-semibold text-[#9e3908]">
            {validationError}
          </p>
        )}

        {/* Explicit Feedback Region (Never auto-advances; shows correct answer & explanation) */}
        {submittedResult && (
          <div
            role="status"
            aria-live="polite"
            className={`relative rounded-[20px] p-5 border-2 space-y-3 ${
              submittedResult.isCorrect
                ? 'bg-[#eef9e6] border-[#8ed461] narenj-goal-scale-up'
                : 'bg-[#fff2eb] border-[#ff705d]'
            }`}
          >
            {goalMilestone && (
              <div className="relative narenj-tray border border-[#e0dbce] px-4 py-3 flex items-center gap-3 narenj-goal-scale-up">
                <div className="relative w-9 h-9 inline-flex items-center justify-center shrink-0">
                  <NarenjCelebrationBurst
                    triggerKey={`badge-${goalMilestone.burstKey}`}
                    variant="goal"
                    emphasized={goalMilestone.tier === 'gold'}
                  />
                  <MedalIcon tier={goalMilestone.tier} size={32} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#ff5c0c]">{goalMilestone.label}</p>
                  <p className="text-xs text-[#686562]">
                    این دستاورد در مسیر رشد و مدال‌های تو ثبت شد.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {submittedResult.isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-[#3f7a1d] shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-[#ec5c17] shrink-0" />
                )}
                <h2 className="text-lg font-bold text-[#1d1d1b]">
                  {submittedResult.isCorrect
                    ? 'آفرین! پاسخ تو کاملاً درست بود'
                    : 'نیازمند توجه — بیایید با هم ببینیم'}
                </h2>
              </div>
              {submittedResult.isCorrect && (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-[#3f7a1d] tabular-nums">
                  <Sparkles className="w-4 h-4" />+{toPersianDigits(submittedResult.delta)} امتیاز هوشمند
                </span>
              )}
            </div>

            {!submittedResult.isCorrect && (
              <p className="text-sm font-bold text-[#9e3908]">
                پاسخ درست: {currentQuestion.correctAnswerDisplay}
              </p>
            )}
            <p className="text-sm md:text-base text-[#3c3c3c] leading-[1.75]">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Action Row: Submit vs Explicit Continue + Zero-Penalty Hint */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#e0dbce]">
          {!submittedResult ? (
            <>
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                className="h-11 px-4 rounded-[50px] bg-white border border-[#e0dbce] hover:border-[#f5e211] hover:bg-[#f9f4ae]/40 text-sm font-semibold text-[#3c3c3c] inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-[#ff5c0c]" />
                <span>{showHint ? 'بستن راهنما' : 'راهنما (بدون کسر امتیاز)'}</span>
              </button>

              <V3PillButton type="button" size="lg" onClick={() => handleSubmitAnswer()}>
                ثبت پاسخ
              </V3PillButton>
            </>
          ) : (
            <>
              <span className="text-xs text-[#686562]">
                پاسخ ثبت شده قابل ویرایش نیست؛ برای ادامه دکمه مقابل را بزن.
              </span>
              <V3PillButton type="button" size="lg" onClick={handleContinue}>
                {session.smartScore >= 100 || isLastQuestion
                  ? 'پایان و مشاهده نتیجه'
                  : 'سوال بعدی'}
              </V3PillButton>
            </>
          )}
        </div>
      </section>

      {/* Safe Exit Confirmation Modal (Spec §16.7) */}
      {showExitModal && (
        <div
          className="fixed inset-0 z-50 bg-[#1d1d1b]/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="safe-exit-title"
        >
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 border border-[#e0dbce] shadow-xl space-y-5">
            <h2 id="safe-exit-title" className="text-xl font-bold text-[#1d1d1b]">
              خروج امن از جلسه تمرین
            </h2>
            <p className="text-sm text-[#3c3c3c] leading-[1.8]">
              {session.answeredCount > 0
                ? `تا الان ${toPersianDigits(session.answeredCount)} پاسخ از تو ذخیره شده است. می‌توانی تمرین را متوقف کنی و بعداً از همین نقطه ادامه بدهی، یا همین الان نتیجه تمرین را ببینی.`
                : 'هنوز پاسخی ثبت نکرده‌ای. اگر خارج شوی، هر زمان بخواهی می‌توانی دوباره این مهارت را شروع کنی.'}
            </p>
            <div className="flex flex-col gap-2.5">
              <V3PillButton
                type="button"
                onClick={() => {
                  setShowExitModal(false);
                  onFinishSession(buildSummary(session));
                }}
                className="w-full"
              >
                پایان جلسه و مشاهده نتیجه
              </V3PillButton>
              <V3PillButton
                type="button"
                variant="secondary"
                showArrow={false}
                onClick={() => {
                  setShowExitModal(false);
                  onPauseAndExit(session);
                }}
                className="w-full"
              >
                ذخیره و ادامه در زمان دیگر
              </V3PillButton>
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="h-10 text-sm font-semibold text-[#686562] hover:text-[#1d1d1b] cursor-pointer"
              >
                بازگشت به سوال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
