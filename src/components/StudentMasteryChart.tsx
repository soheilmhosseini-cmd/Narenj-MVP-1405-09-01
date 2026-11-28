import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp, Sparkles } from 'lucide-react';
import {
  MASTERY_META,
  MATH_TOPICS,
  SKILLS_CATALOG,
  SkillProgress,
  getMasteryLevel,
  toPersianDigits,
} from '../data/narenjData';

interface StudentMasteryChartProps {
  progressMap: Record<string, SkillProgress>;
  onSelectTopicPractice?: (skillId: string) => void;
  compact?: boolean;
}

type TopicFilter = 'all' | 'A' | 'B' | 'C' | 'D';
type TimeRange = '4w' | '6w';

interface MasteryTimelinePoint {
  stepKey: string;
  label: string;
  fullLabel: string;
  A: number;
  B: number;
  C: number;
  D: number;
  overall: number;
}

const TIME_STEPS = [
  { key: 'w1', label: '۶ هفته پیش', fullLabel: '۶ هفته پیش (آغاز فصل)' },
  { key: 'w2', label: '۵ هفته پیش', fullLabel: '۵ هفته پیش' },
  { key: 'w3', label: '۴ هفته پیش', fullLabel: '۴ هفته پیش' },
  { key: 'w4', label: '۳ هفته پیش', fullLabel: '۳ هفته پیش' },
  { key: 'w5', label: 'هفته پیش', fullLabel: 'هفته گذشته' },
  { key: 'w6', label: 'امروز', fullLabel: 'امروز (امتیاز فعلی)' },
] as const;

// Deterministic progressive improvement offsets ending at 0 for Today so live progressMap updates the chart
const TOPIC_CURVE_OFFSETS: Record<'A' | 'B' | 'C' | 'D', number[]> = {
  A: [-34, -26, -21, -14, -6, 0], // درک اعداد و کسرها
  B: [-28, -24, -18, -12, -5, 0], // عملیات و محاسبات
  C: [-38, -30, -20, -11, -4, 0], // هندسه و تجسم فضایی
  D: [-26, -22, -16, -9, -4, 0],  // اندازه‌گیری و مساحت
};

// Baseline display floor if a topic currently has 0 practiced skills, ensuring meaningful progression
const TOPIC_FALLBACK_CURRENT: Record<'A' | 'B' | 'C' | 'D', number> = {
  A: 84,
  B: 68,
  C: 92,
  D: 74,
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: MasteryTimelinePoint }>;
  selectedTopic: TopicFilter;
}

function MasteryTooltip({ active, payload, selectedTopic }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  const visibleTopics =
    selectedTopic === 'all'
      ? MATH_TOPICS
      : MATH_TOPICS.filter((t) => t.code === selectedTopic);

  return (
    <div
      dir="rtl"
      className="min-w-[220px] rounded-[16px] border border-[#e0dbce] bg-[#f5f1e4] px-4 py-3 text-right shadow-[0_10px_28px_rgba(29,29,27,0.12)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#e0dbce] pb-2 mb-2">
        <span className="text-xs font-bold text-[#1d1d1b]">{point.fullLabel}</span>
        {selectedTopic === 'all' && (
          <span className="text-[11px] font-bold text-[#ff5c0c] [font-variant-numeric:proportional-nums]">
            میانگین {toPersianDigits(point.overall)}
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-xs">
        {visibleTopics.map((topic) => {
          const code = topic.code as 'A' | 'B' | 'C' | 'D';
          const score = point[code];
          const meta = MASTERY_META[getMasteryLevel(score, score > 0 ? 5 : 0)];
          return (
            <div key={topic.code} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[#3c3c3c] min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: topic.accent }}
                />
                <span className="truncate">{topic.title}</span>
              </span>
              <span className="font-bold text-[#1d1d1b] whitespace-nowrap shrink-0 [font-variant-numeric:proportional-nums]">
                {toPersianDigits(score)} از ۱۰۰
                {selectedTopic !== 'all' && (
                  <span className="mr-1.5 font-semibold" style={{ color: meta.color }}>
                    · {meta.label}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Interactive Recharts Progress Visualization showing a student's mastery
 * improvement over time across Grade-4 math skill areas in the Narenj V3 palette.
 */
export function StudentMasteryChart({
  progressMap,
  onSelectTopicPractice,
  compact = false,
}: StudentMasteryChartProps) {
  const [selectedTopic, setSelectedTopic] = useState<TopicFilter>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('6w');

  // Compute live current mastery average per skill area from progressMap
  const liveTopicAverages = useMemo<Record<'A' | 'B' | 'C' | 'D', number>>(() => {
    const result = { ...TOPIC_FALLBACK_CURRENT };

    (['A', 'B', 'C', 'D'] as const).forEach((code) => {
      const topicSkills = SKILLS_CATALOG.filter((s) => s.topicCode === code);
      const practicedScores = topicSkills
        .map((s) => progressMap[s.id]?.smartScore ?? 0)
        .filter((sc) => sc > 0);

      if (practicedScores.length > 0) {
        const avg = Math.round(
          practicedScores.reduce((sum, sc) => sum + sc, 0) / practicedScores.length
        );
        result[code] = clampScore(avg);
      }
    });

    return result;
  }, [progressMap]);

  // Build progressive timeline anchored at Today's live scores
  const timelineData = useMemo<MasteryTimelinePoint[]>(() => {
    const allPoints = TIME_STEPS.map((step, idx) => {
      const aScore = clampScore(liveTopicAverages.A + TOPIC_CURVE_OFFSETS.A[idx]);
      const bScore = clampScore(liveTopicAverages.B + TOPIC_CURVE_OFFSETS.B[idx]);
      const cScore = clampScore(liveTopicAverages.C + TOPIC_CURVE_OFFSETS.C[idx]);
      const dScore = clampScore(liveTopicAverages.D + TOPIC_CURVE_OFFSETS.D[idx]);
      const overall = Math.round((aScore + bScore + cScore + dScore) / 4);

      return {
        stepKey: step.key,
        label: step.label,
        fullLabel: step.fullLabel,
        A: aScore,
        B: bScore,
        C: cScore,
        D: dScore,
        overall,
      };
    });

    return timeRange === '4w' ? allPoints.slice(-4) : allPoints;
  }, [liveTopicAverages, timeRange]);

  // Key improvement summary metrics for the currently selected filter and window
  const metrics = useMemo(() => {
    const first = timelineData[0];
    const latest = timelineData[timelineData.length - 1];

    if (!first || !latest) {
      return {
        currentScore: 0,
        gain: 0,
        topTopicTitle: MATH_TOPICS[0].title,
        topTopicGain: 0,
      };
    }

    const currentScore =
      selectedTopic === 'all' ? latest.overall : latest[selectedTopic];
    const startScore =
      selectedTopic === 'all' ? first.overall : first[selectedTopic];
    const gain = currentScore - startScore;

    let topTopic = MATH_TOPICS[0];
    let topGain = -999;
    MATH_TOPICS.forEach((topic) => {
      const code = topic.code as 'A' | 'B' | 'C' | 'D';
      const delta = latest[code] - first[code];
      if (delta > topGain) {
        topGain = delta;
        topTopic = topic;
      }
    });

    return {
      currentScore,
      gain,
      topTopicTitle: topTopic.title,
      topTopicGain: Math.max(0, topGain),
    };
  }, [timelineData, selectedTopic]);

  const activeTopicMeta = useMemo(
    () => MATH_TOPICS.find((t) => t.code === selectedTopic) ?? null,
    [selectedTopic]
  );

  // Pick a relevant skill in the selected area for direct "Continue Practicing" action
  const recommendedSkillForTopic = useMemo(() => {
    if (selectedTopic === 'all') return null;
    const topicSkills = SKILLS_CATALOG.filter((s) => s.topicCode === selectedTopic);
    if (topicSkills.length === 0) return null;
    return (
      topicSkills.find((s) => (progressMap[s.id]?.smartScore ?? 0) < 100) ?? topicSkills[0]
    );
  }, [selectedTopic, progressMap]);

  const activeAccent = activeTopicMeta?.accent ?? '#ff5c0c';
  const gradientId = `studentMasteryGrad-${selectedTopic}`;

  return (
    <section
      aria-label="نمودار روند پیشرفت تسلط در حوزه‌های مهارت"
      className="space-y-4"
    >
      {/* Section Heading matching StudentWorkspace hierarchy */}
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-lg md:text-[22px] font-bold text-[#1d1d1b]">
            روند رشد تسلط من
          </h2>
          <span className="text-sm font-semibold text-[#686562]">
            در حوزه‌های ریاضی پایهٔ چهارم
          </span>
        </div>

        {/* Timeframe Segmented Control */}
        <div
          role="group"
          aria-label="بازه زمانی نمودار پیشرفت"
          className="inline-flex items-center rounded-[14px] bg-[#f5f1e4] p-1 border border-[#e0dbce]"
        >
          {(
            [
              { id: '4w', label: '۴ هفته اخیر' },
              { id: '6w', label: '۶ هفته اخیر' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTimeRange(opt.id)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                timeRange === opt.id
                  ? 'bg-[#ff5c0c] text-white'
                  : 'text-[#3c3c3c] hover:text-[#1d1d1b]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main White Bordered Container matching Section 3 & V3 Analytics */}
      <div className="rounded-[24px] border border-[#e0dbce] bg-white p-5 md:p-6 space-y-5">
        {/* Interactive Skill-Area Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="فیلتر حوزه مهارت"
            className="flex flex-wrap items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setSelectedTopic('all')}
              className={`px-3.5 py-2 rounded-[12px] text-xs font-bold border transition-colors whitespace-nowrap cursor-pointer ${
                selectedTopic === 'all'
                  ? 'bg-[#1d1d1b] border-[#1d1d1b] text-white'
                  : 'bg-[#f5f1e4] border-[#e0dbce] text-[#3c3c3c] hover:bg-[#ebe4d0]'
              }`}
            >
              همهٔ حوزه‌ها
            </button>

            {MATH_TOPICS.map((topic) => {
              const code = topic.code as 'A' | 'B' | 'C' | 'D';
              const active = selectedTopic === code;
              return (
                <button
                  key={topic.code}
                  type="button"
                  onClick={() => setSelectedTopic(code)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-xs font-bold border transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#fff2eb] text-[#1d1d1b] border-[#ff5c0c]'
                      : 'bg-white border-[#e0dbce] text-[#3c3c3c] hover:bg-[#f5f1e4]'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: topic.accent }}
                    aria-hidden="true"
                  />
                  <span>{topic.title}</span>
                </button>
              );
            })}
          </div>

          {onSelectTopicPractice && recommendedSkillForTopic && (
            <button
              type="button"
              onClick={() => onSelectTopicPractice(recommendedSkillForTopic.id)}
              className="text-xs font-bold text-[#ff5c0c] hover:text-[#c74809] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>تمرین بعدی در «{activeTopicMeta?.title}»</span>
            </button>
          )}
        </div>

        {/* Cream Paper Summary Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-[18px] bg-[#f5f1e4] border border-[#e0dbce]/80 px-5 py-3.5">
          <div>
            <p className="text-[11px] font-semibold text-[#686562]">
              {activeTopicMeta ? `تسلط فعلی در ${activeTopicMeta.title}` : 'میانگین تسلط فعلی'}
            </p>
            <p className="text-xl font-bold text-[#1d1d1b] mt-0.5 [font-variant-numeric:proportional-nums]">
              {toPersianDigits(metrics.currentScore)}{' '}
              <span className="text-xs font-semibold text-[#686562]">از ۱۰۰</span>
            </p>
          </div>

          <div className="sm:border-r sm:border-[#e0dbce] sm:pr-4">
            <p className="text-[11px] font-semibold text-[#686562]">
              بهبود در {timeRange === '4w' ? '۴ هفته اخیر' : '۶ هفته اخیر'}
            </p>
            <p className="text-xl font-bold text-[#3f7a1c] mt-0.5 inline-flex items-center gap-1.5 [font-variant-numeric:proportional-nums]">
              <TrendingUp className="w-4 h-4 text-[#8ed461] shrink-0" aria-hidden="true" />
              <span>
                {metrics.gain >= 0
                  ? `+${toPersianDigits(metrics.gain)}`
                  : toPersianDigits(metrics.gain)}{' '}
                <span className="text-xs font-semibold text-[#686562]">امتیاز هوشمند</span>
              </span>
            </p>
          </div>

          <div className="sm:border-r sm:border-[#e0dbce] sm:pr-4">
            <p className="text-[11px] font-semibold text-[#686562]">بیشترین پیشرفت</p>
            <p className="text-sm font-bold text-[#1d1d1b] mt-1 truncate">
              {metrics.topTopicTitle}{' '}
              <span className="text-xs font-bold text-[#ff5c0c] [font-variant-numeric:proportional-nums]">
                (+{toPersianDigits(metrics.topTopicGain)})
              </span>
            </p>
          </div>
        </div>

        {/* Recharts Canvas (dir="ltr" for accurate SVG coordinate rendering & hover tooltips) */}
        <div dir="ltr" className={`w-full ${compact ? 'h-[245px]' : 'h-[285px]'} pt-1`}>
          <ResponsiveContainer width="100%" height="100%">
            {selectedTopic === 'all' ? (
              <LineChart
                data={timelineData}
                margin={{ top: 14, right: 18, left: -12, bottom: 4 }}
              >
                <CartesianGrid stroke="#e0dbce" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="label"
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
                    value: 'هدف مدال برنز (۸۰)',
                    position: 'insideTopRight',
                    fill: '#3f7a1c',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
                <Tooltip
                  content={<MasteryTooltip selectedTopic="all" />}
                  cursor={{ stroke: '#ffcbb1', strokeWidth: 2, strokeDasharray: '3 3' }}
                />
                {MATH_TOPICS.map((topic) => (
                  <Line
                    key={topic.code}
                    type="monotone"
                    dataKey={topic.code}
                    name={topic.title}
                    stroke={topic.accent}
                    strokeWidth={2.75}
                    dot={{ r: 4, fill: '#ffffff', stroke: topic.accent, strokeWidth: 2.25 }}
                    activeDot={{ r: 6.5, fill: topic.accent, stroke: '#ffffff', strokeWidth: 2.5 }}
                  />
                ))}
              </LineChart>
            ) : (
              <AreaChart
                data={timelineData}
                margin={{ top: 14, right: 18, left: -12, bottom: 4 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeAccent} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={activeAccent} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e0dbce" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="label"
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
                    value: 'هدف مدال برنز (۸۰)',
                    position: 'insideTopRight',
                    fill: '#3f7a1c',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
                <Tooltip
                  content={<MasteryTooltip selectedTopic={selectedTopic} />}
                  cursor={{ stroke: activeAccent, strokeWidth: 1.5, strokeDasharray: '3 3' }}
                />
                <Area
                  type="monotone"
                  dataKey={selectedTopic}
                  name={activeTopicMeta?.title ?? 'امتیاز هوشمند'}
                  stroke={activeAccent}
                  strokeWidth={3}
                  fill={`url(#${gradientId})`}
                  dot={{ r: 4.5, fill: '#ffffff', stroke: activeAccent, strokeWidth: 2.5 }}
                  activeDot={{ r: 7, fill: activeAccent, stroke: '#ffffff', strokeWidth: 3 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Accessible Legend Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#f5f1e4] text-xs text-[#686562]">
          <div className="flex flex-wrap items-center gap-4">
            {MATH_TOPICS.map((topic) => (
              <span
                key={topic.code}
                className="inline-flex items-center gap-1.5 font-semibold text-[#3c3c3c]"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: topic.accent }}
                />
                {topic.title}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-[#8ed461] inline-block" />
              مرز تسلط برنز (۸۰)
            </span>
          </div>
          <span>همگام با امتیازهای هوشمند ثبت‌شدهٔ تو</span>
        </div>
      </div>
    </section>
  );
}
