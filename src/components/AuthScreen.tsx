import React, { useState } from 'react';
import {
  KeyRound,
  Mail,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  X,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { NarenjBrandMark, V3PillButton, StickerSubmitted, StickerCorrect } from './V3Stickers';
import { UserRole } from '../data/narenjData';

interface AuthScreenProps {
  onLogin: (role: UserRole, schoolCode: string, username: string) => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [schoolCode, setSchoolCode] = useState('SARV-402');
  const [username, setUsername] = useState('mahoor.karimi');
  const [password, setPassword] = useState('••••••••');
  const [error, setError] = useState<string | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);

  // Recovery modal state (Confirmed §9: supports BOTH Email and SMS)
  const [recoveryChannel, setRecoveryChannel] = useState<'sms' | 'email'>('sms');
  const [recoveryContact, setRecoveryContact] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedCode = schoolCode.trim().toUpperCase();
    const normalizedUser = username.trim();

    if (!normalizedCode) {
      setError('لطفاً کد مدرسه یا کد کلاس را وارد کنید.');
      return;
    }
    if (!normalizedUser) {
      setError('لطفاً نام کاربری خود را وارد کنید.');
      return;
    }
    if (!password.trim()) {
      setError('لطفاً رمز عبور را وارد کنید.');
      return;
    }

    // Binding Owner Clarification §15:
    // School code automatically resolves the user role (no separate Student/Teacher role picker screen).
    const isTeacherCode =
      normalizedCode.startsWith('TEACH') ||
      normalizedCode.startsWith('T-') ||
      normalizedUser.toLowerCase().includes('rad') ||
      normalizedUser.toLowerCase().includes('teacher');

    if (
      !['SARV-402', 'ARGH-402', 'TEACH-402'].includes(normalizedCode) &&
      !normalizedCode.startsWith('TEACH') &&
      !normalizedCode.startsWith('SARV')
    ) {
      setError(
        'کد مدرسه معتبر نیست. برای ورود آزمایشی از کد SARV-402 (دانش‌آموز) یا TEACH-402 (معلم) استفاده کنید.'
      );
      return;
    }

    onLogin(isTeacherCode ? 'teacher' : 'student', normalizedCode, normalizedUser);
  };

  const fillDemoAccount = (preset: 'student' | 'teacher') => {
    setError(null);
    if (preset === 'student') {
      setSchoolCode('SARV-402');
      setUsername('mahoor.karimi');
      setPassword('narenj1405');
    } else {
      setSchoolCode('TEACH-402');
      setUsername('maryam.rad');
      setPassword('teacher1405');
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    if (!recoveryContact.trim()) {
      setRecoveryError(
        recoveryChannel === 'sms'
          ? 'لطفاً شماره موبایل ثبت‌شده را وارد کنید.'
          : 'لطفاً نشانی ایمیل ثبت‌شده را وارد کنید.'
      );
      return;
    }
    setRecoverySent(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Clean Top Bar (3-zone contract adapted for auth entry) */}
      <header className="w-full border-b border-[#e0dbce] bg-white">
        <div className="max-w-[1200px] mx-auto px-5 md:px-9 h-[76px] flex items-center justify-between gap-8">
          <NarenjBrandMark />
          <div className="hidden md:flex items-center gap-6 text-sm text-[#686562]">
            <span>سامانه یادگیری و تمرین ریاضی پایه چهارم</span>
            <span aria-hidden="true">·</span>
            <span>ویژه مدارس و دانش‌آموزان ۹ تا ۱۱ سال</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowRecovery(true);
              setRecoverySent(false);
              setRecoveryError(null);
            }}
            className="text-sm font-semibold text-[#9e3908] hover:text-[#ff5c0c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            بازیابی حساب کاربری
          </button>
        </div>
      </header>

      {/* Main Split Stage */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-5 md:px-9 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        {/* Right Column (RTL Start): School-Code Sign-In Card */}
        <section className="lg:col-span-6 flex flex-col justify-center">
          <div className="narenj-cream-card p-6 md:p-9">
            <div className="mb-7">
              <p className="text-sm font-semibold text-[#9e3908] mb-2">
                ورود با کد مدرسه
              </p>
              <h1 className="text-[30px] md:text-[36px] font-bold leading-[1.35] text-[#1d1d1b] text-balance">
                به فضای یادگیری نارنج خوش آمدی!
              </h1>
              <p className="mt-2.5 text-base text-[#3c3c3c]">
                کد مدرسه و نام کاربری خود را وارد کن تا به‌صورت خودکار وارد فضای کاربری مخصوص خودت شوی.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="school-code"
                  className="block text-sm font-semibold text-[#1d1d1b] mb-2"
                >
                  کد مدرسه
                </label>
                <input
                  id="school-code"
                  type="text"
                  dir="ltr"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                  placeholder="SARV-402"
                  autoComplete="organization"
                  className="w-full h-12 px-4 rounded-[16px] bg-white border border-[#e0dbce] text-[#1d1d1b] text-base text-left font-semibold tracking-wide focus:border-[#2ba0ff] transition-colors"
                />
                <p className="mt-1.5 text-xs text-[#686562]">
                  نقش دانش‌آموز یا معلم به‌طور خودکار از روی کد مدرسه و حساب شما تشخیص داده می‌شود.
                </p>
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-semibold text-[#1d1d1b] mb-2"
                >
                  نام کاربری
                </label>
                <input
                  id="username"
                  type="text"
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="mahoor.karimi"
                  autoComplete="username"
                  className="w-full h-12 px-4 rounded-[16px] bg-white border border-[#e0dbce] text-[#1d1d1b] text-base text-left focus:border-[#2ba0ff] transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-[#1d1d1b]"
                  >
                    رمز عبور
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecovery(true);
                      setRecoverySent(false);
                      setRecoveryError(null);
                    }}
                    className="text-xs font-semibold text-[#9e3908] hover:text-[#ff5c0c] transition-colors cursor-pointer"
                  >
                    رمز عبور را فراموش کرده‌ام
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-12 px-4 rounded-[16px] bg-white border border-[#e0dbce] text-[#1d1d1b] text-base text-left focus:border-[#2ba0ff] transition-colors"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3.5 rounded-[16px] bg-[#fff2eb] border border-[#ff705d] text-[#9e3908] text-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#ff5c0c]" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-1">
                <V3PillButton type="submit" size="lg" className="w-full">
                  ورود به سامانه نارنج
                </V3PillButton>
              </div>
            </form>

            {/* Quick Demo Credentials (for testing both Student & Teacher journeys cleanly) */}
            <div className="mt-7 pt-5 border-t border-[#e0dbce]">
              <p className="text-xs font-semibold text-[#686562] mb-3">
                کدهای آماده برای مشاهده جریان کاربری:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fillDemoAccount('student')}
                  className={`p-3 rounded-[16px] text-start border transition-colors cursor-pointer ${
                    schoolCode.toUpperCase() === 'SARV-402'
                      ? 'bg-white border-[#ff5c0c]'
                      : 'bg-white/70 border-[#e0dbce] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#1d1d1b]">حساب ماهور (دانش‌آموز)</span>
                    <span dir="ltr" className="text-xs font-semibold text-[#9e3908] tabular-nums">
                      SARV-402
                    </span>
                  </div>
                  <p className="text-xs text-[#686562] mt-0.5">کلاس چهارم سرو · انتخاب آواتار و تمرین</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoAccount('teacher')}
                  className={`p-3 rounded-[16px] text-start border transition-colors cursor-pointer ${
                    schoolCode.toUpperCase() === 'TEACH-402'
                      ? 'bg-white border-[#ff5c0c]'
                      : 'bg-white/70 border-[#e0dbce] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#1d1d1b]">حساب خانم راد (معلم)</span>
                    <span dir="ltr" className="text-xs font-semibold text-[#9e3908] tabular-nums">
                      TEACH-402
                    </span>
                  </div>
                  <p className="text-xs text-[#686562] mt-0.5">مدیریت کلاس، تکلیف و تحلیل رشد</p>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Left Column (RTL End): Warm Narenj Visual Identity & Key Learning Promises */}
        <section className="lg:col-span-6 flex flex-col justify-between rounded-[36px] bg-[#fff2eb] border border-[#ffcbb1]/70 p-7 md:p-10 narenj-drafting-grid relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            <img
              src="/images/logo/narenj.png"
              alt="لوگوی نارنج"
              className="h-24 md:h-28 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <h2 className="text-[24px] md:text-[30px] font-bold leading-[1.4] text-[#1d1d1b] text-balance">
              تمرین گام‌به‌گام، بدون استرس زمان و همراه با بازخورد آموزشی دقیق
            </h2>
            <p className="text-base text-[#3c3c3c] max-w-lg">
              در نارنج هر دانش‌آموز در مسیر رشد شخصی خودش پیش می‌رود؛ با راهنمای رایگان هنگام گیر کردن و مدال‌های تسلط برنز، نقره و طلا.
            </p>
          </div>

          {/* Visual Showcase Strip featuring V3 Stickers + Real Approved Characters */}
          <div className="my-7 grid grid-cols-3 gap-4 items-center relative z-10">
            <div className="narenj-tray p-4 flex flex-col items-center text-center gap-2 border border-[#e0dbce]/80">
              <StickerSubmitted className="w-20 h-20" />
              <span className="text-xs font-bold text-[#1d1d1b]">تمرین بدون شمارش معکوس</span>
            </div>
            <div className="narenj-tray p-4 flex flex-col items-center text-center gap-2 border border-[#e0dbce]/80">
              <StickerCorrect className="w-20 h-20" />
              <span className="text-xs font-bold text-[#1d1d1b]">نردبان تسلط و مدال‌ها</span>
            </div>
            <div className="narenj-tray p-4 flex flex-col items-center text-center gap-2 border border-[#e0dbce]/80">
              <img
                src="/images/characters/girl/girl-01.jpg"
                alt="شخصیت دانش‌آموز نارنج"
                className="w-20 h-20 rounded-full object-cover border-2 border-[#ffcbb1]"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-bold text-[#1d1d1b]">آواتار اختصاصی تو</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#3c3c3c] relative z-10">
            <div className="bg-white/90 rounded-[16px] px-4 py-3 border border-[#ffcbb1]/60 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#ff5c0c] shrink-0" />
              <span>محیط امن مدرسه‌ای بدون جدول رده‌بندی رقابتی</span>
            </div>
            <div className="bg-white/90 rounded-[16px] px-4 py-3 border border-[#ffcbb1]/60 flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-[#2ba0ff] shrink-0" />
              <span>منطبق با سرفصل‌های ریاضی پایه چهارم</span>
            </div>
          </div>
        </section>
      </main>

      {/* Account Recovery Modal — Confirmed Spec §9: Supports BOTH SMS and Email */}
      {showRecovery && (
        <div
          className="fixed inset-0 z-50 bg-[#1d1d1b]/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recovery-title"
        >
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 md:p-7 border border-[#e0dbce] shadow-xl">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-[#ff5c0c]" />
                <h2 id="recovery-title" className="text-xl font-bold text-[#1d1d1b]">
                  بازیابی حساب کاربری
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowRecovery(false)}
                aria-label="بستن پنجره بازیابی"
                className="w-9 h-9 rounded-full hover:bg-[#f5f1e4] inline-flex items-center justify-center text-[#686562] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {recoverySent ? (
              <div className="py-4 space-y-4">
                <div className="p-4 rounded-[16px] bg-[#eef9e6] border border-[#8ed461] flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#3f7a1d] shrink-0 mt-0.5" />
                  <div className="text-sm text-[#1d1d1b]">
                    <p className="font-bold">درخواست بازیابی ثبت شد</p>
                    <p className="mt-1 text-[#3c3c3c]">
                      کد تایید از طریق{' '}
                      {recoveryChannel === 'sms' ? 'پیامک (SMS)' : 'ایمیل'} به{' '}
                      <span dir="ltr" className="font-semibold">
                        {recoveryContact}
                      </span>{' '}
                      ارسال شد.
                    </p>
                  </div>
                </div>
                <V3PillButton
                  type="button"
                  onClick={() => setShowRecovery(false)}
                  className="w-full"
                >
                  بازگشت به صفحه ورود
                </V3PillButton>
              </div>
            ) : (
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <p className="text-sm text-[#3c3c3c]">
                  روش دریافت کد بازیابی رمز عبور را انتخاب کنید. سامانه نارنج از هر دو روش پیامک و ایمیل پشتیبانی می‌کند.
                </p>

                <div className="grid grid-cols-2 gap-2 p-1 bg-[#f5f1e4] rounded-[16px]">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryChannel('sms');
                      setRecoveryContact('');
                      setRecoveryError(null);
                    }}
                    className={`h-11 rounded-[12px] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      recoveryChannel === 'sms'
                        ? 'bg-white text-[#1d1d1b] shadow-sm'
                        : 'text-[#686562] hover:text-[#1d1d1b]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>پیامک (SMS)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryChannel('email');
                      setRecoveryContact('');
                      setRecoveryError(null);
                    }}
                    className={`h-11 rounded-[12px] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      recoveryChannel === 'email'
                        ? 'bg-white text-[#1d1d1b] shadow-sm'
                        : 'text-[#686562] hover:text-[#1d1d1b]'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    <span>ایمیل</span>
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="recovery-input"
                    className="block text-sm font-semibold text-[#1d1d1b] mb-1.5"
                  >
                    {recoveryChannel === 'sms' ? 'شماره موبایل' : 'نشانی ایمیل'}
                  </label>
                  <input
                    id="recovery-input"
                    type={recoveryChannel === 'sms' ? 'tel' : 'email'}
                    dir="ltr"
                    value={recoveryContact}
                    onChange={(e) => setRecoveryContact(e.target.value)}
                    placeholder={
                      recoveryChannel === 'sms' ? '09123456789' : 'student@school.ir'
                    }
                    className="w-full h-12 px-4 rounded-[16px] bg-white border border-[#e0dbce] text-left text-base focus:border-[#2ba0ff]"
                  />
                </div>

                {recoveryError && (
                  <p role="alert" className="text-sm text-[#9e3908]">
                    {recoveryError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <V3PillButton
                    type="button"
                    variant="secondary"
                    showArrow={false}
                    onClick={() => setShowRecovery(false)}
                  >
                    انصراف
                  </V3PillButton>
                  <V3PillButton type="submit">ارسال کد بازیابی</V3PillButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
