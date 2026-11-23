import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  TrendingUp,
  X,
  CheckCircle2,
  Clock,
  Play,
  ArrowLeftRight,
  Compass,
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
  resolveAvatarSrc,
  toPersianDigits,
} from '../data/narenjData';
import {
  MedalIcon,
  NarenjBrandMark,
  StickerCorrect,
  StickerSubmitted,
  V3PillButton,
} from './V3Stickers';
import { PracticeSession } from './PracticeSession';
import { SessionSummary, SessionSummaryData } from './SessionSummary';

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
  const primarySkill =
    SKILLS_CATALOG.find((s) => s.id === (activeSession?.skillId ?? primaryAssignment?.skillIds[0])) ??
    SKILLS_CATALOG[0];

  const practiceSkill =
    SKILLS_CATALOG.find((s) => s.id === activeSession?.skillId) ?? SKILLS_CATALOG[0];

  const avatarSrc = resolveAvatarSrc(student.avatarId, 'student');

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

  const breadcrumbLabel: Record<StudentView, string> = {
    home: 'فضای یادگیری  ›  خانه من',
    library: 'فضای یادگیری  ›  کتابخانه مهارت‌ها',
    progress: 'فضای یادگیری  ›  مسیر رشد من',
    practice: `فضای یادگیری  ›  جلسه تمرین`,
    summary: 'فضای یادگیری  ›  نتیجه تمرین',
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
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#e0dbce]">
        <div className="w-full pr-0 pl-4 md:pl-7 h-[78px] flex items-center justify-between gap-4">
          {/* RTL Start Zone: V3 Sharp-Cornered Orange Menu Square Flush Top-Right + Student Profile */}
          <div className="flex items-center gap-3 md:gap-5 min-w-0 h-full">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="باز کردن منوی ناوبری"
              className="w-[78px] h-full rounded-none bg-[#ff5c0c] hover:bg-[#ec5c17] text-white inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer self-start"
            >
              <Menu className="w-7 h-7" />
            </button>

            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#ffcbb1] shrink-0 bg-[#fff2eb] cursor-pointer"
                title="تغییر آواتار و تنظیمات"
              >
                <img
                  src={avatarSrc}
                  alt={`${student.firstName} ${student.lastName}`}
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm md:text-base whitespace-nowrap">
                  <span className="font-bold text-[#1d1d1b]">{student.firstName}</span>
                  <span className="text-[#d5d5d4]" aria-hidden="true">
                    /
                  </span>
                  <span className="text-[#686562] hidden sm:inline">{student.className}</span>
                </div>
                <p className="text-xs text-[#686562] truncate">{breadcrumbLabel[view]}</p>
              </div>
            </div>

            {/* V3 Coin Callout (matches Page 11: تا حالا ۲۴۷۰ سکه جمع کردی!) */}
            <div className="hidden lg:flex items-center mr-4 text-sm font-semibold text-[#ff5c0c] whitespace-nowrap shrink-0 tabular-nums">
              تا حالا {toPersianDigits(student.coins)} سکه جمع کردی!
            </div>
          </div>

          {/* Center Nav Links (Desktop — clean typography, single-line) */}
          {view !== 'practice' && (
            <nav
              aria-label="مسیرهای یادگیری"
              className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#3c3c3c]"
            >
              <button
                type="button"
                onClick={() => setView('home')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  view === 'home'
                    ? 'text-[#ff5c0c] border-[#ff5c0c]'
                    : 'border-transparent hover:text-[#1d1d1b]'
                }`}
              >
                خانه من
              </button>
              <button
                type="button"
                onClick={() => setView('library')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  view === 'library'
                    ? 'text-[#ff5c0c] border-[#ff5c0c]'
                    : 'border-transparent hover:text-[#1d1d1b]'
                }`}
              >
                کتابخانه مهارت‌ها
              </button>
              <button
                type="button"
                onClick={() => setView('progress')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  view === 'progress'
                    ? 'text-[#ff5c0c] border-[#ff5c0c]'
                    : 'border-transparent hover:text-[#1d1d1b]'
                }`}
              >
                مسیر رشد من
              </button>
            </nav>
          )}

          {/* RTL End Zone: Official V3 Narenj Brand Mark */}
          <button
            type="button"
            onClick={() => {
              if (view !== 'practice') setView('home');
            }}
            className="cursor-pointer"
            aria-label="بازگشت به خانه نارنج"
          >
            <NarenjBrandMark />
          </button>
        </div>
      </header>

      {/* V3 Page 11 Floating Left Accessibility & Utility Rail (Official SVGs 19–22) */}
      <aside
        aria-label="ابزارهای دسترس‌پذیری و اعلان‌ها"
        className="hidden xl:flex flex-col items-center gap-2 fixed left-0 top-1/2 -translate-y-1/2 z-20"
      >
        <button
          type="button"
          onClick={() => {
            setShowNotifications((v) => !v);
            setUnreadNotifications(0);
          }}
          aria-label="اعلان‌ها"
          title="اعلان‌ها"
          className="relative w-14 h-14 p-0 block hover:brightness-95 transition-all cursor-pointer overflow-visible"
        >
          <img
            src="/images/ui/aside-19.svg"
            alt="اعلان‌ها"
            className="w-full h-full block object-cover"
            referrerPolicy="no-referrer"
          />
          {unreadNotifications > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#ff5c0c] text-white text-[11px] font-bold inline-flex items-center justify-center tabular-nums">
              {toPersianDigits(unreadNotifications)}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowSettings(true)}
          aria-label="تنظیمات و آواتار"
          title="تنظیمات و آواتار"
          className="w-14 h-14 p-0 block hover:brightness-95 transition-all cursor-pointer"
        >
          <img
            src="/images/ui/aside-20.svg"
            alt="تنظیمات"
            className="w-full h-full block object-cover"
            referrerPolicy="no-referrer"
          />
        </button>

        <button
          type="button"
          onClick={onToggleHighContrast}
          aria-pressed={highContrast}
          aria-label="تغییر کنتراست نمایش"
          title="حالت کنتراست بالا"
          className={`w-14 h-14 p-0 block hover:brightness-95 transition-all cursor-pointer ${
            highContrast ? 'ring-2 ring-inset ring-[#ff5c0c]' : ''
          }`}
        >
          <img
            src="/images/ui/aside-21.svg"
            alt="تغییر کنتراست نمایش"
            className="w-full h-full block object-cover"
            referrerPolicy="no-referrer"
          />
        </button>

        <button
          type="button"
          onClick={onToggleLargeText}
          aria-pressed={largeText}
          aria-label="بزرگ‌نمایی متن"
          title="بزرگ‌نمایی متن برای خوانایی بیشتر"
          className={`w-14 h-14 p-0 block hover:brightness-95 transition-all cursor-pointer ${
            largeText ? 'ring-2 ring-inset ring-[#ff5c0c]' : ''
          }`}
        >
          <img
            src="/images/ui/aside-22.svg"
            alt="بزرگ‌نمایی متن"
            className="w-full h-full block object-cover"
            referrerPolicy="no-referrer"
          />
        </button>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-5 md:px-9 py-6 md:py-9">
        {/* ==================== STU-01: STUDENT HOME ==================== */}
        {view === 'home' && (
          <div className="space-y-10">
            {/* Single Dominant Focal Hero Task (Resumable Session OR Primary Teacher Assignment) */}
            <section className="narenj-cream-card p-6 md:p-9 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3.5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-[#9e3908] font-semibold">
                  <span>
                    {activeSession
                      ? 'تمرین نیمه‌تمام — دقیقاً از همین‌جا ادامه بده'
                      : 'تکلیف فعال کلاس چهارم سرو'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{primarySkill.topicTitle}</span>
                </div>

                <h1 className="text-[26px] md:text-[34px] font-bold text-[#1d1d1b] leading-[1.35] text-balance">
                  {primarySkill.title}
                </h1>

                <p className="text-base text-[#3c3c3c] max-w-2xl">
                  {primaryAssignment?.instructions ?? primarySkill.objective}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-[#686562] pt-1">
                  <span>
                    امتیاز فعلی:{' '}
                    <strong className="text-[#1d1d1b] tabular-nums">
                      {toPersianDigits(
                        activeSession?.smartScore ?? progressMap[primarySkill.id]?.smartScore ?? 0
                      )}{' '}
                      از ۱۰۰
                    </strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    زمان تقریبی: {toPersianDigits(primarySkill.estimatedMinutes)} دقیقه
                  </span>
                  {primaryAssignment && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>مهلت: {primaryAssignment.dueDateLabel}</span>
                    </>
                  )}
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <V3PillButton
                    type="button"
                    size="lg"
                    onClick={() => handleLaunchSkill(primarySkill.id, primaryAssignment?.id)}
                  >
                    {activeSession ? 'ادامه تمرین ذخیره شده' : 'شروع تمرین'}
                  </V3PillButton>

                  <V3PillButton
                    type="button"
                    variant="secondary"
                    showArrow={false}
                    onClick={() => setView('library')}
                  >
                    مشاهده همه مهارت‌ها
                  </V3PillButton>
                </div>
              </div>

              <div className="lg:col-span-4 flex items-center justify-center">
                <div className="narenj-tray p-5 w-full max-w-[260px] flex flex-col items-center text-center gap-3 border border-[#e0dbce]">
                  <StickerCorrect className="w-24 h-24" />
                  <div>
                    <p className="text-sm font-bold text-[#1d1d1b]">هدف بعدی تو</p>
                    <p className="text-xs text-[#686562] mt-0.5">
                      با رسیدن به امتیاز ۸۰ مدال برنز این مهارت را می‌گیری
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Teacher Assigned Skills (تکالیف من) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[22px] md:text-[26px] font-bold text-[#1d1d1b]">
                    تکلیف‌های معلم
                  </h2>
                  <p className="text-sm text-[#686562]">
                    مهارت‌هایی که خانم راد برای کلاس چهارم سرو مشخص کرده است
                  </p>
                </div>
                <span className="text-sm font-semibold text-[#686562] tabular-nums">
                  {toPersianDigits(studentAssignments.length)} تکلیف فعال
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {studentAssignments.map((assignment) => (
                  <article
                    key={assignment.id}
                    className="rounded-[24px] bg-white border border-[#e0dbce] p-5 md:p-6 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs text-[#686562]">
                        <span>مهلت: {assignment.dueDateLabel}</span>
                        <span>{toPersianDigits(assignment.skillIds.length)} مهارت</span>
                      </div>
                      <h3 className="text-lg font-bold text-[#1d1d1b]">{assignment.title}</h3>
                      <p className="text-sm text-[#3c3c3c]">{assignment.instructions}</p>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-[#f5f1e4]">
                      {assignment.skillIds.map((sid) => {
                        const sk = SKILLS_CATALOG.find((s) => s.id === sid);
                        if (!sk) return null;
                        const prog = progressMap[sid];
                        const score = prog?.smartScore ?? 0;
                        const level = getMasteryLevel(score, prog?.questionsAnswered ?? 0);
                        const meta = MASTERY_META[level];
                        return (
                          <div
                            key={sid}
                            className="flex items-center justify-between gap-3 p-3 rounded-[16px] bg-[#f5f1e4]/70"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#1d1d1b] truncate">
                                {sk.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs mt-0.5">
                                <span style={{ color: meta.color }} className="font-semibold">
                                  {meta.label}
                                </span>
                                <span aria-hidden="true" className="text-[#d5d5d4]">
                                  ·
                                </span>
                                <span className="text-[#686562] tabular-nums">
                                  امتیاز {toPersianDigits(score)}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleLaunchSkill(sid, assignment.id)}
                              className="h-9 px-3.5 rounded-[50px] bg-[#ff5c0c] hover:bg-[#ec5c17] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{score > 0 ? 'ادامه' : 'شروع'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Section 3: Recommended Free Practice + Personal Growth Snapshot */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <h2 className="text-[22px] font-bold text-[#1d1d1b]">
                  پیشنهادهای تمرین آزاد برای تو
                </h2>
                <div className="space-y-3">
                  {SKILLS_CATALOG.slice(4, 7).map((skill) => {
                    const prog = progressMap[skill.id];
                    const score = prog?.smartScore ?? 0;
                    const level = getMasteryLevel(score, prog?.questionsAnswered ?? 0);
                    return (
                      <div
                        key={skill.id}
                        className="rounded-[20px] bg-white border border-[#e0dbce] px-5 py-4 flex items-center justify-between gap-4 hover:border-[#ff9d6d] transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs text-[#686562] flex items-center gap-2">
                            <span>{skill.topicTitle}</span>
                            <span aria-hidden="true">·</span>
                            <span>{MASTERY_META[level].label}</span>
                          </div>
                          <h3 className="text-base font-bold text-[#1d1d1b] mt-0.5 truncate">
                            {skill.title}
                          </h3>
                        </div>
                        <V3PillButton
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleLaunchSkill(skill.id)}
                        >
                          تمرین
                        </V3PillButton>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Personal Growth Mastery Card (No leaderboard per Spec §6) */}
              <div className="lg:col-span-5 narenj-cream-card p-6 flex flex-col justify-between gap-5">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#9e3908]">رشد فردی من</p>
                  <h2 className="text-xl font-bold text-[#1d1d1b]">مدال‌های تسلط تو</h2>
                  <p className="text-sm text-[#3c3c3c]">
                    هر بار مهارت جدیدی را به امتیاز ۸۰، ۹۰ یا ۱۰۰ برسانی، مدال تازه می‌گیری.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="narenj-tray p-3.5 text-center space-y-1">
                    <div className="flex justify-center">
                      <MedalIcon tier="gold" size={30} />
                    </div>
                    <p className="text-lg font-bold text-[#1d1d1b] tabular-nums">
                      {toPersianDigits(masteryStats.gold)}
                    </p>
                    <p className="text-xs text-[#686562]">طلا (۱۰۰)</p>
                  </div>
                  <div className="narenj-tray p-3.5 text-center space-y-1">
                    <div className="flex justify-center">
                      <MedalIcon tier="silver" size={30} />
                    </div>
                    <p className="text-lg font-bold text-[#1d1d1b] tabular-nums">
                      {toPersianDigits(masteryStats.silver)}
                    </p>
                    <p className="text-xs text-[#686562]">نقره (۹۰)</p>
                  </div>
                  <div className="narenj-tray p-3.5 text-center space-y-1">
                    <div className="flex justify-center">
                      <MedalIcon tier="bronze" size={30} />
                    </div>
                    <p className="text-lg font-bold text-[#1d1d1b] tabular-nums">
                      {toPersianDigits(masteryStats.bronze)}
                    </p>
                    <p className="text-xs text-[#686562]">برنز (۸۰)</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setView('progress')}
                  className="text-sm font-bold text-[#ff5c0c] hover:text-[#c74809] text-start cursor-pointer"
                >
                  مشاهده جزئیات نردبان تسلط ←
                </button>
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

      {/* Slide-out Navigation Drawer (Triggered by V3 Orange Hamburger Button) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#1d1d1b]/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-80 max-w-[85vw] bg-white h-full shadow-2xl border-l border-[#e0dbce] p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <NarenjBrandMark compact />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="بستن منو"
                  className="w-9 h-9 rounded-full hover:bg-[#f5f1e4] inline-flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="narenj-cream-card p-4 flex items-center gap-3">
                <img
                  src={avatarSrc}
                  alt={student.firstName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <p className="font-bold text-[#1d1d1b] truncate">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-xs text-[#686562]">{student.className}</p>
                  <p className="text-xs font-bold text-[#ff5c0c] mt-0.5 tabular-nums">
                    {toPersianDigits(student.coins)} سکه
                  </p>
                </div>
              </div>

              <nav className="space-y-1.5">
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
                    className={`w-full h-12 px-4 rounded-[16px] text-sm font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                      view === item.id
                        ? 'bg-[#fff2eb] text-[#ff5c0c]'
                        : 'text-[#3c3c3c] hover:bg-[#f5f1e4]'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="pt-4 border-t border-[#e0dbce] space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setShowSettings(true);
                  }}
                  className="w-full h-11 px-4 rounded-[14px] text-sm font-semibold text-[#3c3c3c] hover:bg-[#f5f1e4] flex items-center gap-3 cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  <span>تغییر آواتار و تنظیمات</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onReplayOnboarding();
                  }}
                  className="w-full h-11 px-4 rounded-[14px] text-sm font-semibold text-[#3c3c3c] hover:bg-[#f5f1e4] flex items-center gap-3 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>مشاهده مجدد تور راهنما</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-[#e0dbce]">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onSwitchToTeacherDemo();
                }}
                className="w-full h-11 px-4 rounded-[14px] bg-[#f5f1e4] hover:bg-[#e0dbce]/60 text-xs font-bold text-[#1d1d1b] flex items-center justify-between gap-2 cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-[#ff5c0c]" />
                  <span>پیش‌نمایش پنل معلم (خانم راد)</span>
                </span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full h-11 px-4 rounded-[14px] text-sm font-semibold text-[#9e3908] hover:bg-[#fff2eb] flex items-center gap-3 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج از حساب کاربری</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Notifications Popover */}
      {showNotifications && (
        <div
          className="fixed left-16 top-1/2 -translate-y-1/2 z-40 w-80 bg-white rounded-[22px] border border-[#e0dbce] shadow-xl p-5 space-y-3"
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
                          className="w-full aspect-square rounded-full object-cover object-top"
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
