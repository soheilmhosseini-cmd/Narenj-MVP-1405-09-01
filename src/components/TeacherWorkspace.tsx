import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Eye,
  Home,
  LogOut,
  Plus,
  Users,
  X,
  Check,
} from 'lucide-react';
import {
  AssignmentRecord,
  ClassStudentRecord,
  DEMO_QUESTIONS_BY_SKILL,
  MASTERY_META,
  MATH_TOPICS,
  SKILLS_CATALOG,
  SkillRecord,
  TeacherAccount,
  getMasteryLevel,
  resolveAvatarSrc,
  toPersianDigits,
} from '../data/narenjData';
import { NarenjBrandMark, V3PillButton } from './V3Stickers';

type TeacherView = 'home' | 'library' | 'assignments' | 'builder' | 'tracking' | 'analytics';

interface TeacherWorkspaceProps {
  teacher: TeacherAccount;
  assignments: AssignmentRecord[];
  classStudents: ClassStudentRecord[];
  onPublishAssignment: (newAssignment: AssignmentRecord) => void;
  onSwitchToStudentDemo: () => void;
  onLogout: () => void;
}

export function TeacherWorkspace({
  teacher,
  assignments,
  classStudents,
  onPublishAssignment,
  onSwitchToStudentDemo,
  onLogout,
}: TeacherWorkspaceProps) {
  const [activeClassId, setActiveClassId] = useState(teacher.classes[0].id);
  const [view, setView] = useState<TeacherView>('home');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [previewSkill, setPreviewSkill] = useState<SkillRecord | null>(null);
  const [analyticsWindow, setAnalyticsWindow] = useState<'7d' | '30d' | 'term'>('7d');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // TCH-11 Assignment Builder State (3-step wizard with mandatory Review step)
  const [builderStep, setBuilderStep] = useState<1 | 2 | 3>(1);
  const [builderSkillIds, setBuilderSkillIds] = useState<string[]>(['skill-area-equal']);
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderRecipientMode, setBuilderRecipientMode] = useState<'all' | 'selected'>('all');
  const [builderSelectedStudentIds, setBuilderSelectedStudentIds] = useState<string[]>([]);
  const [builderDueDate, setBuilderDueDate] = useState('پنج‌شنبه ۶ آذر · ساعت ۲۰:۰۰');
  const [builderInstructions, setBuilderInstructions] = useState('');
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [publishNotice, setPublishNotice] = useState<string | null>(null);

  // TCH-12 Tracking multi-select for Follow-Up assignment
  const [trackingSelectedIds, setTrackingSelectedIds] = useState<string[]>([]);

  const activeClass =
    teacher.classes.find((c) => c.id === activeClassId) ?? teacher.classes[0];

  const studentsInClass = useMemo(
    () => classStudents.filter((s) => s.classId === activeClass.id),
    [classStudents, activeClass.id]
  );

  const assignmentsInClass = useMemo(
    () => assignments.filter((a) => a.classId === activeClass.id),
    [assignments, activeClass.id]
  );

  const trackedAssignment =
    assignmentsInClass.find((a) => a.id === selectedAssignmentId) ?? assignmentsInClass[0];

  const studentsNeedingSupport = useMemo(
    () => studentsInClass.filter((s) => s.needsSupportSkillIds.length > 0),
    [studentsInClass]
  );

  // Duplicate warning check (TCH-016: non-blocking warning in Review step)
  const duplicateAssignmentWarning = useMemo(() => {
    return assignmentsInClass.find((a) =>
      a.skillIds.some((sid) => builderSkillIds.includes(sid))
    );
  }, [assignmentsInClass, builderSkillIds]);

  const openBuilderWithPreset = (preset: {
    skillIds?: string[];
    studentIds?: string[];
    title?: string;
  }) => {
    setBuilderStep(1);
    setBuilderSkillIds(preset.skillIds?.length ? preset.skillIds : ['skill-area-equal']);
    if (preset.studentIds && preset.studentIds.length > 0) {
      setBuilderRecipientMode('selected');
      setBuilderSelectedStudentIds(preset.studentIds);
    } else {
      setBuilderRecipientMode('all');
      setBuilderSelectedStudentIds([]);
    }
    setBuilderTitle(preset.title ?? '');
    setBuilderInstructions('');
    setBuilderError(null);
    setView('builder');
  };

  const handlePublish = () => {
    if (builderSkillIds.length === 0) {
      setBuilderError('لطفاً حداقل یک مهارت انتخاب کنید.');
      setBuilderStep(1);
      return;
    }
    if (builderRecipientMode === 'selected' && builderSelectedStudentIds.length === 0) {
      setBuilderError('لطفاً حداقل یک دانش‌آموز را به عنوان گیرنده انتخاب کنید.');
      setBuilderStep(2);
      return;
    }

    const firstSkill = SKILLS_CATALOG.find((s) => s.id === builderSkillIds[0]);
    const finalTitle =
      builderTitle.trim() ||
      (firstSkill ? `تمرین ${firstSkill.title}` : 'تکلیف جدید ریاضی');

    const created: AssignmentRecord = {
      id: `asg-${Date.now()}`,
      title: finalTitle,
      classId: activeClass.id,
      className: activeClass.name,
      skillIds: builderSkillIds,
      recipientIds: builderRecipientMode === 'all' ? 'all' : builderSelectedStudentIds,
      dueDateLabel: builderDueDate,
      instructions:
        builderInstructions.trim() ||
        'با دقت سوالات را بخوانید و در صورت نیاز از راهنمای رایگان استفاده کنید.',
      createdAtLabel: 'همین الان',
      status: 'active',
    };

    onPublishAssignment(created);
    setSelectedAssignmentId(created.id);
    setPublishNotice(`تکلیف «${created.title}» با موفقیت برای ${activeClass.name} منتشر شد.`);
    setView('tracking');
  };

  const teacherAvatarSrc = resolveAvatarSrc(teacher.avatarId, 'teacher');

  const selectedStudentReport = studentsInClass.find((s) => s.id === selectedStudentId) ?? null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Teacher Header — Clean 3-Zone Top Bar Contract + Single Active Class Switcher */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#e0dbce]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 h-[76px] flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <NarenjBrandMark compact />
            <span className="h-6 w-px bg-[#e0dbce] hidden sm:block" aria-hidden="true" />
            {/* Single Active Class Context Switcher (Spec §7 & §13.2) */}
            <label className="sr-only" htmlFor="class-switcher">
              انتخاب کلاس فعال
            </label>
            <select
              id="class-switcher"
              value={activeClassId}
              onChange={(e) => {
                setActiveClassId(e.target.value);
                setSelectedStudentId(null);
              }}
              className="h-10 px-3.5 rounded-[14px] bg-[#f5f1e4] border border-[#e0dbce] text-sm font-bold text-[#1d1d1b] cursor-pointer"
            >
              {teacher.classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({toPersianDigits(cls.studentCount)} نفر)
                </option>
              ))}
            </select>
          </div>

          <nav
            aria-label="منوی اصلی معلم"
            className="hidden lg:flex items-center gap-6 text-sm font-semibold text-[#3c3c3c]"
          >
            {(
              [
                { id: 'home', label: 'نمای امروز', icon: Home },
                { id: 'library', label: 'کتابخانه مهارت‌ها', icon: BookOpen },
                { id: 'assignments', label: 'تکلیف‌ها', icon: ClipboardList },
                { id: 'analytics', label: 'تحلیل کلاس', icon: BarChart3 },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setView(item.id);
                  setSelectedStudentId(null);
                }}
                className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  view === item.id ||
                  (item.id === 'assignments' && (view === 'tracking' || view === 'builder'))
                    ? 'text-[#ff5c0c] border-[#ff5c0c]'
                    : 'border-transparent hover:text-[#1d1d1b]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <V3PillButton
              type="button"
              size="sm"
              showArrow={false}
              onClick={() => openBuilderWithPreset({})}
            >
              <Plus className="w-4 h-4" />
              <span>تکلیف جدید</span>
            </V3PillButton>

            <button
              type="button"
              onClick={onSwitchToStudentDemo}
              title="مشاهده فضای دانش‌آموز (ماهور)"
              className="h-10 px-3 rounded-[14px] bg-[#f5f1e4] hover:bg-[#e0dbce]/70 text-xs font-bold text-[#1d1d1b] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#ff5c0c]" />
              <span className="hidden sm:inline">نمای دانش‌آموز</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              aria-label="خروج از حساب معلم"
              className="w-10 h-10 rounded-[14px] hover:bg-[#fff2eb] text-[#686562] hover:text-[#9e3908] inline-flex items-center justify-center cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex lg:hidden items-center gap-2 px-4 pb-3 overflow-x-auto">
          {(
            [
              { id: 'home', label: 'نمای امروز' },
              { id: 'library', label: 'کتابخانه' },
              { id: 'assignments', label: 'تکلیف‌ها' },
              { id: 'analytics', label: 'تحلیل کلاس' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`px-3.5 py-1.5 rounded-[50px] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                view === item.id
                  ? 'bg-[#ff5c0c] text-white'
                  : 'bg-[#f5f1e4] text-[#3c3c3c]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-5 md:px-9 py-7 space-y-8">
        {publishNotice && (
          <div className="p-4 rounded-[18px] bg-[#eef9e6] border border-[#8ed461] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-sm font-bold text-[#1d1d1b]">
              <CheckCircle2 className="w-5 h-5 text-[#3f7a1d] shrink-0" />
              <span>{publishNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setPublishNotice(null)}
              className="text-[#686562] hover:text-[#1d1d1b] cursor-pointer"
              aria-label="بستن پیام"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ==================== TCH-01: TEACHER HOME ==================== */}
        {view === 'home' && (
          <div className="space-y-8">
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={teacherAvatarSrc}
                  alt={teacher.fullName}
                  className="w-16 h-16 rounded-full object-cover object-top border-2 border-[#ffcbb1]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="text-sm text-[#686562]">
                    {teacher.schoolName} · {teacher.subject}
                  </p>
                  <h1 className="text-[26px] md:text-[32px] font-bold text-[#1d1d1b]">
                    خوش آمدید، {teacher.fullName}
                  </h1>
                </div>
              </div>
              <div className="text-sm text-[#686562]">
                کد ورود دانش‌آموزان این کلاس:{' '}
                <span dir="ltr" className="font-bold text-[#9e3908] bg-[#fff2eb] px-2.5 py-1 rounded-[10px]">
                  {activeClass.schoolCode}
                </span>
              </div>
            </section>

            {/* Class Attention Metrics (Every metric carries explicit denominator & window per P-14) */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="narenj-cream-card p-5 space-y-1.5">
                <p className="text-xs font-semibold text-[#686562]">
                  فعالیت کلاس در ۷ روز اخیر
                </p>
                <p className="text-2xl font-bold text-[#1d1d1b] tabular-nums">
                  {toPersianDigits(
                    studentsInClass.filter((s) => s.activeDaysThisWeek >= 2).length
                  )}{' '}
                  از {toPersianDigits(studentsInClass.length)} دانش‌آموز
                </p>
                <p className="text-xs text-[#3c3c3c]">حداقل ۲ روز تمرین ثبت شده در این هفته</p>
              </div>

              <div className="narenj-cream-card p-5 space-y-1.5">
                <p className="text-xs font-semibold text-[#686562]">
                  تکلیف‌های فعال در {activeClass.name}
                </p>
                <p className="text-2xl font-bold text-[#1d1d1b] tabular-nums">
                  {toPersianDigits(assignmentsInClass.length)} تکلیف
                </p>
                <button
                  type="button"
                  onClick={() => setView('assignments')}
                  className="text-xs font-bold text-[#ff5c0c] hover:underline cursor-pointer"
                >
                  مشاهده وضعیت انجام تکلیف‌ها ←
                </button>
              </div>

              <div className="narenj-cream-card p-5 space-y-1.5">
                <p className="text-xs font-semibold text-[#686562]">
                  دانش‌آموزان نیازمند تمرین تکمیلی (امتیاز زیر ۶۰)
                </p>
                <p className="text-2xl font-bold text-[#9e3908] tabular-nums">
                  {toPersianDigits(studentsNeedingSupport.length)} از{' '}
                  {toPersianDigits(studentsInClass.length)} نفر
                </p>
                <button
                  type="button"
                  onClick={() => setView('analytics')}
                  className="text-xs font-bold text-[#ff5c0c] hover:underline cursor-pointer"
                >
                  بررسی و ارسال تمرین پیگیری ←
                </button>
              </div>
            </section>

            {/* Two-Column Action Focus: Needs Support + Active Assignments */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 rounded-[24px] border border-[#e0dbce] bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#1d1d1b]">
                    نیازمند توجه آموزشی در {activeClass.name}
                  </h2>
                  <span className="text-xs text-[#686562]">مبنا: امتیاز زیر ۶۰</span>
                </div>

                {studentsNeedingSupport.length === 0 ? (
                  <p className="text-sm text-[#686562] py-4">
                    در بازه ۷ روز اخیر، همه دانش‌آموزان این کلاس در مهارت‌های تکلیف‌شده بالای امتیاز ۶۰ بوده‌اند.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {studentsNeedingSupport.map((stu) => {
                      const focusSkill = SKILLS_CATALOG.find(
                        (sk) => sk.id === stu.needsSupportSkillIds[0]
                      );
                      return (
                        <div
                          key={stu.id}
                          className="p-4 rounded-[18px] bg-[#f5f1e4]/70 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={resolveAvatarSrc(stu.avatarId, 'student')}
                              alt={stu.name}
                              className="w-10 h-10 rounded-full object-cover object-top shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentId(stu.id);
                                  setView('analytics');
                                }}
                                className="text-sm font-bold text-[#1d1d1b] hover:text-[#ff5c0c] cursor-pointer"
                              >
                                {stu.name}
                              </button>
                              <p className="text-xs text-[#686562] truncate">
                                مهارت نیازمند تمرین: {focusSkill?.title}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              openBuilderWithPreset({
                                skillIds: stu.needsSupportSkillIds,
                                studentIds: [stu.id],
                                title: `تمرین تقویتی برای ${stu.name}`,
                              })
                            }
                            className="h-9 px-3.5 rounded-[50px] bg-white border border-[#e0dbce] hover:border-[#ff5c0c] text-xs font-bold text-[#1d1d1b] whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            تکلیف پیگیری
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-6 rounded-[24px] border border-[#e0dbce] bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#1d1d1b]">تکلیف‌های فعال کلاس</h2>
                  <button
                    type="button"
                    onClick={() => openBuilderWithPreset({})}
                    className="text-xs font-bold text-[#ff5c0c] hover:underline cursor-pointer"
                  >
                    + ساخت تکلیف جدید
                  </button>
                </div>

                <div className="space-y-3">
                  {assignmentsInClass.map((asg) => {
                    const completedCount = studentsInClass.filter(
                      (st) => (st.skillScores[asg.skillIds[0]] ?? 0) >= 80
                    ).length;
                    return (
                      <div
                        key={asg.id}
                        className="p-4 rounded-[18px] border border-[#e0dbce] hover:border-[#ff9d6d] transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0 space-y-1">
                          <h3 className="text-sm font-bold text-[#1d1d1b] truncate">
                            {asg.title}
                          </h3>
                          <p className="text-xs text-[#686562]">
                            مهلت: {asg.dueDateLabel} · تسلط:{' '}
                            <strong className="text-[#1d1d1b] tabular-nums">
                              {toPersianDigits(completedCount)} از{' '}
                              {toPersianDigits(studentsInClass.length)} نفر
                            </strong>
                          </p>
                        </div>
                        <V3PillButton
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedAssignmentId(asg.id);
                            setTrackingSelectedIds([]);
                            setView('tracking');
                          }}
                        >
                          پیگیری
                        </V3PillButton>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ==================== TCH-02 / TCH-05: SKILL LIBRARY & PREVIEW ==================== */}
        {view === 'library' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#9e3908]">
                  پیش‌نمایش سوالات قبل از تکلیف‌دهی (دروازه اعتماد معلم)
                </p>
                <h1 className="text-[28px] font-bold text-[#1d1d1b]">
                  کتابخانه مهارت‌های ریاضی پایه چهارم
                </h1>
              </div>
            </div>

            <div className="space-y-4">
              {MATH_TOPICS.map((topic) => {
                const skills = SKILLS_CATALOG.filter((s) => s.topicCode === topic.code);
                if (skills.length === 0) return null;
                return (
                  <section
                    key={topic.code}
                    className="rounded-[24px] border border-[#e0dbce] bg-white overflow-hidden"
                  >
                    <div className="px-6 py-4 bg-[#f5f1e4] flex items-center gap-3">
                      <span
                        className="w-8 h-8 rounded-[10px] text-white text-sm font-bold inline-flex items-center justify-center"
                        style={{ backgroundColor: topic.accent }}
                      >
                        {topic.code}
                      </span>
                      <h2 className="text-base font-bold text-[#1d1d1b]">{topic.title}</h2>
                    </div>

                    <div className="divide-y divide-[#f5f1e4]">
                      {skills.map((skill) => {
                        const qCount = DEMO_QUESTIONS_BY_SKILL[skill.id]?.length ?? 0;
                        return (
                          <div
                            key={skill.id}
                            className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="space-y-1 max-w-2xl">
                              <div className="flex items-center gap-2 text-xs text-[#686562]">
                                <span dir="ltr" className="font-semibold">
                                  {skill.code}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{skill.subtopicTitle}</span>
                                <span aria-hidden="true">·</span>
                                <span>{toPersianDigits(qCount)} سوال نمونه آموزشی</span>
                              </div>
                              <h3 className="text-base font-bold text-[#1d1d1b]">{skill.title}</h3>
                              <p className="text-xs text-[#3c3c3c]">{skill.objective}</p>
                              {skill.misconception && (
                                <p className="text-xs text-[#9e3908]">
                                  کج‌فهمی رایج: {skill.misconception}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewSkill(skill)}
                                className="h-10 px-4 rounded-[50px] bg-[#f5f1e4] hover:bg-[#e0dbce]/80 text-xs font-bold text-[#1d1d1b] inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                                <span>پیش‌نمایش سوالات</span>
                              </button>

                              <V3PillButton
                                type="button"
                                size="sm"
                                showArrow={false}
                                onClick={() =>
                                  openBuilderWithPreset({
                                    skillIds: [skill.id],
                                    title: `تکلیف ${skill.title}`,
                                  })
                                }
                              >
                                تکلیف دادن
                              </V3PillButton>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== ASSIGNMENTS LIST ==================== */}
        {view === 'assignments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[#686562]">{activeClass.name}</p>
                <h1 className="text-[28px] font-bold text-[#1d1d1b]">مدیریت تکلیف‌ها</h1>
              </div>
              <V3PillButton type="button" onClick={() => openBuilderWithPreset({})}>
                ساخت تکلیف جدید
              </V3PillButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {assignmentsInClass.map((asg) => (
                <article
                  key={asg.id}
                  className="narenj-cream-card p-6 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#686562]">
                      <span>انتشار: {asg.createdAtLabel}</span>
                      <span>مهلت: {asg.dueDateLabel}</span>
                    </div>
                    <h2 className="text-lg font-bold text-[#1d1d1b]">{asg.title}</h2>
                    <p className="text-sm text-[#3c3c3c]">{asg.instructions}</p>
                    <p className="text-xs text-[#686562]">
                      گیرندگان:{' '}
                      {asg.recipientIds === 'all'
                        ? `همه دانش‌آموزان ${asg.className}`
                        : `${toPersianDigits(asg.recipientIds.length)} دانش‌آموز انتخاب‌شده`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#e0dbce]">
                    <span className="text-xs font-bold text-[#9e3908]">
                      {toPersianDigits(asg.skillIds.length)} مهارت
                    </span>
                    <V3PillButton
                      type="button"
                      size="sm"
                      onClick={() => {
                        setSelectedAssignmentId(asg.id);
                        setTrackingSelectedIds([]);
                        setView('tracking');
                      }}
                    >
                      گزارش و پیگیری
                    </V3PillButton>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TCH-11: 3-STEP ASSIGNMENT BUILDER ==================== */}
        {view === 'builder' && (
          <div className="max-w-[880px] mx-auto space-y-6">
            <div>
              <p className="text-sm font-semibold text-[#9e3908]">
                ساخت تکلیف برای {activeClass.name}
              </p>
              <h1 className="text-[28px] font-bold text-[#1d1d1b]">
                طراحی و انتشار تکلیف جدید
              </h1>
            </div>

            {/* Step Indicator */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { step: 1, label: '۱. انتخاب مهارت‌ها' },
                { step: 2, label: '۲. گیرندگان و مهلت' },
                { step: 3, label: '۳. بازبینی و انتشار' },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setBuilderStep(s.step as 1 | 2 | 3)}
                  className={`h-12 rounded-[16px] text-sm font-bold border transition-colors cursor-pointer ${
                    builderStep === s.step
                      ? 'bg-[#ff5c0c] text-white border-[#ff5c0c]'
                      : builderStep > s.step
                      ? 'bg-[#eef9e6] text-[#3f7a1d] border-[#8ed461]'
                      : 'bg-[#f5f1e4] text-[#686562] border-[#e0dbce]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {builderError && (
              <div
                role="alert"
                className="p-3.5 rounded-[16px] bg-[#fff2eb] border border-[#ff705d] text-sm font-semibold text-[#9e3908]"
              >
                {builderError}
              </div>
            )}

            <div className="narenj-cream-card p-6 md:p-8 space-y-6">
              {builderStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-[#1d1d1b]">
                    مهارت‌های مورد نظر را انتخاب کنید
                  </h2>
                  <p className="text-xs text-[#686562]">
                    ترتیب انجام مهارت‌ها برای دانش‌آموزان اختیاری است و می‌توانند هر مهارت را به دلخواه شروع کنند.
                  </p>
                  <div className="space-y-2.5">
                    {SKILLS_CATALOG.map((sk) => {
                      const checked = builderSkillIds.includes(sk.id);
                      return (
                        <label
                          key={sk.id}
                          className={`flex items-start gap-3 p-4 rounded-[16px] border cursor-pointer transition-colors ${
                            checked
                              ? 'bg-white border-[#ff5c0c]'
                              : 'bg-white/70 border-[#e0dbce] hover:bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setBuilderError(null);
                              setBuilderSkillIds((prev) =>
                                prev.includes(sk.id)
                                  ? prev.filter((id) => id !== sk.id)
                                  : [...prev, sk.id]
                              );
                            }}
                            className="mt-1 w-5 h-5 accent-[#ff5c0c]"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#1d1d1b]">{sk.title}</p>
                            <p className="text-xs text-[#686562] mt-0.5">
                              {sk.topicTitle} · {sk.objective}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {builderStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="asg-title"
                      className="block text-sm font-bold text-[#1d1d1b] mb-2"
                    >
                      عنوان تکلیف
                    </label>
                    <input
                      id="asg-title"
                      type="text"
                      value={builderTitle}
                      onChange={(e) => setBuilderTitle(e.target.value)}
                      placeholder="مثلاً: تمرین هفتگی کسرها و مساحت"
                      className="w-full h-12 px-4 rounded-[16px] bg-white border border-[#e0dbce] text-sm"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <span className="block text-sm font-bold text-[#1d1d1b]">گیرندگان تکلیف</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setBuilderRecipientMode('all')}
                        className={`h-12 rounded-[14px] text-sm font-bold border cursor-pointer ${
                          builderRecipientMode === 'all'
                            ? 'bg-white border-[#ff5c0c] text-[#1d1d1b]'
                            : 'bg-white/60 border-[#e0dbce] text-[#686562]'
                        }`}
                      >
                        همه دانش‌آموزان ({toPersianDigits(studentsInClass.length)} نفر)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuilderRecipientMode('selected')}
                        className={`h-12 rounded-[14px] text-sm font-bold border cursor-pointer ${
                          builderRecipientMode === 'selected'
                            ? 'bg-white border-[#ff5c0c] text-[#1d1d1b]'
                            : 'bg-white/60 border-[#e0dbce] text-[#686562]'
                        }`}
                      >
                        دانش‌آموزان انتخاب‌شده
                      </button>
                    </div>

                    {builderRecipientMode === 'selected' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                        {studentsInClass.map((st) => {
                          const selected = builderSelectedStudentIds.includes(st.id);
                          return (
                            <label
                              key={st.id}
                              className={`flex items-center gap-2.5 p-3 rounded-[14px] border cursor-pointer ${
                                selected ? 'bg-white border-[#ff5c0c]' : 'bg-white/70 border-[#e0dbce]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() =>
                                  setBuilderSelectedStudentIds((prev) =>
                                    prev.includes(st.id)
                                      ? prev.filter((id) => id !== st.id)
                                      : [...prev, st.id]
                                  )
                                }
                                className="w-4 h-4 accent-[#ff5c0c]"
                              />
                              <span className="text-sm font-semibold text-[#1d1d1b]">
                                {st.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="asg-due"
                      className="block text-sm font-bold text-[#1d1d1b] mb-2"
                    >
                      مهلت انجام (به وقت ایران)
                    </label>
                    <input
                      id="asg-due"
                      type="text"
                      value={builderDueDate}
                      onChange={(e) => setBuilderDueDate(e.target.value)}
                      className="w-full h-12 px-4 rounded-[16px] bg-white border border-[#e0dbce] text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="asg-note"
                      className="block text-sm font-bold text-[#1d1d1b] mb-2"
                    >
                      توضیح یا راهنمای معلم برای دانش‌آموزان (اختیاری)
                    </label>
                    <textarea
                      id="asg-note"
                      rows={3}
                      value={builderInstructions}
                      onChange={(e) => setBuilderInstructions(e.target.value)}
                      placeholder="پیام کوتاه و تشویقی برای دانش‌آموزان..."
                      className="w-full p-4 rounded-[16px] bg-white border border-[#e0dbce] text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Mandatory Review Step (TCH-11 §17) */}
              {builderStep === 3 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-[#1d1d1b]">
                    بازبینی نهایی پیش از انتشار
                  </h2>

                  {/* Non-blocking Duplicate Warning (TCH-016) */}
                  {duplicateAssignmentWarning && (
                    <div className="p-4 rounded-[16px] bg-[#f9f4ae] border border-[#f5e211] flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-[#9e3908] shrink-0 mt-0.5" />
                      <div className="text-sm text-[#1d1d1b]">
                        <p className="font-bold">هشدار تکلیف مشابه (غیرمسدودکننده)</p>
                        <p className="text-xs text-[#3c3c3c] mt-0.5">
                          حداقل یکی از این مهارت‌ها پیش‌تر در تکلیف «{duplicateAssignmentWarning.title}» برای {activeClass.name} ارسال شده است. در صورت نیاز همچنان می‌توانید منتشر کنید.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-[20px] p-5 border border-[#e0dbce] space-y-3 text-sm">
                    <div className="flex justify-between gap-4 pb-2 border-b border-[#f5f1e4]">
                      <span className="text-[#686562]">کلاس و گیرندگان:</span>
                      <span className="font-bold text-[#1d1d1b]">
                        {activeClass.name} —{' '}
                        {builderRecipientMode === 'all'
                          ? `همه دانش‌آموزان (${toPersianDigits(studentsInClass.length)} نفر)`
                          : `${toPersianDigits(builderSelectedStudentIds.length)} دانش‌آموز انتخاب‌شده`}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 pb-2 border-b border-[#f5f1e4]">
                      <span className="text-[#686562]">مهلت انجام:</span>
                      <span className="font-bold text-[#1d1d1b]">{builderDueDate}</span>
                    </div>
                    <div>
                      <span className="text-[#686562] block mb-1.5">مهارت‌های انتخاب‌شده:</span>
                      <ul className="space-y-1">
                        {builderSkillIds.map((sid) => {
                          const sk = SKILLS_CATALOG.find((s) => s.id === sid);
                          return (
                            <li key={sid} className="font-bold text-[#1d1d1b] flex items-center gap-2">
                              <Check className="w-4 h-4 text-[#59982c]" />
                              <span>{sk?.title}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Step Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-[#e0dbce]">
                <V3PillButton
                  type="button"
                  variant="secondary"
                  arrowDirection="back"
                  onClick={() => {
                    if (builderStep === 1) setView('assignments');
                    else setBuilderStep((s) => (s - 1) as 1 | 2);
                  }}
                >
                  {builderStep === 1 ? 'انصراف' : 'مرحله قبل'}
                </V3PillButton>

                {builderStep < 3 ? (
                  <V3PillButton
                    type="button"
                    onClick={() => {
                      setBuilderError(null);
                      if (builderStep === 1 && builderSkillIds.length === 0) {
                        setBuilderError('لطفاً حداقل یک مهارت را انتخاب کنید.');
                        return;
                      }
                      if (
                        builderStep === 2 &&
                        builderRecipientMode === 'selected' &&
                        builderSelectedStudentIds.length === 0
                      ) {
                        setBuilderError('لطفاً حداقل یک دانش‌آموز را انتخاب کنید.');
                        return;
                      }
                      setBuilderStep((s) => (s + 1) as 2 | 3);
                    }}
                  >
                    مرحله بعد
                  </V3PillButton>
                ) : (
                  <V3PillButton type="button" size="lg" onClick={handlePublish}>
                    انتشار تکلیف
                  </V3PillButton>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TCH-12: ASSIGNMENT TRACKING ==================== */}
        {view === 'tracking' && trackedAssignment && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[#686562]">
                  {trackedAssignment.className} · مهلت: {trackedAssignment.dueDateLabel}
                </p>
                <h1 className="text-[26px] md:text-[32px] font-bold text-[#1d1d1b]">
                  پیگیری تکلیف: {trackedAssignment.title}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                {trackingSelectedIds.length > 0 && (
                  <V3PillButton
                    type="button"
                    size="sm"
                    onClick={() =>
                      openBuilderWithPreset({
                        skillIds: trackedAssignment.skillIds,
                        studentIds: trackingSelectedIds,
                        title: `تکلیف پیگیری (${toPersianDigits(trackingSelectedIds.length)} دانش‌آموز)`,
                      })
                    }
                  >
                    ارسال تمرین جبرانی به {toPersianDigits(trackingSelectedIds.length)} نفر
                  </V3PillButton>
                )}
                <V3PillButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  showArrow={false}
                  onClick={() => setView('assignments')}
                >
                  بازگشت به فهرست
                </V3PillButton>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#e0dbce] bg-white overflow-hidden">
              <div className="px-6 py-4 bg-[#f5f1e4] flex flex-wrap items-center justify-between gap-2 text-xs text-[#3c3c3c]">
                <span>برای ارسال تمرین پیگیری، دانش‌آموزان مورد نظر را انتخاب کنید.</span>
                <span>پاسخ‌های ثبت‌شده دانش‌آموزان در هر ویرایش محفوظ می‌ماند.</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-start">
                  <thead className="border-b border-[#e0dbce] text-xs text-[#686562] bg-[#faf9f6]">
                    <tr>
                      <th className="py-3.5 px-4 text-start w-12">انتخاب</th>
                      <th className="py-3.5 px-4 text-start">نام دانش‌آموز</th>
                      <th className="py-3.5 px-4 text-start">امتیاز هوشمند</th>
                      <th className="py-3.5 px-4 text-start">وضعیت تسلط</th>
                      <th className="py-3.5 px-4 text-start">گزارش فردی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f1e4]">
                    {studentsInClass.map((stu) => {
                      const focusSkillId = trackedAssignment.skillIds[0];
                      const score = stu.skillScores[focusSkillId] ?? 0;
                      const level = getMasteryLevel(score, score > 0 ? 3 : 0);
                      const meta = MASTERY_META[level];
                      const checked = trackingSelectedIds.includes(stu.id);

                      return (
                        <tr key={stu.id} className="hover:bg-[#faf9f6]">
                          <td className="py-3.5 px-4">
                            <input
                              type="checkbox"
                              aria-label={`انتخاب ${stu.name}`}
                              checked={checked}
                              onChange={() =>
                                setTrackingSelectedIds((prev) =>
                                  prev.includes(stu.id)
                                    ? prev.filter((id) => id !== stu.id)
                                    : [...prev, stu.id]
                                )
                              }
                              className="w-4 h-4 accent-[#ff5c0c]"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#1d1d1b]">{stu.name}</td>
                          <td className="py-3.5 px-4 font-bold tabular-nums">
                            {toPersianDigits(score)} از ۱۰۰
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className="inline-block px-2.5 py-1 rounded-[10px] text-xs font-semibold"
                              style={{
                                backgroundColor: meta.bg,
                                color: meta.color,
                                border: `1px solid ${meta.border}`,
                              }}
                            >
                              {meta.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudentId(stu.id);
                                setView('analytics');
                              }}
                              className="text-xs font-bold text-[#ff5c0c] hover:underline cursor-pointer"
                            >
                              مشاهده گزارش ←
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TCH-18 & TCH-19: CLASS & STUDENT ANALYTICS ==================== */}
        {view === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[#686562]">
                  {selectedStudentReport
                    ? `تحلیل فردی · ${activeClass.name}`
                    : `تحلیل عملکرد کلاس · ${activeClass.name}`}
                </p>
                <h1 className="text-[28px] font-bold text-[#1d1d1b]">
                  {selectedStudentReport ? selectedStudentReport.name : 'گزارش پیشرفت و نیازهای آموزشی'}
                </h1>
              </div>

              <div className="flex items-center gap-2 bg-[#f5f1e4] p-1 rounded-[14px]">
                {(
                  [
                    { id: '7d', label: '۷ روز اخیر' },
                    { id: '30d', label: '۳۰ روز اخیر' },
                    { id: 'term', label: 'کل ترم' },
                  ] as const
                ).map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setAnalyticsWindow(w.id)}
                    className={`px-3.5 py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer ${
                      analyticsWindow === w.id
                        ? 'bg-white text-[#1d1d1b] shadow-sm'
                        : 'text-[#686562]'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedStudentReport ? (
              /* TCH-19 Individual Student Analytics */
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => setSelectedStudentId(null)}
                  className="text-sm font-bold text-[#ff5c0c] hover:underline cursor-pointer"
                >
                  → بازگشت به نمای کلی کلاس
                </button>

                <div className="narenj-cream-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <img
                      src={resolveAvatarSrc(selectedStudentReport.avatarId, 'student')}
                      alt={selectedStudentReport.name}
                      className="w-16 h-16 rounded-full object-cover object-top border-2 border-white"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h2 className="text-xl font-bold text-[#1d1d1b]">
                        {selectedStudentReport.name}
                      </h2>
                      <p className="text-sm text-[#3c3c3c]">
                        تکلیف‌های کامل شده: {toPersianDigits(selectedStudentReport.assignedCompleted)} از{' '}
                        {toPersianDigits(selectedStudentReport.assignedTotal)} · تمرین آزاد:{' '}
                        {toPersianDigits(selectedStudentReport.freePracticeCount)} جلسه · زمان تمرین:{' '}
                        {toPersianDigits(selectedStudentReport.minutesPracticed)} دقیقه
                      </p>
                    </div>
                  </div>
                  <V3PillButton
                    type="button"
                    onClick={() =>
                      openBuilderWithPreset({
                        skillIds:
                          selectedStudentReport.needsSupportSkillIds.length > 0
                            ? selectedStudentReport.needsSupportSkillIds
                            : ['skill-area-equal'],
                        studentIds: [selectedStudentReport.id],
                        title: `تمرین پیشنهادی برای ${selectedStudentReport.name}`,
                      })
                    }
                  >
                    ارسال تکلیف پیگیری
                  </V3PillButton>
                </div>

                <div className="rounded-[24px] border border-[#e0dbce] bg-white divide-y divide-[#f5f1e4]">
                  {SKILLS_CATALOG.slice(0, 4).map((sk) => {
                    const score = selectedStudentReport.skillScores[sk.id] ?? 0;
                    const level = getMasteryLevel(score, score > 0 ? 3 : 0);
                    const meta = MASTERY_META[level];
                    return (
                      <div
                        key={sk.id}
                        className="px-6 py-4 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="text-sm font-bold text-[#1d1d1b]">{sk.title}</p>
                          <p className="text-xs text-[#686562]">{sk.topicTitle}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className="px-2.5 py-1 rounded-[10px] text-xs font-semibold"
                            style={{ backgroundColor: meta.bg, color: meta.color }}
                          >
                            {meta.label}
                          </span>
                          <span className="text-sm font-bold tabular-nums w-14 text-left">
                            {toPersianDigits(score)} / ۱۰۰
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* TCH-18 Class Analytics — Distinguishes Assigned vs Free Practice (BM-IXL-004) */
              <div className="rounded-[24px] border border-[#e0dbce] bg-white overflow-hidden">
                <div className="px-6 py-4 bg-[#f5f1e4] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1d1d1b]">
                    <Users className="w-4 h-4 text-[#ff5c0c]" />
                    <span>فهرست دانش‌آموزان ({toPersianDigits(studentsInClass.length)} نفر)</span>
                  </div>
                  <span className="text-xs text-[#686562]">
                    تفکیک تمرین تکلیف‌شده از تمرین آزاد
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-start">
                    <thead className="border-b border-[#e0dbce] text-xs text-[#686562] bg-[#faf9f6]">
                      <tr>
                        <th className="py-3.5 px-5 text-start">دانش‌آموز</th>
                        <th className="py-3.5 px-5 text-start">تمرین تکلیف‌شده</th>
                        <th className="py-3.5 px-5 text-start">تمرین آزاد</th>
                        <th className="py-3.5 px-5 text-start">میانگین امتیاز هوشمند</th>
                        <th className="py-3.5 px-5 text-start">اقدام</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f5f1e4]">
                      {studentsInClass.map((stu) => (
                        <tr key={stu.id} className="hover:bg-[#faf9f6]">
                          <td className="py-3.5 px-5 font-bold text-[#1d1d1b]">{stu.name}</td>
                          <td className="py-3.5 px-5 tabular-nums">
                            {toPersianDigits(stu.assignedCompleted)} از{' '}
                            {toPersianDigits(stu.assignedTotal)}
                          </td>
                          <td className="py-3.5 px-5 tabular-nums">
                            {toPersianDigits(stu.freePracticeCount)} جلسه
                          </td>
                          <td className="py-3.5 px-5 font-bold tabular-nums">
                            {toPersianDigits(stu.avgSmartScore)} / ۱۰۰
                          </td>
                          <td className="py-3.5 px-5">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentId(stu.id)}
                              className="text-xs font-bold text-[#ff5c0c] hover:underline cursor-pointer"
                            >
                              گزارش فردی ←
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* TCH-05 Read-Only Teacher Question Preview Modal */}
      {previewSkill && (
        <div
          className="fixed inset-0 z-50 bg-[#1d1d1b]/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-title"
        >
          <div className="bg-white rounded-[24px] max-w-2xl w-full p-6 border border-[#e0dbce] shadow-xl max-h-[85vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#9e3908]">
                  پیش‌نمایش سوالات معلم (فقط‌خواندنی · محتوای نمونه آموزشی)
                </p>
                <h2 id="preview-modal-title" className="text-xl font-bold text-[#1d1d1b] mt-0.5">
                  {previewSkill.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSkill(null)}
                aria-label="بستن پیش‌نمایش"
                className="w-9 h-9 rounded-full hover:bg-[#f5f1e4] inline-flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {(DEMO_QUESTIONS_BY_SKILL[previewSkill.id] ?? []).map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-[18px] bg-[#f5f1e4] p-4 space-y-2 border border-[#e0dbce]"
                >
                  <p className="text-xs font-bold text-[#9e3908]">
                    سوال نمونه {toPersianDigits(idx + 1)}
                  </p>
                  <p className="text-sm font-bold text-[#1d1d1b]">{q.prompt}</p>
                  <p className="text-xs text-[#3f7a1d] font-semibold">
                    پاسخ درست: {q.correctAnswerDisplay}
                  </p>
                  <p className="text-xs text-[#3c3c3c]">توضیح آموزشی: {q.explanation}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#e0dbce]">
              <V3PillButton
                type="button"
                variant="secondary"
                showArrow={false}
                onClick={() => setPreviewSkill(null)}
              >
                بستن
              </V3PillButton>
              <V3PillButton
                type="button"
                onClick={() => {
                  const sk = previewSkill;
                  setPreviewSkill(null);
                  openBuilderWithPreset({
                    skillIds: [sk.id],
                    title: `تکلیف ${sk.title}`,
                  });
                }}
              >
                تکلیف دادن این مهارت
              </V3PillButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
