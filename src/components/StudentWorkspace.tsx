import React, { useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Contrast,
  Home,
  LogOut,
  Search,
  Settings,
  TrendingUp,
  X,
  CheckCircle2,
  Clock,
  Coins,
  ArrowLeftRight,
  Compass,
  ZoomIn,
} from 'lucide-react';
import {
  ActivePracticeState,
  AssignmentRecord,
  AVATAR_REGISTRY,
  MASTERY_META,
  MATH_TOPICS,
  MasteryLevel,
  SKILLS_CATALOG,
  SkillProgress,
  SkillRecord,
  StudentAccount,
  formatElapsedTime,
  getMasteryLevel,
  getMedalForScore,
  toPersianDigits,
} from '../data/narenjData';
import {
  MedalIcon,
  StickerSubmitted,
  V3PillButton,
} from './V3Stickers';
import { PracticeSession } from './PracticeSession';
import { SessionSummary, SessionSummaryData } from './SessionSummary';
import { DrawerTrayGroup, MobileNavDrawer } from './MobileNavDrawer';
import { StudentMasteryChart } from './StudentMasteryChart';

type StudentView = 'home' | 'library' | 'progress' | 'practice' | 'summary';

interface StudentWorkspaceProps {
  student: StudentAccount;
  progressMap: Record<string, SkillProgress>;
  assignments: AssignmentRecord[];
  activeSession: ActivePracticeState | null;
  highContrast: boolean;
  largeText: boolean;
  onToggleHighContrast: () => void;
  onToggleLargeText: () => void;
  onChangeAvatar: (avatarId: string) => void;
  onReplayOnboarding: () => void;
  onStartOrResumeSkill: (skillId: string, assignmentId?: string) => void;
  onUpdateActiveSession: (state: ActivePracticeState) => void;
  onCompleteSession: (summary: SessionSummaryData) => void;
  onPauseSession: (state: ActivePracticeState) => void;
  onSwitchToTeacherDemo: () => void;
  onLogout: () => void;
}

export function StudentWorkspace({
  student,
  progressMap,
  assignments,
  activeSession,
  highContrast,
  largeText,
  onToggleHighContrast,
  onToggleLargeText,
  onChangeAvatar,
  onReplayOnboarding,
  onStartOrResumeSkill,
  onUpdateActiveSession,
  onCompleteSession,
  onPauseSession,
  onSwitchToTeacherDemo,
  onLogout,
}: StudentWorkspaceProps) {
  const [view, setView] = useState<StudentView>('home');
  const [lastSummary, setLastSummary] = useState<SessionSummaryData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2);

  // Skill Library state (STU-02)
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | MasteryLevel>('all');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({
    D: true,
    A: true,
    B: false,
    C: false,
  });

  const studentAssignments = useMemo(
    () =>
      assignments.filter(
        (a) =>
          a.classId === 'cls-sarv' &&
          (a.recipientIds === 'all' || a.recipientIds.includes(student.id))
      ),
    [assignments, student.id]
  );

  const primaryAssignment = studentAssignments[0];

  const practiceSkill =
    SKILLS_CATALOG.find((s) => s.id === activeSession?.skillId) ?? SKILLS_CATALOG[0];

  const handleLaunchSkill = (skillId: string, assignmentId?: string) => {
    onStartOrResumeSkill(skillId, assignmentId);
    setView('practice');
    setDrawerOpen(false);
  };

  const handleSessionFinished = (summary: SessionSummaryData) => {
    onCompleteSession(summary);
    setLastSummary(summary);
    setView('summary');
  };

  const handleSessionPaused = (saved: ActivePracticeState) => {
    onPauseSession(saved);
    setView('home');
  };

  // Filtered skills for STU-02 Library
  const filteredSkills = useMemo(() => {
    return SKILLS_CATALOG.filter((skill) => {
      if (topicFilter !== 'all' && skill.topicCode !== topicFilter) return false;
      const prog = progressMap[skill.id];
      const level = getMasteryLevel(prog?.smartScore ?? 0, prog?.questionsAnswered ?? 0);
      if (statusFilter !== 'all' && level !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim();
        return (
          skill.title.includes(q) ||
          skill.topicTitle.includes(q) ||
          skill.subtopicTitle.includes(q) ||
          skill.objective.includes(q)
        );
      }
      return true;
    });
  }, [topicFilter, statusFilter, searchQuery, progressMap]);

  // Overall mastery counts (Personal Growth — no public leaderboard per §6)
  const masteryStats = useMemo(() => {
    let gold = 0;
    let silver = 0;
    let bronze = 0;
    let totalAnswered = 0;
    let totalSeconds = 0;
    for (const skill of SKILLS_CATALOG) {
      const p = progressMap[skill.id];
      if (!p) continue;
      totalAnswered += p.questionsAnswered;
      totalSeconds += p.elapsedSeconds;
      if (p.smartScore >= 100) gold += 1;
      else if (p.smartScore >= 90) silver += 1;
      else if (p.smartScore >= 80) bronze += 1;
    }
    return { gold, silver, bronze, totalAnswered, totalSeconds };
  }, [progressMap]);

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Narenj Design System V3 Page 11 Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
        {/* Sharp-Cornered Orange Menu Square Flush Top-Right (Morphs 3-line <-> X) */}
        <button
          type="button"
          onClick={() => setDrawerOpen((prev) => !prev)}
          data-open={drawerOpen ? 'true' : 'false'}
          aria-expanded={drawerOpen}
          aria-label={drawerOpen ? 'بستن منوی ناوبری' : 'باز کردن منوی ناوبری'}
          className="narenj-menu-trigger top-0 right-0 w-16 h-16 sm:w-[78px] sm:h-[78px] rounded-none inline-flex items-center justify-center shrink-0 cursor-pointer z-10"
        >
          <span className="narenj-hamburger" aria-hidden="true">
            <span className="narenj-hamburger-bar narenj-hamburger-bar--1" />
            <span className="narenj-hamburger-bar narenj-hamburger-bar--2" />
            <span className="narenj-hamburger-bar narenj-hamburger-bar--3" />
          </span>
        </button>

        <div className="max-w-[1200px] mx-auto pr-[76px] sm:pr-[92px] min-[1240px]:pr-[72px] min-[1280px]:pr-[52px] min-[1312px]:pr-9 pl-5 md:pl-9 h-16 sm:h-[78px] flex items-center justify-between gap-4">
          {/* RTL Start Zone: Aligned with right edge of inner content components */}
          <div className="flex items-center gap-3 md:gap-5 min-w-0">
            <div className="flex items-center gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="w-11 h-11 rounded-full overflow-hidden shrink-0 cursor-pointer"
                title="تغییر آواتار و تنظیمات"
              >
                <img
                  src="/images/ui/ui-17.svg"
                  alt={`${student.firstName} ${student.lastName}`}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </button>
              <div className="min-w-0">
                <div className="flex flex-col items-start gap-0.5 whitespace-nowrap leading-tight">
                  <span className="text-sm font-bold text-[#1d1d1b]">{student.firstName}</span>
                  <span className="text-xs font-semibold text-[#686562] hidden sm:inline">
                    {student.className} / معلم: خانم رضایی
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RTL End Zone: Official V3 Narenj Brand Mark aligned with left edge of inner content */}
          <button
            type="button"
            onClick={() => {
              if (view !== 'practice') setView('home');
            }}
            className="cursor-pointer shrink-0 inline-flex items-center"
            aria-label="بازگشت به خانه نارنج"
          >
            <img
              src="/images/ui/ui-18.svg"
              alt="نارنج"
              className="h-11 w-auto object-contain block"
              referrerPolicy="no-referrer"
            />
          </button>
        </div>
      </header>

      {/* V3 Page 11 Floating Left Accessibility & Utility Rail (Official SVGs 19–22 with Curtain Hover Motion) */}
      <aside
        aria-label="ابزارهای دسترس‌پذیری و اعلان‌ها"
        className="hidden xl:flex flex-col items-start gap-1 fixed left-0 top-1/2 -translate-y-1/2 z-20"
      >
        <button
          type="button"
          onClick={() => {
            setShowNotifications((v) => !v);
            setUnreadNotifications(0);
          }}
          data-active={showNotifications ? 'true' : 'false'}
          aria-label="اعلان‌ها"
          title="اعلان‌ها"
          className="narenj-rail-btn inline-flex items-center justify-center cursor-pointer overflow-visible"
        >
          <span className="narenj-rail-btn__curtain" aria-hidden="true" />
          <svg
            viewBox="0 0 25.5 25.5"
            className="narenj-rail-btn__icon w-14 h-14 block"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9.7,10.8c0.1-1.2,1.1-2.1,2.2-2.1l0.3,0l0-0.4c0-0.3,0.2-0.5,0.5-0.5c0.3,0,0.5,0.2,0.5,0.5l0,0.4l0.3,0c1.2,0,2.1,0.9,2.2,2.1l0.1,1.9c0,0.7,0.3,1.4,0.7,2c0.4,0.5,0,1.3-0.6,1.3l-1.8,0.2l0,0.6c0,0.8-0.7,1.4-1.5,1.4c-0.8,0-1.4-0.7-1.4-1.5l0-0.6l-1.8-0.2c-0.6-0.1-1-0.8-0.6-1.3c0.4-0.6,0.6-1.3,0.7-2L9.7,10.8z M11.9,9.5c-0.8,0-1.4,0.6-1.4,1.3l-0.1,1.9c-0.1,0.9-0.3,1.7-0.8,2.4c0,0,0,0.1,0,0.1l2,0.2c0.8,0.1,1.6,0.1,2.4,0l2-0.2c0,0,0.1-0.1,0-0.1c-0.5-0.7-0.8-1.5-0.8-2.4L15,10.8c0-0.8-0.7-1.3-1.4-1.3L11.9,9.5z M12.7,17.4c-0.4,0-0.7-0.3-0.7-0.7l0-0.4l1.3,0l0,0.4C13.4,17.1,13.1,17.4,12.7,17.4z"
            />
            <path
              fill="currentColor"
              d="M15.7,7.4c-0.2,0.1-0.2,0.4,0,0.6l0.7,0.8c0.3,0.3,0.4,0.7,0.4,1.1l0,1.4c0,0.2,0.2,0.4,0.4,0.4c0.2,0,0.4-0.2,0.4-0.4l0-1.4c0-0.6-0.2-1.2-0.6-1.6l-0.7-0.8C16.2,7.3,15.9,7.3,15.7,7.4z"
            />
          </svg>
          {unreadNotifications > 0 && (
            <span className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-[#ff5c0c] text-white text-[11px] font-bold inline-flex items-center justify-center tabular-nums">
              {toPersianDigits(unreadNotifications)}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowSettings(true)}
          data-active={showSettings ? 'true' : 'false'}
          aria-label="تنظیمات و آواتار"
          title="تنظیمات و آواتار"
          className="narenj-rail-btn inline-flex items-center justify-center cursor-pointer"
        >
          <span className="narenj-rail-btn__curtain" aria-hidden="true" />
          <svg
            viewBox="0 0 25.5 25.5"
            className="narenj-rail-btn__icon w-14 h-14 block"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M17.4,11.4c-0.1,0.1-0.1,0.2-0.2,0.3c-0.2,0.1-0.4,0.2-0.6,0.4c-0.2,0.1-0.3,0.3-0.2,0.5c0,0.1,0,0.3,0,0.4c0,0.2,0.1,0.4,0.3,0.5c0.2,0.1,0.4,0.2,0.5,0.3c0.2,0.1,0.3,0.3,0.2,0.5c-0.1,0.2-0.2,0.4-0.3,0.6c-0.1,0.2-0.2,0.3-0.4,0.2c-0.2,0-0.4-0.1-0.6-0.1c-0.2-0.1-0.4,0-0.5,0.2c-0.1,0.1-0.2,0.2-0.3,0.3C15,15.6,15,15.7,15,15.9c0.1,0.2,0.1,0.4,0.1,0.6c0.1,0.3,0,0.4-0.3,0.5c-0.2,0.1-0.4,0.2-0.6,0.3c-0.2,0.1-0.4,0-0.5-0.2c-0.1-0.2-0.2-0.4-0.4-0.5c-0.1-0.2-0.3-0.3-0.5-0.2c-0.1,0-0.3,0-0.4,0c-0.2,0-0.4,0.1-0.5,0.2c-0.1,0.2-0.2,0.3-0.3,0.5c-0.1,0.2-0.3,0.3-0.6,0.2c-0.2-0.1-0.4-0.2-0.6-0.2c-0.2-0.1-0.3-0.2-0.2-0.5c0-0.2,0.1-0.4,0.1-0.6c0.1-0.2,0-0.4-0.2-0.6c-0.1-0.1-0.2-0.2-0.3-0.3C9.9,15,9.8,15,9.6,15c-0.2,0.1-0.4,0.1-0.6,0.1c-0.3,0.1-0.4,0-0.5-0.3c-0.1-0.2-0.2-0.4-0.3-0.6c-0.1-0.2,0-0.4,0.2-0.5c0.2-0.1,0.4-0.2,0.5-0.3c0.2-0.1,0.3-0.3,0.3-0.5c0-0.1,0-0.3,0-0.4c0-0.2-0.1-0.3-0.2-0.4c-0.2-0.1-0.4-0.2-0.5-0.3c-0.2-0.1-0.3-0.3-0.2-0.5c0.1-0.2,0.2-0.4,0.3-0.6c0.1-0.2,0.2-0.3,0.4-0.2c0.2,0,0.5,0.1,0.7,0.1c0.2,0,0.4,0,0.5-0.1c0.1-0.1,0.2-0.2,0.3-0.3c0.1-0.1,0.2-0.3,0.1-0.4c-0.1-0.2-0.1-0.4-0.2-0.7c-0.1-0.3,0-0.4,0.3-0.5c0.2-0.1,0.4-0.2,0.6-0.2c0.2-0.1,0.4,0,0.5,0.2c0.1,0.2,0.2,0.4,0.4,0.5c0.1,0.2,0.3,0.2,0.4,0.2c0.1,0,0.3,0,0.4,0c0.2,0,0.4-0.1,0.5-0.3c0.1-0.2,0.2-0.3,0.3-0.5c0.1-0.2,0.3-0.3,0.5-0.2c0.2,0.1,0.4,0.2,0.6,0.3c0.2,0.1,0.3,0.2,0.2,0.4c0,0.2-0.1,0.4-0.1,0.6c0,0.2,0,0.4,0.2,0.5c0.1,0.1,0.2,0.2,0.3,0.3c0.1,0.1,0.3,0.2,0.5,0.1c0.2-0.1,0.4-0.1,0.7-0.2c0.2-0.1,0.4,0,0.5,0.3c0.1,0.2,0.2,0.4,0.2,0.6C17.3,11.2,17.3,11.3,17.4,11.4C17.3,11.4,17.4,11.4,17.4,11.4z M14.7,12.7c0-1.1-0.9-1.9-1.9-1.9c-1.1,0-1.9,0.9-1.9,1.9c0,1.1,0.9,1.9,1.9,2C13.8,14.7,14.7,13.8,14.7,12.7z"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={onToggleHighContrast}
          data-active={highContrast ? 'true' : 'false'}
          aria-pressed={highContrast}
          aria-label="تغییر کنتراست نمایش"
          title="حالت کنتراست بالا"
          className="narenj-rail-btn inline-flex items-center justify-center cursor-pointer"
        >
          <span className="narenj-rail-btn__curtain" aria-hidden="true" />
          <svg
            viewBox="0 0 25.5 25.5"
            className="narenj-rail-btn__icon w-14 h-14 block"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M17.1,12.7c0-2.4-1.9-4.3-4.3-4.3l0,0l0,0l0,0c-0.9,0-1.7,0.3-2.4,0.7c-0.1,0.1-0.2,0.2-0.3,0.2c-1,0.8-1.6,2-1.6,3.3S9,15.3,10,16.1c0.1,0.1,0.2,0.2,0.3,0.2c0.7,0.5,1.5,0.7,2.4,0.7l0,0l0,0l0,0C15.1,17.1,17.1,15.1,17.1,12.7z M12.8,16.7V8.8c2.2,0,4,1.8,4,4S14.9,16.7,12.8,16.7z"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={onToggleLargeText}
          data-active={largeText ? 'true' : 'false'}
          aria-pressed={largeText}
          aria-label="بزرگ‌نمایی متن"
          title="بزرگ‌نمایی متن برای خوانایی بیشتر"
          className="narenj-rail-btn inline-flex items-center justify-center cursor-pointer"
        >
          <span className="narenj-rail-btn__curtain" aria-hidden="true" />
          <svg
            viewBox="0 0 25.5 25.5"
            className="narenj-rail-btn__icon w-14 h-14 block"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M11.6,7.8c-2.1,0-3.8,1.7-3.8,3.8c0,2.1,1.7,3.8,3.8,3.8c1,0,1.8-0.4,2.5-1l0.2,0.2l-0.2,0.2c-0.1,0.1-0.1,0.3,0,0.4l2.3,2.3c0.1,0.1,0.1,0.1,0.2,0.1c0.1,0,0.1,0,0.2-0.1l0.7-0.8c0.1-0.1,0.1-0.3,0-0.4l-2.3-2.3c-0.1-0.1-0.1-0.1-0.2-0.1c-0.1,0-0.1,0-0.2,0.1l-0.2,0.2l-0.2-0.2c0.6-0.7,1-1.6,1-2.5C15.4,9.5,13.7,7.8,11.6,7.8z M11.6,8.3c1.8,0,3.2,1.5,3.2,3.3s-1.5,3.3-3.2,3.3s-3.2-1.5-3.2-3.3S9.9,8.3,11.6,8.3z M11.7,9.5c-0.9,0-1.7,0.6-2,1.4c0,0.1,0,0.3,0.1,0.3c0,0,0.1,0,0.1,0c0.1,0,0.2-0.1,0.2-0.2c0.2-0.6,0.8-1.1,1.5-1.1c0.1,0,0.2-0.1,0.2-0.2C11.9,9.6,11.8,9.5,11.7,9.5z M9.9,11.8c-0.1,0-0.2,0.1-0.2,0.2v0c0,0.1,0.1,0.2,0.3,0.2c0.1,0,0.2-0.1,0.2-0.2v0C10.1,11.9,10,11.8,9.9,11.8L9.9,11.8z M15.1,14.8l1.9,1.9L16.6,17l-1.9-1.9L15.1,14.8z"
            />
          </svg>
        </button>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-5 md:pl-9 md:pr-[92px] min-[1240px]:pr-[72px] min-[1280px]:pr-[52px] min-[1312px]:pr-9 py-6 md:py-9">
        {/* ==================== STU-01: STUDENT HOME ==================== */}
        {view === 'home' && (
          <div className="space-y-10">
            {/* Section 1: Cozy Blue Banner Hero + Greeting + Active Continuation Card */}
            <section className="relative overflow-hidden rounded-[24px] bg-[#cad9f0] lg:aspect-[3585/1103] p-6 sm:p-8 lg:py-6 lg:pl-7 lg:pr-[30%] grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">
              <img
                src="/images/ui/cozy-blue-banner.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none select-none absolute inset-0 w-full h-full object-contain object-top lg:object-right"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#eaf4ff]/85 via-[#c5e2ff]/35 via-45% to-transparent to-75%"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[#cad9f0]/75 lg:hidden"
              />

              {/* RTL Start: Student Greeting & Personal Note harmonized with banner */}
              <div className="relative z-10 lg:col-span-5">
                <div className="min-w-0">
                  <h1 className="text-[28px] md:text-[34px] font-bold text-[#1d1d1b] leading-tight">
                    سلام {student.firstName}!
                  </h1>
                  <div className="mt-5 text-sm md:text-base font-semibold leading-relaxed space-y-1">
                    <p className="text-[#2c3a4f]">دیروز «تقارن» را کامل یاد گرفتی.</p>
                    <p className="text-[#c74809] font-bold">امروز کسرها را ادامه بدهیم؟</p>
                  </div>
                </div>
              </div>

              {/* RTL End: Continue Practice Card harmonized with banner */}
              <div className="relative z-10 lg:col-span-7">
                {(() => {
                  const fractionPercent =
                    activeSession?.skillId === 'skill-fraction-area' &&
                    activeSession.answeredCount > 0
                      ? Math.min(100, Math.max(0, activeSession.smartScore))
                      : 40;
                  return (
                    <div className="space-y-4 rounded-[22px] bg-white/95 border border-white p-5 md:p-6 shadow-[0_5px_0_0_rgba(162,188,224,0.55),0_14px_30px_rgba(31,63,117,0.1)]">
                      <div className="flex items-baseline justify-between gap-3">
                        <h2 className="text-lg md:text-[21px] font-bold text-[#1d1d1b] leading-snug">
                          جمع کسرها با مخرج برابر
                        </h2>
                        <span className="text-2xl md:text-[26px] font-bold text-[#ff5c0c] leading-none shrink-0 [font-variant-numeric:proportional-nums]">
                          {toPersianDigits(fractionPercent)}٪
                        </span>
                      </div>

                      <div className="space-y-2.5 pb-1.5">
                        <div className="relative h-3.5 w-full rounded-full bg-[#f5f1e4] shadow-[inset_0_1px_2px_rgba(29,29,27,0.08)]">
                          <div
                            className="h-full rounded-full bg-gradient-to-l from-[#8ed461] to-[#74c644] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-all duration-300"
                            style={{ width: `${fractionPercent}%` }}
                          />
                          <span
                            className="absolute -top-0.5 -bottom-0.5 w-[2px] bg-[#1d1d1b]/65 rounded-full"
                            style={{ insetInlineStart: '80%' }}
                            title="نمرهٔ لازم ۸۰"
                            aria-hidden="true"
                          />
                        </div>
                        <p className="text-xs md:text-sm font-semibold text-[#686562] leading-relaxed [font-variant-numeric:proportional-nums]">
                          {toPersianDigits(fractionPercent)} درصد از تمرین رو رفتی، مسیرت رو ادامه بده...
                        </p>
                      </div>

                      <V3PillButton
                        type="button"
                        size="md"
                        showArrow={false}
                        className="w-full !text-lg font-semibold !rounded-[16px]"
                        onClick={() =>
                          handleLaunchSkill('skill-fraction-area', primaryAssignment?.id)
                        }
                      >
                        ادامهٔ تمرین
                      </V3PillButton>
                    </div>
                  );
                })()}
              </div>
            </section>

            {/* Section 2: My Assignments (Image 11) + My Progress (Image 12) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Image 11: تکلیف‌های من */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="flex items-baseline gap-2.5">
                  <h2 className="text-lg md:text-[22px] font-bold text-[#1d1d1b]">
                    تکلیف‌های من
                  </h2>
                  <span className="text-base font-bold text-[#ff5c0c]">
                    ۳ تا مانده
                  </span>
                </div>

                <div className="narenj-cream-card !bg-[#f5f1e4] flex-1 px-5 md:px-6 py-3 pb-5 flex flex-col justify-between">
                  <div className="space-y-1">
                    {[
                      {
                        id: 'hw-fractions-compare',
                        skillId: 'skill-fraction-area',
                        title: 'مقایسهٔ کسرها',
                        score: 60,
                        target: 80,
                        dueLabel: '۱۲ آذر ۱۴۰۵',
                        status: 'pending' as const,
                      },
                      {
                        id: 'hw-division',
                        skillId: 'skill-area-mult',
                        title: 'تقسیم بر عدد یک‌رقمی',
                        score: 30,
                        target: 70,
                        dueLabel: '۲۸ آبان ۱۴۰۵',
                        status: 'overdue' as const,
                      },
                      {
                        id: 'hw-angle',
                        skillId: 'skill-area-equal',
                        title: 'اندازه‌گیری زاویه',
                        score: 0,
                        target: 80,
                        dueLabel: '۲۰ آذر ۱۴۰۵',
                        status: 'pending' as const,
                      },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleLaunchSkill(item.skillId, primaryAssignment?.id)}
                        className="w-full py-3.5 text-start flex items-start gap-5 group cursor-pointer"
                      >
                        <span
                          className="w-[60px] h-[60px] rounded-[16px] bg-white border border-dashed border-[#bfbeba] shrink-0"
                          aria-hidden="true"
                        />
                        <div className="flex-1 min-w-0 space-y-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-base font-bold text-[#1d1d1b] group-hover:text-[#ff5c0c] transition-colors">
                              {item.title}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs md:text-sm text-[#686562] tabular-nums">
                              نمرهٔ لازم {toPersianDigits(item.target)} · {student.className} · مهلت{' '}
                              {item.dueLabel}
                            </p>
                            {item.status === 'overdue' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5e211] text-[#1d1d1b] text-xs font-semibold shrink-0">
                                <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                <span>مهلت گذشته</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#ff705d] text-white text-xs font-semibold shrink-0">
                                انجام نشده
                              </span>
                            )}
                          </div>

                          <div className="relative h-2 w-full rounded-full bg-white">
                            {item.score > 0 && (
                              <div
                                className="h-full rounded-full bg-[#8ed461]"
                                style={{ width: `${item.score}%` }}
                              />
                            )}
                            <span
                              className="absolute -top-1 -bottom-1 w-[2px] bg-[#1d1d1b] rounded-full"
                              style={{ insetInlineStart: `${item.target}%` }}
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-4 mt-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#c74809] tabular-nums">
                      <CheckCircle2 className="w-4 h-4 text-[#c74809] shrink-0" aria-hidden="true" />
                      <span>۲ تکلیف را انجام داده‌ای</span>
                    </span>
                    <V3PillButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setView('library')}
                      className="!bg-white hover:!bg-[#ff5c0c] hover:!text-white hover:!ring-[#ff5c0c] hover:!shadow-[0_3px_0_0_#c74809] [&:hover>span:last-child]:!bg-white/25 [&:hover>span:last-child]:!text-white"
                    >
                      دیدن همه
                    </V3PillButton>
                  </div>
                </div>
              </div>

              {/* Image 12: پیشرفت من */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <h2 className="text-lg md:text-[22px] font-bold text-[#1d1d1b]">
                  پیشرفت من
                </h2>

                <div className="narenj-cream-card !bg-[#f5f1e4] flex-1 p-5 md:p-6 flex flex-col justify-between gap-5">
                  <div className="space-y-5">
                    <p className="text-sm md:text-base text-[#3c3c3c] leading-relaxed">
                      <strong className="text-3xl font-bold text-[#1d1d1b] tracking-tight [font-variant-numeric:proportional-nums] ml-1.5 align-baseline">
                        ۱۲
                      </strong>
                      <span>مهارت از ۴۸ مهارت پایهٔ چهارم را یاد گرفته‌ای.</span>
                    </p>

                    <div className="space-y-4">
                      {[
                        { label: 'عدد و الگو', done: 4, total: 8 },
                        { label: 'کسرها', done: 3, total: 10 },
                        { label: 'ضرب و تقسیم', done: 2, total: 12 },
                        { label: 'هندسه', done: 3, total: 10 },
                        { label: 'اندازه‌گیری', done: 0, total: 8 },
                      ].map((row) => {
                        const pct = Math.round((row.done / row.total) * 100);
                        return (
                          <div key={row.label} className="space-y-1.5">
                            <p className="text-sm font-semibold text-[#1d1d1b]">{row.label}</p>
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-2 rounded-full bg-white overflow-hidden">
                                {pct > 0 && (
                                  <div
                                    className="h-full rounded-full bg-[#2ba0ff]"
                                    style={{ width: `${pct}%` }}
                                  />
                                )}
                              </div>
                              <span className="text-xs font-semibold text-[#3c3c3c] tracking-tight [font-variant-numeric:proportional-nums] whitespace-nowrap w-10 text-left shrink-0">
                                {toPersianDigits(row.done)} از {toPersianDigits(row.total)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <V3PillButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setView('library')}
                      className="!bg-white hover:!bg-[#ff5c0c] hover:!text-white hover:!ring-[#ff5c0c] hover:!shadow-[0_3px_0_0_#c74809] [&:hover>span:last-child]:!bg-white/25 [&:hover>span:last-child]:!text-white"
                    >
                      دیدن مهارت‌ها
                    </V3PillButton>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Recent Results (Full-width borderless 3-column row with white gaps) */}
            <section className="space-y-4">
              <h2 className="text-lg md:text-[22px] font-bold text-[#1d1d1b]">
                نتیجه‌های تازه
              </h2>

              <div className="rounded-[24px] bg-white border border-[#e0dbce] p-5 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                {[
                  {
                    id: 'res-symmetry',
                    title: 'تقارن',
                    score: 100,
                    coins: 30,
                    when: 'دیروز',
                  },
                  {
                    id: 'res-time',
                    title: 'ساعت و زمان',
                    score: 85,
                    coins: 20,
                    when: '۳ روز پیش',
                  },
                  {
                    id: 'res-mult-2d',
                    title: 'ضرب عددهای دورقمی',
                    score: 65,
                    coins: 10,
                    when: '۵ روز پیش',
                  },
                ].map((res, idx) => (
                  <div
                    key={res.id}
                    className={`flex items-center gap-3.5 ${
                      idx > 0
                        ? 'pt-4 border-t border-[#e0dbce] md:pt-0 md:border-t-0 md:border-r md:border-[#e0dbce] md:pr-5'
                        : ''
                    }`}
                  >
                    <span
                      className="w-[60px] h-[60px] rounded-[16px] bg-[#ecebe8] border border-dashed border-[#c8c6c2] shrink-0"
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-[#1d1d1b] truncate">{res.title}</h3>
                        <span className="text-xs md:text-sm text-[#686562] shrink-0">
                          {res.when}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm text-[#3c3c3c] tabular-nums">
                          نمرهٔ {toPersianDigits(res.score)} از ۱۰۰
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff5c0c] text-white text-xs font-bold tabular-nums">
                          <Coins className="w-3.5 h-3.5 text-white shrink-0" aria-hidden="true" />
                          <span>{toPersianDigits(res.coins)} سکه گرفتی</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ==================== STU-02: SKILL LIBRARY ==================== */}
        {view === 'library' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#9e3908]">ریاضی · پایه چهارم ابتدایی</p>
                <h1 className="text-[28px] md:text-[34px] font-bold text-[#1d1d1b]">
                  کتابخانه مهارت‌ها
                </h1>
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[#686562] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی مهارت یا مبحث..."
                  aria-label="جستجوی مهارت"
                  className="w-full h-11 pr-11 pl-4 rounded-[16px] bg-[#f5f1e4] border border-[#e0dbce] text-sm text-[#1d1d1b] focus:bg-white focus:border-[#2ba0ff]"
                />
              </div>
            </div>

            {/* Interactive Filter Bars (Functional segmented controls per design system) */}
            <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-[#e0dbce]">
              <div className="flex flex-wrap items-center gap-1.5 bg-[#f5f1e4] p-1 rounded-[14px]">
                <button
                  type="button"
                  onClick={() => setTopicFilter('all')}
                  className={`px-3.5 py-1.5 rounded-[10px] text-xs font-semibold transition-colors cursor-pointer ${
                    topicFilter === 'all'
                      ? 'bg-white text-[#1d1d1b] shadow-sm'
                      : 'text-[#686562] hover:text-[#1d1d1b]'
                  }`}
                >
                  همه مباحث
                </button>
                {MATH_TOPICS.map((t) => (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => setTopicFilter(t.code)}
                    className={`px-3.5 py-1.5 rounded-[10px] text-xs font-semibold transition-colors cursor-pointer ${
                      topicFilter === t.code
                        ? 'bg-white text-[#1d1d1b] shadow-sm'
                        : 'text-[#686562] hover:text-[#1d1d1b]'
                    }`}
                  >
                    {t.title}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-[#f5f1e4] p-1 rounded-[14px]">
                {(
                  [
                    { id: 'all', label: 'همه وضعیت‌ها' },
                    { id: 'not_started', label: 'شروع نشده' },
                    { id: 'attempt', label: 'تلاش' },
                    { id: 'proficient', label: 'مسلط' },
                    { id: 'mastered', label: 'تسلط کامل' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-colors cursor-pointer ${
                      statusFilter === st.id
                        ? 'bg-white text-[#1d1d1b] shadow-sm'
                        : 'text-[#686562] hover:text-[#1d1d1b]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Empty Search / Filter State */}
            {filteredSkills.length === 0 ? (
              <div className="narenj-cream-card p-8 text-center space-y-3">
                <p className="text-lg font-bold text-[#1d1d1b]">
                  مهارتی با این فیلتر یا عبارت پیدا نشد
                </p>
                <p className="text-sm text-[#686562]">
                  فیلترها را پاک کن تا همه مهارت‌های پایه چهارم دوباره نمایش داده شوند.
                </p>
                <V3PillButton
                  type="button"
                  variant="secondary"
                  showArrow={false}
                  onClick={() => {
                    setSearchQuery('');
                    setTopicFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  پاک کردن فیلترها
                </V3PillButton>
              </div>
            ) : (
              /* Topic Accordions (STU-02 spec: collapsed/expandable topic groups) */
              <div className="space-y-4">
                {MATH_TOPICS.filter((t) =>
                  filteredSkills.some((sk) => sk.topicCode === t.code)
                ).map((topic) => {
                  const topicSkills = filteredSkills.filter((sk) => sk.topicCode === topic.code);
                  const isExpanded = searchQuery.trim()
                    ? true
                    : expandedTopics[topic.code] ?? true;

                  return (
                    <section
                      key={topic.code}
                      className="rounded-[24px] border border-[#e0dbce] bg-white overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTopics((prev) => ({
                            ...prev,
                            [topic.code]: !isExpanded,
                          }))
                        }
                        aria-expanded={isExpanded}
                        className="w-full px-6 py-4 bg-[#f5f1e4]/70 hover:bg-[#f5f1e4] flex items-center justify-between gap-4 text-start transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-9 h-9 rounded-[12px] text-white font-bold text-sm inline-flex items-center justify-center shrink-0"
                            style={{ backgroundColor: topic.accent }}
                          >
                            {topic.code}
                          </span>
                          <div>
                            <h2 className="text-lg font-bold text-[#1d1d1b]">{topic.title}</h2>
                            <p className="text-xs text-[#686562]">
                              {toPersianDigits(topicSkills.length)} مهارت قابل تمرین
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-[#686562]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#686562]" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="divide-y divide-[#f5f1e4]">
                          {topicSkills.map((skill: SkillRecord) => {
                            const prog = progressMap[skill.id];
                            const score = prog?.smartScore ?? 0;
                            const level = getMasteryLevel(score, prog?.questionsAnswered ?? 0);
                            const meta = MASTERY_META[level];
                            const medal = getMedalForScore(score);

                            return (
                              <div
                                key={skill.id}
                                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#686562]">
                                    <span dir="ltr" className="font-semibold">
                                      {skill.code}
                                    </span>
                                    <span aria-hidden="true">·</span>
                                    <span>{skill.subtopicTitle}</span>
                                    <span aria-hidden="true">·</span>
                                    <span
                                      className="font-semibold"
                                      style={{ color: meta.color }}
                                    >
                                      {meta.label}
                                    </span>
                                  </div>
                                  <h3 className="text-base font-bold text-[#1d1d1b]">
                                    {skill.title}
                                  </h3>
                                  <p className="text-xs text-[#686562] line-clamp-2">
                                    {skill.objective}
                                  </p>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                  <div className="flex items-center gap-2">
                                    <MedalIcon tier={medal.tier} size={24} />
                                    <span className="text-sm font-bold text-[#1d1d1b] tabular-nums w-10 text-center">
                                      {toPersianDigits(score)}
                                    </span>
                                  </div>
                                  <V3PillButton
                                    type="button"
                                    size="sm"
                                    onClick={() => handleLaunchSkill(skill.id)}
                                  >
                                    {score > 0 ? 'ادامه تمرین' : 'شروع تمرین'}
                                  </V3PillButton>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== PERSONAL GROWTH & MASTERY ==================== */}
        {view === 'progress' && (
          <div className="space-y-8">
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-[#9e3908]">
                مسیر رشد شخصی · بدون رده‌بندی رقابتی
              </p>
              <h1 className="text-[28px] md:text-[34px] font-bold text-[#1d1d1b]">
                کارنامه رشد و نردبان تسلط من
              </h1>
            </div>

            {/* Summary KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="narenj-cream-card p-5 flex items-center gap-4">
                <StickerSubmitted className="w-16 h-16 shrink-0" />
                <div>
                  <p className="text-xs text-[#686562]">مجموع پاسخ‌های ثبت شده</p>
                  <p className="text-2xl font-bold text-[#1d1d1b] tabular-nums">
                    {toPersianDigits(masteryStats.totalAnswered)} سوال
                  </p>
                </div>
              </div>
              <div className="narenj-cream-card p-5 flex items-center gap-4">
                <Clock className="w-11 h-11 text-[#2ba0ff] shrink-0" />
                <div>
                  <p className="text-xs text-[#686562]">زمان تمرین ثبت شده</p>
                  <p className="text-2xl font-bold text-[#1d1d1b] tabular-nums">
                    {formatElapsedTime(masteryStats.totalSeconds)}
                  </p>
                </div>
              </div>
              <div className="narenj-cream-card p-5 flex items-center gap-4">
                <MedalIcon tier="gold" size={44} />
                <div>
                  <p className="text-xs text-[#686562]">مدال‌های کسب شده</p>
                  <p className="text-2xl font-bold text-[#1d1d1b] tabular-nums">
                    {toPersianDigits(
                      masteryStats.gold + masteryStats.silver + masteryStats.bronze
                    )}{' '}
                    مدال
                  </p>
                </div>
              </div>
            </div>

            {/* Mastery Improvement Over Time (Recharts) */}
            <StudentMasteryChart
              progressMap={progressMap}
              onSelectTopicPractice={(skillId) => handleLaunchSkill(skillId)}
            />

            {/* Mastery Ladder List */}
            <section className="rounded-[24px] border border-[#e0dbce] bg-white overflow-hidden">
              <div className="px-6 py-4 bg-[#f5f1e4] flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-[#1d1d1b]">وضعیت مهارت‌های پایه چهارم</h2>
                <span className="text-xs text-[#686562]">
                  نردبان تسلط: شروع نشده ← تلاش ← آشنا ← مسلط ← تسلط کامل
                </span>
              </div>
              <div className="divide-y divide-[#f5f1e4]">
                {SKILLS_CATALOG.map((skill) => {
                  const prog = progressMap[skill.id];
                  const score = prog?.smartScore ?? 0;
                  const answered = prog?.questionsAnswered ?? 0;
                  const level = getMasteryLevel(score, answered);
                  const meta = MASTERY_META[level];
                  const medal = getMedalForScore(score);

                  return (
                    <div
                      key={skill.id}
                      className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs text-[#686562]">
                          <span>{skill.topicTitle}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold" style={{ color: meta.color }}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-base font-bold text-[#1d1d1b]">{skill.title}</p>
                        <div className="w-full max-w-md h-2 rounded-full bg-[#f5f1e4] overflow-hidden mt-1.5">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${score}%`,
                              backgroundColor: score >= 80 ? '#8ed461' : '#ff5c0c',
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-2 text-sm tabular-nums">
                          <MedalIcon tier={medal.tier} size={24} />
                          <span className="font-bold text-[#1d1d1b]">
                            {toPersianDigits(score)} / ۱۰۰
                          </span>
                        </div>
                        <V3PillButton
                          type="button"
                          size="sm"
                          variant={score >= 100 ? 'secondary' : 'primary'}
                          onClick={() => handleLaunchSkill(skill.id)}
                        >
                          {score >= 100 ? 'مرور مجدد' : 'تمرین'}
                        </V3PillButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ==================== STU-04: PRACTICE SESSION ==================== */}
        {view === 'practice' && activeSession && (
          <PracticeSession
            key={`${activeSession.skillId}-${activeSession.currentIndex === 0 && activeSession.answeredCount === 0 ? 'fresh' : 'active'}`}
            skill={practiceSkill}
            initialState={activeSession}
            onUpdateActiveSession={onUpdateActiveSession}
            onFinishSession={handleSessionFinished}
            onPauseAndExit={handleSessionPaused}
          />
        )}

        {/* ==================== STU-05: V3 SESSION SUMMARY ==================== */}
        {view === 'summary' && lastSummary && (
          <SessionSummary
            summary={lastSummary}
            onReturnToTasks={() => setView('home')}
            onPracticeAgain={() =>
              handleLaunchSkill(
                lastSummary.skill.id,
                lastSummary.fromAssignment ? primaryAssignment?.id : undefined
              )
            }
            onOpenProgress={() => setView('progress')}
          />
        )}
      </main>

      {/* Slide-out Navigation Drawer (narenj-tray aesthetic, synchronized below morphing orange menu button) */}
      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        topOffsetClass="top-16 sm:top-[78px]"
        hideHeader
        title="منوی دانش‌آموز"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                onSwitchToTeacherDemo();
              }}
              className="w-full min-h-[46px] px-3.5 rounded-[14px] bg-[#f5f1e4] hover:bg-[#e0dbce]/60 text-xs font-bold text-[#1d1d1b] flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4 text-[#ff5c0c] shrink-0" />
              <span>پیش‌نمایش پنل معلم (خانم راد)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                onLogout();
              }}
              className="w-full min-h-[46px] px-3.5 rounded-[14px] text-sm font-semibold text-[#9e3908] hover:bg-[#fff2eb] flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>خروج از حساب کاربری</span>
            </button>
          </>
        }
      >
        <DrawerTrayGroup label="ناوبری اصلی">
          <nav aria-label="منوی ناوبری دانش‌آموز" className="space-y-1">
            {[
              { id: 'home', label: 'خانه من و تکلیف‌ها', icon: Home },
              { id: 'library', label: 'کتابخانه مهارت‌ها', icon: BookOpen },
              { id: 'progress', label: 'مسیر رشد و مدال‌ها', icon: TrendingUp },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setView(item.id as StudentView);
                  setDrawerOpen(false);
                }}
                className={`w-full min-h-[48px] px-3.5 rounded-[14px] text-sm flex items-center gap-3 transition-colors cursor-pointer ${
                  view === item.id
                    ? 'bg-[#fff2eb] text-[#ff5c0c] font-bold'
                    : 'text-[#3c3c3c] font-semibold hover:bg-[#f5f1e4]'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </DrawerTrayGroup>

        <DrawerTrayGroup label="تنظیمات و ابزارها">
          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              setShowNotifications(true);
              setUnreadNotifications(0);
            }}
            className="xl:hidden w-full min-h-[46px] px-3.5 rounded-[14px] text-sm font-semibold text-[#3c3c3c] hover:bg-[#f5f1e4] flex items-center justify-between gap-3 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-3">
              <Bell className="w-4 h-4 text-[#ff5c0c] shrink-0" />
              <span>اعلان‌های من</span>
            </span>
            {unreadNotifications > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#ff5c0c] text-white text-[11px] font-bold inline-flex items-center justify-center tabular-nums">
                {toPersianDigits(unreadNotifications)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              setShowSettings(true);
            }}
            className="w-full min-h-[46px] px-3.5 rounded-[14px] text-sm font-semibold text-[#3c3c3c] hover:bg-[#f5f1e4] flex items-center gap-3 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>تغییر آواتار و تنظیمات</span>
          </button>

          <button
            type="button"
            onClick={onToggleHighContrast}
            aria-pressed={highContrast}
            className="xl:hidden w-full min-h-[46px] px-3.5 rounded-[14px] text-sm font-semibold text-[#3c3c3c] hover:bg-[#f5f1e4] flex items-center justify-between gap-3 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-3">
              <Contrast className="w-4 h-4 shrink-0" />
              <span>حالت کنتراست بالا</span>
            </span>
            <span
              className={`text-xs font-bold ${
                highContrast ? 'text-[#ff5c0c]' : 'text-[#686562]'
              }`}
            >
              {highContrast ? 'روشن' : 'خاموش'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleLargeText}
            aria-pressed={largeText}
            className="xl:hidden w-full min-h-[46px] px-3.5 rounded-[14px] text-sm font-semibold text-[#3c3c3c] hover:bg-[#f5f1e4] flex items-center justify-between gap-3 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-3">
              <ZoomIn className="w-4 h-4 shrink-0" />
              <span>بزرگ‌نمایی متن</span>
            </span>
            <span
              className={`text-xs font-bold ${
                largeText ? 'text-[#ff5c0c]' : 'text-[#686562]'
              }`}
            >
              {largeText ? 'روشن' : 'خاموش'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              onReplayOnboarding();
            }}
            className="w-full min-h-[46px] px-3.5 rounded-[14px] text-sm font-semibold text-[#3c3c3c] hover:bg-[#f5f1e4] flex items-center gap-3 transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>مشاهده مجدد تور راهنما</span>
          </button>
        </DrawerTrayGroup>
      </MobileNavDrawer>

      {/* Notifications Popover */}
      {showNotifications && (
        <div
          className="fixed left-4 right-4 sm:left-16 sm:right-auto top-20 sm:top-1/2 sm:-translate-y-1/2 z-40 sm:w-80 bg-white rounded-[22px] border border-[#e0dbce] shadow-xl p-5 space-y-3"
          role="dialog"
          aria-label="اعلان‌های یادگیری"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1d1d1b]">اعلان‌های من</h3>
            <button
              type="button"
              onClick={() => setShowNotifications(false)}
              className="text-[#686562] hover:text-[#1d1d1b] cursor-pointer"
              aria-label="بستن اعلان‌ها"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="p-3 rounded-[14px] bg-[#fff2eb] border border-[#ffcbb1]">
              <p className="font-bold text-[#1d1d1b]">تکلیف تازه از خانم راد</p>
              <p className="text-xs text-[#3c3c3c] mt-0.5">
                تمرین «تشخیص دو شکل با مساحت برابر» تا چهارشنبه فعال است.
              </p>
            </div>
            <div className="p-3 rounded-[14px] bg-[#eef9e6] border border-[#8ed461]">
              <p className="font-bold text-[#1d1d1b]">مدال طلا ثبت شد</p>
              <p className="text-xs text-[#3c3c3c] mt-0.5">
                در مهارت «پیدا کردن ارزش ارقام در عددها» به امتیاز ۱۰۰ رسیدی!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings & Avatar Picker Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 bg-[#1d1d1b]/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
        >
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 border border-[#e0dbce] shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 id="settings-modal-title" className="text-xl font-bold text-[#1d1d1b]">
                تنظیمات و انتخاب آواتار
              </h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                aria-label="بستن تنظیمات"
                className="w-9 h-9 rounded-full hover:bg-[#f5f1e4] inline-flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-bold text-[#1d1d1b]">آواتار من</p>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_REGISTRY.filter((a) => a.category === 'girl' || a.category === 'boy').map(
                  (av) => {
                    const selected = av.id === student.avatarId;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => onChangeAvatar(av.id)}
                        className={`relative rounded-[16px] p-2 border-2 transition-all cursor-pointer ${
                          selected
                            ? 'border-[#ff5c0c] bg-[#fff2eb]'
                            : 'border-transparent bg-[#f5f1e4] hover:border-[#e0dbce]'
                        }`}
                      >
                        {selected && (
                          <CheckCircle2 className="w-4 h-4 text-[#ff5c0c] absolute top-1.5 left-1.5" />
                        )}
                        <img
                          src={av.src}
                          alt={av.label}
                          className="w-full aspect-square rounded-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-[#e0dbce]">
              <p className="text-sm font-bold text-[#1d1d1b]">دسترس‌پذیری و خوانایی</p>
              <label className="flex items-center justify-between p-3 rounded-[14px] bg-[#f5f1e4] cursor-pointer">
                <span className="text-sm font-semibold text-[#1d1d1b]">بزرگ‌نمایی متن</span>
                <input
                  type="checkbox"
                  checked={largeText}
                  onChange={onToggleLargeText}
                  className="w-5 h-5 accent-[#ff5c0c]"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-[14px] bg-[#f5f1e4] cursor-pointer">
                <span className="text-sm font-semibold text-[#1d1d1b]">کنتراست بالاتر رنگ‌ها</span>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={onToggleHighContrast}
                  className="w-5 h-5 accent-[#ff5c0c]"
                />
              </label>
            </div>

            <div className="flex justify-end">
              <V3PillButton
                type="button"
                showArrow={false}
                onClick={() => setShowSettings(false)}
              >
                ذخیره و بستن
              </V3PillButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
