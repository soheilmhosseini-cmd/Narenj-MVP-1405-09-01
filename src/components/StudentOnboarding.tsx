import React, { useState } from 'react';
import { Check, Compass, HelpCircle, Award, BookOpen } from 'lucide-react';
import { AVATAR_REGISTRY, StudentAccount, toPersianDigits } from '../data/narenjData';
import { NarenjBrandMark, V3PillButton, StickerCorrect, StickerSubmitted } from './V3Stickers';

interface StudentOnboardingProps {
  student: StudentAccount;
  onComplete: (avatarId: string) => void;
}

const TOUR_STEPS = [
  {
    id: 'home-task',
    title: 'اینجا خانه یادگیری توست',
    description:
      'هر وقت وارد نارنج بشوی، تکلیف‌های معلم و تمرینی که نیمه‌تمام گذاشتی دقیقاً جلوی چشم تو قرار می‌گیرد تا بدون سردرگمی ادامه بدهی.',
    actionHint: 'از دکمه «شروع تمرین» روی کارت تکلیف استفاده می‌کنی.',
    icon: BookOpen,
    accentBg: '#fff2eb',
    accentBorder: '#ffcbb1',
  },
  {
    id: 'practice-rules',
    title: 'تمرین بدون عجله و بدون استرس',
    description:
      'در جلسه تمرین هر بار فقط یک سوال می‌بینی. زمان‌سنج فقط رو به بالا می‌شمارد تا عجله نکنی، و هر وقت نیاز داشتی می‌توانی رایگان از «راهنما» کمک بگیری.',
    actionHint: 'استفاده از راهنما هیچ امتیازی از تو کم نمی‌کند!',
    icon: HelpCircle,
    accentBg: '#e9f5ff',
    accentBorder: '#c5d3e8',
  },
  {
    id: 'mastery-medals',
    title: 'رشد شخصی و مدال‌های تسلط',
    description:
      'در نارنج مسابقه فقط با خودت است! با هر پاسخ درست به امتیاز تسلط نزدیک‌تر می‌شوی: امتیاز ۸۰ مدال برنز، امتیاز ۹۰ مدال نقره و امتیاز ۱۰۰ مدال طلا.',
    actionHint: 'پس از هر سوال، توضیح آموزشی را می‌خوانی و بعد دکمه «سوال بعدی» را می‌زنی.',
    icon: Award,
    accentBg: '#f9f4ae',
    accentBorder: '#f5e211',
  },
];

export function StudentOnboarding({ student, onComplete }: StudentOnboardingProps) {
  const [phase, setPhase] = useState<'avatar' | 'tour'>(student.avatarId ? 'tour' : 'avatar');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(student.avatarId ?? 'girl-01');
  const [tourIndex, setTourIndex] = useState(0);

  const studentAvatars = AVATAR_REGISTRY.filter(
    (a) => a.category === 'girl' || a.category === 'boy'
  );
  const selectedAvatar = studentAvatars.find((a) => a.id === selectedAvatarId) ?? studentAvatars[0];
  const currentTourStep = TOUR_STEPS[tourIndex];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-[#e0dbce] bg-white">
        <div className="max-w-[1200px] mx-auto px-5 md:px-9 h-[76px] flex items-center justify-between gap-6">
          <NarenjBrandMark />
          <div className="flex items-center gap-3 text-sm font-semibold text-[#3c3c3c]">
            <span className={phase === 'avatar' ? 'text-[#ff5c0c]' : 'text-[#686562]'}>
              ۱. انتخاب آواتار
            </span>
            <span aria-hidden="true" className="text-[#d5d5d4]">
              /
            </span>
            <span className={phase === 'tour' ? 'text-[#ff5c0c]' : 'text-[#686562]'}>
              ۲. آشنایی با فضای نارنج
            </span>
          </div>
          <span className="text-sm text-[#686562] hidden sm:inline whitespace-nowrap">
            {student.firstName} · {student.className}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[960px] w-full mx-auto px-5 md:px-9 py-8 md:py-12">
        {phase === 'avatar' ? (
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2.5">
              <p className="text-sm font-semibold text-[#9e3908]">
                گام اول از دو گام
              </p>
              <h1 className="text-[30px] md:text-[36px] font-bold text-[#1d1d1b] leading-[1.35] text-balance">
                سلام {student.firstName}! شخصیت همراه خودت را انتخاب کن
              </h1>
              <p className="text-base text-[#3c3c3c]">
                این آواتار در فضای یادگیری و کارنامه شخصی تو نمایش داده می‌شود و هر زمان از تنظیمات قابل تغییر است.
              </p>
            </div>

            {/* Equal-Size Approved Avatar Grid (Spec §8 & COMPONENTS.md) */}
            <div
              role="radiogroup"
              aria-label="انتخاب آواتار دانش‌آموز"
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-5"
            >
              {studentAvatars.map((avatar) => {
                const isSelected = avatar.id === selectedAvatarId;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedAvatarId(avatar.id)}
                    className={`relative rounded-[24px] p-4 flex flex-col items-center gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#fff2eb] border-2 border-[#ff5c0c] shadow-[0_4px_0_0_#ffcbb1]'
                        : 'bg-[#f5f1e4] border-2 border-transparent hover:border-[#e0dbce]'
                    }`}
                  >
                    {isSelected && (
                      <span
                        className="absolute top-3 left-3 w-7 h-7 rounded-full bg-[#ff5c0c] text-white inline-flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    )}
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-white border-2 border-white shadow-sm">
                      <img
                        src={avatar.src}
                        alt={avatar.label}
                        className="w-full h-full object-cover object-top"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-sm font-semibold text-[#1d1d1b]">
                      {isSelected ? 'انتخاب شده' : avatar.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Action Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#e0dbce]">
              <div className="flex items-center gap-3">
                <img
                  src={selectedAvatar.src}
                  alt={selectedAvatar.label}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#ff5c0c]"
                  referrerPolicy="no-referrer"
                />
                <div className="text-sm">
                  <p className="font-bold text-[#1d1d1b]">{student.firstName} {student.lastName}</p>
                  <p className="text-[#686562]">{student.className}</p>
                </div>
              </div>
              <V3PillButton
                type="button"
                size="lg"
                onClick={() => setPhase('tour')}
              >
                ادامه به آشنایی با نارنج
              </V3PillButton>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <p className="text-sm font-semibold text-[#9e3908]">
                گام دوم · تور راهنمای سریع ({toPersianDigits(tourIndex + 1)} از {toPersianDigits(TOUR_STEPS.length)})
              </p>
              <h1 className="text-[28px] md:text-[34px] font-bold text-[#1d1d1b] leading-[1.35]">
                آماده شروع یادگیری در نارنج شو
              </h1>
            </div>

            {/* Step Progress Dots */}
            <div className="flex items-center justify-center gap-2.5" aria-label="پیشرفت راهنما">
              {TOUR_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setTourIndex(idx)}
                  aria-label={`مرحله ${toPersianDigits(idx + 1)}: ${step.title}`}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    idx === tourIndex
                      ? 'w-10 bg-[#ff5c0c]'
                      : idx < tourIndex
                      ? 'w-4 bg-[#8ed461]'
                      : 'w-4 bg-[#e0dbce]'
                  }`}
                />
              ))}
            </div>

            {/* Interactive Guided Tour Card */}
            <div className="narenj-cream-card p-6 md:p-9 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-4">
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] text-sm font-semibold text-[#1d1d1b]"
                  style={{
                    backgroundColor: currentTourStep.accentBg,
                    border: `1px solid ${currentTourStep.accentBorder}`,
                  }}
                >
                  <currentTourStep.icon className="w-4 h-4 text-[#ff5c0c]" />
                  <span>نکته {toPersianDigits(tourIndex + 1)}</span>
                </div>
                <h2 className="text-[24px] font-bold text-[#1d1d1b]">
                  {currentTourStep.title}
                </h2>
                <p className="text-base text-[#3c3c3c] leading-[1.8]">
                  {currentTourStep.description}
                </p>
                <div className="narenj-tray px-4 py-3.5 text-sm font-semibold text-[#1d1d1b] flex items-center gap-2.5 border border-[#e0dbce]">
                  <Compass className="w-5 h-5 text-[#2ba0ff] shrink-0" />
                  <span>{currentTourStep.actionHint}</span>
                </div>
              </div>

              <div className="md:col-span-5 flex flex-col items-center justify-center gap-4 bg-white rounded-[20px] p-6 border border-[#e0dbce]">
                {tourIndex === 0 && (
                  <img
                    src={selectedAvatar.src}
                    alt={selectedAvatar.label}
                    className="w-28 h-28 rounded-full object-cover border-4 border-[#fff2eb]"
                    referrerPolicy="no-referrer"
                  />
                )}
                {tourIndex === 1 && <StickerSubmitted className="w-28 h-28" />}
                {tourIndex === 2 && <StickerCorrect className="w-28 h-28" />}

                <div className="text-center">
                  <p className="text-sm font-bold text-[#1d1d1b]">
                    {tourIndex === 0 && `${student.firstName} · ${student.className}`}
                    {tourIndex === 1 && 'راهنما همیشه رایگان است'}
                    {tourIndex === 2 && '۸۰ برنز · ۹۰ نقره · ۱۰۰ طلا'}
                  </p>
                  <p className="text-xs text-[#686562] mt-1">
                    {tourIndex === 0 && 'تکلیف‌های امروزت در صفحه اول آماده‌اند'}
                    {tourIndex === 1 && 'زمان‌سنج بدون فشار و رو به بالا'}
                    {tourIndex === 2 && 'مسیر رشد شخصی بدون مقایسه با دیگران'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tour Controls */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <V3PillButton
                type="button"
                variant="secondary"
                arrowDirection="back"
                onClick={() => {
                  if (tourIndex === 0) {
                    setPhase('avatar');
                  } else {
                    setTourIndex((i) => i - 1);
                  }
                }}
              >
                {tourIndex === 0 ? 'تغییر آواتار' : 'نکته قبلی'}
              </V3PillButton>

              {tourIndex < TOUR_STEPS.length - 1 ? (
                <V3PillButton
                  type="button"
                  onClick={() => setTourIndex((i) => i + 1)}
                >
                  نکته بعدی
                </V3PillButton>
              ) : (
                <V3PillButton
                  type="button"
                  size="lg"
                  onClick={() => onComplete(selectedAvatarId)}
                >
                  ورود به خانه یادگیری
                </V3PillButton>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
