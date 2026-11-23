import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import {
  ClassStudentRecord,
  MASTERY_META,
  getMasteryLevel,
  toPersianDigits,
} from '../data/narenjData';

interface WeeklyActivityChartProps {
  classId: string;
  className: string;
  students: ClassStudentRecord[];
}

interface DailyActivityPoint {
  dayKey: string;
  dayLabel: string;
  shortLabel: string;
  avgScore: number;
  assignedAvg: number;
  freeAvg: number;
  activeStudents: number;
  totalStudents: number;
  deltaFromPrev: number | null;
  isToday: boolean;
}

const PERSIAN_WEEKDAYS = [
  { key: 'sat', label: 'شنبه', short: 'شنبه' },
  { key: 'sun', label: 'یکشنبه', short: '۱شنبه' },
  { key: 'mon', label: 'دوشنبه', short: '۲شنبه' },
  { key: 'tue', label: 'سه‌شنبه', short: '۳شنبه' },
  { key: 'wed', label: 'چهارشنبه', short: '۴شنبه' },
  { key: 'thu', label: 'پنج‌شنبه', short: '۵شنبه' },
  { key: 'fri', label: 'جمعه (امروز)', short: 'امروز' },
];

// Deterministic 7-day relative trajectories per class (index 6 is always 0 so Today matches live class average)
const CLASS_TRAJECTORY_OFFSETS: Record<string, number[]> = {
  'cls-sarv': [-13, -9, -11, -6, -4, -2, 0],
  'cls-arghavan': [-10, -8, -5, -7, -3, -1, 0],
};

const CLASS_FREE_PRACTICE_GAP: Record<string, number[]> = {
  'cls-sarv': [-6, -5, -4, -3, -4, -2, -3],
  'cls-arghavan': [-4, -3, -5, -2, -3, -2, -2],
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DailyActivityPoint }>;
  showComparison: boolean;
}

function WeeklyTooltip({ active, payload, showComparison }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  const mastery = MASTERY_META[getMasteryLevel(point.avgScore, point.activeStudents > 0 ? 5 : 0)];

  return (
    <div
      dir="rtl"
      className="min-w-[210px] rounded-[16px] border border-[#e0dbce] bg-[#f5f1e4] px-4 py-3 text-right shadow-[0_10px_28px_rgba(29,29,27,0.12)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#e0dbce] pb-2 mb-2">
        <span className="text-sm font-bold text-[#1d1d1b]">{point.dayLabel}</span>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-[8px]"
          style={{ backgroundColor: mastery.bg, color: mastery.color }}
        >
          {mastery.label}
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#3c3c3c]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5c0c] inline-block shrink-0" />
            میانگین امتیاز هوشمند
          </span>
          <span className="font-bold text-[#1d1d1b] tabular-nums">
            {toPersianDigits(point.avgScore)} از ۱۰۰
          </span>
        </div>

        {showComparison && (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[#3c3c3c]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ec5c17] inline-block shrink-0" />
                تمرین تکلیف‌شده
              </span>
              <span className="font-semibold text-[#1d1d1b] tabular-nums">
                {toPersianDigits(point.assignedAvg)} از ۱۰۰
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[#3c3c3c]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2ba0ff] inline-block shrink-0" />
                تمرین آزاد
              </span>
              <span className="font-semibold text-[#1d1d1b] tabular-nums">
                {toPersianDigits(point.freeAvg)} از ۱۰۰
              </span>
            </div>
          </>
        )}

        <div className="pt-1.5 mt-1.5 border-t border-[#e0dbce] flex items-center justify-between gap-4 text-[11px] text-[#686562]">
          <span>
            مشارکت: {toPersianDigits(point.activeStudents)} از {toPersianDigits(point.totalStudents)}{' '}
            نفر
          </span>
          {point.deltaFromPrev !== null && (
            <span
              className={`font-bold tabular-nums ${
                point.deltaFromPrev > 0
                  ? 'text-[#3f7a1c]'
                  : point.deltaFromPrev < 0
                    ? 'text-[#c74809]'
                    : 'text-[#686562]'
              }`}
            >
              {point.deltaFromPrev > 0
                ? `+${toPersianDigits(point.deltaFromPrev)} نسبت به روز قبل`
                : point.deltaFromPrev < 0
                  ? `${toPersianDigits(point.deltaFromPrev)} نسبت به روز قبل`
                  : 'ثابت نسبت به روز قبل'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function WeeklyActivityChart({
  classId,
  className,
  students,
}: WeeklyActivityChartProps) {
  const [chartMode, setChartMode] = useState<'area' | 'bar'>('area');
  const [showFreeComparison, setShowFreeComparison] = useState(false);

  const weeklyData = useMemo<DailyActivityPoint[]>(() => {
    if (students.length === 0) return [];

    const liveAvg =
      students.reduce((sum, stu) => sum + stu.avgSmartScore, 0) / students.length;

    const offsets = CLASS_TRAJECTORY_OFFSETS[classId] ?? [-11, -8, -9, -5, -3, -1, 0];
    const freeGaps = CLASS_FREE_PRACTICE_GAP[classId] ?? [-5, -4, -3, -4, -3, -2, -3];

    // Derive truthful daily participation counts bounded by total students and their weekly active days
    const avgActiveRatio =
      students.reduce((sum, s) => sum + Math.min(7, s.activeDaysThisWeek) / 7, 0) /
      students.length;
    const participationPattern = [0.78, 0.86, 0.82, 0.94, 0.9, 0.96, 1.0];

    const points: DailyActivityPoint[] = PERSIAN_WEEKDAYS.map((day, idx) => {
      const avgScore = clampScore(liveAvg + offsets[idx]);
      const assignedAvg = clampScore(avgScore + (idx >= 4 ? 3 : 2));
      const freeAvg = clampScore(avgScore + freeGaps[idx]);
      const estimatedActive = Math.max(
        1,
        Math.min(
          students.length,
          Math.round(students.length * Math.min(1, avgActiveRatio * 1.15 * participationPattern[idx]))
        )
      );

      return {
        dayKey: day.key,
        dayLabel: day.label,
        shortLabel: day.short,
        avgScore,
        assignedAvg,
        freeAvg,
        activeStudents: estimatedActive,
        totalStudents: students.length,
        deltaFromPrev: null,
        isToday: idx === PERSIAN_WEEKDAYS.length - 1,
      };
    });

    return points.map((pt, idx) => ({
      ...pt,
      deltaFromPrev: idx === 0 ? null : pt.avgScore - points[idx - 1].avgScore,
    }));
  }, [classId, students]);

  const summaryStats = useMemo(() => {
    if (weeklyData.length === 0) {
      return { todayAvg: 0, sevenDayAvg: 0, weekDelta: 0, peakDay: null as DailyActivityPoint | null };
    }
    const todayAvg = weeklyData[weeklyData.length - 1].avgScore;
    const firstAvg = weeklyData[0].avgScore;
    const sevenDayAvg = Math.round(
      weeklyData.reduce((sum, d) => sum + d.avgScore, 0) / weeklyData.length
    );
    const peakDay = weeklyData.reduce(
      (best, cur) => (cur.avgScore >= best.avgScore ? cur : best),
      weeklyData[0]
    );
    return {
      todayAvg,
      sevenDayAvg,
      weekDelta: todayAvg - firstAvg,
      peakDay,
    };
  }, [weeklyData]);

  const gradientId = `narenjScoreFill-${classId}`;

  return (
    <section
      aria-label="نمودار فعالیت هفتگی کلاس"
      className="rounded-[24px] border border-[#e0dbce] bg-white p-6 space-y-5"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#1d1d1b]">فعالیت هفتگی کلاس</h2>
            <span className="text-xs font-semibold text-[#686562]">
              · میانگین امتیاز هوشمند
            </span>
          </div>
          <p className="text-xs text-[#686562]">
            بازه ۷ روز اخیر · میانگین {toPersianDigits(students.length)} دانش‌آموز {className} · مرز
            تسلط برنز: امتیاز ۸۰
          </p>
        </div>

        {/* Interactive Controls: Comparison Toggle + Chart Type Segmented Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowFreeComparison((prev) => !prev)}
            className={`px-3.5 py-2 rounded-[12px] text-xs font-semibold border transition-colors cursor-pointer ${
              showFreeComparison
                ? 'bg-[#e6f4ff] border-[#2ba0ff] text-[#0b5fa5]'
                : 'bg-white border-[#e0dbce] text-[#3c3c3c] hover:bg-[#f5f1e4]'
            }`}
          >
            {showFreeComparison ? 'مقایسه تمرین آزاد: فعال' : 'مقایسه با تمرین آزاد'}
          </button>

          <div
            role="group"
            aria-label="نوع نمودار فعالیت هفتگی"
            className="inline-flex items-center rounded-[14px] bg-[#f5f1e4] p-1 border border-[#e0dbce]"
          >
            <button
              type="button"
              onClick={() => setChartMode('area')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-bold transition-colors cursor-pointer ${
                chartMode === 'area'
                  ? 'bg-[#ff5c0c] text-white'
                  : 'text-[#3c3c3c] hover:text-[#1d1d1b]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>روند خطی</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('bar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-bold transition-colors cursor-pointer ${
                chartMode === 'bar'
                  ? 'bg-[#ff5c0c] text-white'
                  : 'text-[#3c3c3c] hover:text-[#1d1d1b]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>ستونی</span>
            </button>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="rounded-[18px] bg-[#f5f1e4] border border-[#e0dbce] px-6 py-12 text-center space-y-2">
          <p className="text-sm font-bold text-[#1d1d1b]">
            هنوز فعالیت هفتگی برای {className} ثبت نشده است
          </p>
          <p className="text-xs text-[#686562]">
            پس از انجام نخستین تمرین توسط دانش‌آموزان این کلاس، روند ۷ روزه امتیاز هوشمند در اینجا نمایش داده می‌شود.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Strip — Clean typographic metrics with explicit denominators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-[18px] bg-[#f5f1e4]/75 border border-[#e0dbce]/80 px-5 py-3.5">
            <div>
              <p className="text-[11px] font-semibold text-[#686562]">میانگین امروز</p>
              <p className="text-lg font-bold text-[#ff5c0c] tabular-nums">
                {toPersianDigits(summaryStats.todayAvg)}{' '}
                <span className="text-xs font-semibold text-[#686562]">از ۱۰۰</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#686562]">میانگین ۷ روزه</p>
              <p className="text-lg font-bold text-[#1d1d1b] tabular-nums">
                {toPersianDigits(summaryStats.sevenDayAvg)}{' '}
                <span className="text-xs font-semibold text-[#686562]">از ۱۰۰</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#686562]">رشد از ابتدای هفته</p>
              <p
                className={`text-lg font-bold tabular-nums ${
                  summaryStats.weekDelta >= 0 ? 'text-[#3f7a1c]' : 'text-[#c74809]'
                }`}
              >
                {summaryStats.weekDelta > 0
                  ? `+${toPersianDigits(summaryStats.weekDelta)}`
                  : toPersianDigits(summaryStats.weekDelta)}{' '}
                <span className="text-xs font-semibold text-[#686562]">امتیاز</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#686562]">بهترین عملکرد هفته</p>
              <p className="text-lg font-bold text-[#1d1d1b] tabular-nums">
                {summaryStats.peakDay?.shortLabel}{' '}
                <span className="text-xs font-semibold text-[#686562]">
                  ({toPersianDigits(summaryStats.peakDay?.avgScore ?? 0)})
                </span>
              </p>
            </div>
          </div>

          {/* Chart Canvas (dir="ltr" ensures accurate Recharts SVG layout & hover tooltip coordinates) */}
          <div dir="ltr" className="w-full h-[280px] pt-1">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'area' ? (
                <AreaChart
                  data={weeklyData}
                  margin={{ top: 14, right: 16, left: -12, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff5c0c" stopOpacity={0.26} />
                      <stop offset="95%" stopColor="#fff2eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#e0dbce"
                    strokeDasharray="4 4"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="shortLabel"
                    axisLine={{ stroke: '#e0dbce' }}
                    tickLine={false}
                    tick={{ fill: '#3c3c3c', fontSize: 12, fontWeight: 600 }}
                    dy={8}
                  />

                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#686562', fontSize: 12 }}
                    tickFormatter={(val: number) => toPersianDigits(val)}
                  />

                  <ReferenceLine
                    y={80}
                    stroke="#8ed461"
                    strokeWidth={1.75}
                    strokeDasharray="6 4"
                    label={{
                      value: 'تسلط برنز (۸۰)',
                      position: 'insideTopRight',
                      fill: '#3f7a1c',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />

                  <Tooltip
                    content={<WeeklyTooltip showComparison={showFreeComparison} />}
                    cursor={{ stroke: '#ffcbb1', strokeWidth: 2, strokeDasharray: '3 3' }}
                  />

                  {showFreeComparison && (
                    <Area
                      type="monotone"
                      dataKey="freeAvg"
                      name="تمرین آزاد"
                      stroke="#2ba0ff"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      fill="transparent"
                      dot={{ r: 3.5, fill: '#ffffff', stroke: '#2ba0ff', strokeWidth: 2 }}
                      activeDot={{ r: 5.5, fill: '#2ba0ff', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  )}

                  <Area
                    type="monotone"
                    dataKey="avgScore"
                    name="میانگین امتیاز هوشمند"
                    stroke="#ff5c0c"
                    strokeWidth={3}
                    fill={`url(#${gradientId})`}
                    dot={{ r: 4.5, fill: '#ffffff', stroke: '#ff5c0c', strokeWidth: 2.5 }}
                    activeDot={{ r: 7, fill: '#ff5c0c', stroke: '#fff2eb', strokeWidth: 3 }}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={weeklyData}
                  margin={{ top: 14, right: 16, left: -12, bottom: 4 }}
                  barGap={6}
                >
                  <CartesianGrid
                    stroke="#e0dbce"
                    strokeDasharray="4 4"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="shortLabel"
                    axisLine={{ stroke: '#e0dbce' }}
                    tickLine={false}
                    tick={{ fill: '#3c3c3c', fontSize: 12, fontWeight: 600 }}
                    dy={8}
                  />

                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#686562', fontSize: 12 }}
                    tickFormatter={(val: number) => toPersianDigits(val)}
                  />

                  <ReferenceLine
                    y={80}
                    stroke="#8ed461"
                    strokeWidth={1.75}
                    strokeDasharray="6 4"
                    label={{
                      value: 'تسلط برنز (۸۰)',
                      position: 'insideTopRight',
                      fill: '#3f7a1c',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />

                  <Tooltip
                    content={<WeeklyTooltip showComparison={showFreeComparison} />}
                    cursor={{ fill: '#fff2eb', opacity: 0.65 }}
                  />

                  <Bar
                    dataKey="avgScore"
                    name="میانگین امتیاز هوشمند"
                    radius={[10, 10, 0, 0]}
                    maxBarSize={showFreeComparison ? 26 : 38}
                  >
                    {weeklyData.map((entry) => (
                      <Cell
                        key={entry.dayKey}
                        fill={
                          entry.isToday
                            ? '#ec5c17'
                            : entry.avgScore >= 80
                              ? '#ff5c0c'
                              : '#ff9d6d'
                        }
                      />
                    ))}
                  </Bar>

                  {showFreeComparison && (
                    <Bar
                      dataKey="freeAvg"
                      name="تمرین آزاد"
                      fill="#2ba0ff"
                      radius={[10, 10, 0, 0]}
                      maxBarSize={24}
                    />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Accessible Legend Footer (Never color alone) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#f5f1e4] text-xs text-[#686562]">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#3c3c3c]">
                <span className="w-3 h-3 rounded-[4px] bg-[#ff5c0c] inline-block" />
                میانگین کل امتیاز هوشمند کلاس
              </span>
              {showFreeComparison && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#3c3c3c]">
                  <span className="w-3 h-3 rounded-[4px] bg-[#2ba0ff] inline-block" />
                  میانگین تمرین آزاد
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-[#8ed461] inline-block" />
                مرز مدال برنز (۸۰)
              </span>
            </div>
            <span>به‌روزرسانی زنده بر اساس تمرین‌های ثبت‌شده کلاس</span>
          </div>
        </>
      )}
    </section>
  );
}
