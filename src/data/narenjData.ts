export type UserRole = 'student' | 'teacher';

export type MasteryLevel =
  | 'not_started'
  | 'attempt'
  | 'familiar'
  | 'proficient'
  | 'mastered';

export interface AvatarAsset {
  id: string;
  category: 'boy' | 'girl' | 'teacher' | 'default';
  label: string;
  src: string;
}

export interface StudentAccount {
  id: string;
  role: 'student';
  schoolCode: string;
  schoolName: string;
  firstName: string;
  lastName: string;
  className: string;
  grade: number;
  coins: number;
  avatarId: string | null;
  onboardingCompleted: boolean;
}

export interface TeacherAccount {
  id: string;
  role: 'teacher';
  schoolCode: string;
  schoolName: string;
  fullName: string;
  subject: string;
  avatarId: string;
  classes: TeacherClass[];
}

export interface TeacherClass {
  id: string;
  name: string;
  grade: number;
  studentCount: number;
  schoolCode: string;
}

export type QuestionKind =
  | 'area_grid_select'
  | 'fraction_shade'
  | 'numeric_input'
  | 'multiple_choice';

export interface GridShapeOption {
  id: string;
  label: string;
  /** 4x4 or 5x4 boolean cells */
  rows: number;
  cols: number;
  cells: number[][]; // [row, col]
  color: string;
}

export interface PracticeQuestion {
  id: string;
  skillId: string;
  kind: QuestionKind;
  prompt: string;
  /** Optional subtitle or math expression (rendered LTR if mathExpr) */
  mathExpr?: string;
  hint: string;
  explanation: string;
  /** For multiple_choice */
  options?: { id: string; label: string; math?: boolean }[];
  correctOptionId?: string;
  /** For area_grid_select */
  referenceShape?: GridShapeOption;
  gridOptions?: GridShapeOption[];
  correctGridId?: string;
  /** For fraction_shade */
  fractionConfig?: {
    totalParts: number;
    targetParts: number;
    cols: number;
    shapeLabel: string;
  };
  /** For numeric_input */
  correctNumericAnswers?: string[]; // accepted equivalent forms
  numericPlaceholder?: string;
  numericUnit?: string;
  correctAnswerDisplay: string;
}

export interface SkillRecord {
  id: string;
  code: string;
  topicCode: string;
  topicTitle: string;
  subtopicTitle: string;
  title: string;
  grade: number;
  objective: string;
  misconception?: string;
  estimatedMinutes: number;
  isDemoContent: boolean;
}

export interface SkillProgress {
  skillId: string;
  smartScore: number;
  questionsAnswered: number;
  correctCount: number;
  needsAttentionCount: number;
  elapsedSeconds: number;
  lastPracticedAt?: string;
}

export interface AssignmentRecord {
  id: string;
  title: string;
  classId: string;
  className: string;
  skillIds: string[];
  recipientIds: string[] | 'all';
  dueDateLabel: string;
  instructions: string;
  createdAtLabel: string;
  status: 'active' | 'scheduled' | 'completed';
}

export interface ClassStudentRecord {
  id: string;
  name: string;
  classId: string;
  avatarId: string;
  coins: number;
  activeDaysThisWeek: number;
  assignedCompleted: number;
  assignedTotal: number;
  freePracticeCount: number;
  avgSmartScore: number;
  minutesPracticed: number;
  needsSupportSkillIds: string[];
  skillScores: Record<string, number>;
}

export interface ActivePracticeState {
  skillId: string;
  assignmentId?: string;
  currentIndex: number;
  answeredCount: number;
  correctCount: number;
  needsAttentionCount: number;
  smartScore: number;
  elapsedSeconds: number;
  /** Answers already submitted in this session (forward-only, immutable) */
  history: {
    questionId: string;
    isCorrect: boolean;
    usedHint: boolean;
  }[];
}

// ============================================================================
// Persian Number Formatting & Input Normalization
// ============================================================================
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function normalizeDigitsToLatin(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[،,\s]/g, '')
    .trim();
}

export function formatElapsedTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const padded = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return toPersianDigits(padded);
}

// ============================================================================
// Mastery Ladder & Medals (Confirmed Product Specification §6)
// ============================================================================
export function getMasteryLevel(score: number, answeredCount: number): MasteryLevel {
  if (answeredCount === 0 && score === 0) return 'not_started';
  if (score >= 100) return 'mastered';
  if (score >= 80) return 'proficient';
  if (score >= 50) return 'familiar';
  return 'attempt';
}

export const MASTERY_META: Record<
  MasteryLevel,
  { label: string; shortLabel: string; color: string; bg: string; border: string }
> = {
  not_started: {
    label: 'شروع نشده',
    shortLabel: 'شروع نشده',
    color: '#686562',
    bg: '#f5f1e4',
    border: '#e0dbce',
  },
  attempt: {
    label: 'تلاش اولیه',
    shortLabel: 'تلاش',
    color: '#9e3908',
    bg: '#fff2eb',
    border: '#ffcbb1',
  },
  familiar: {
    label: 'آشنا شده',
    shortLabel: 'آشنا',
    color: '#1b6fb8',
    bg: '#e9f5ff',
    border: '#c5d3e8',
  },
  proficient: {
    label: 'مسلط',
    shortLabel: 'مسلط',
    color: '#3f7a1d',
    bg: '#eef9e6',
    border: '#8ed461',
  },
  mastered: {
    label: 'تسلط کامل',
    shortLabel: 'تسلط کامل',
    color: '#9e3908',
    bg: '#f9f4ae',
    border: '#f5e211',
  },
};

export function getMedalForScore(score: number): {
  tier: 'none' | 'bronze' | 'silver' | 'gold';
  label: string;
} {
  if (score >= 100) return { tier: 'gold', label: 'مدال طلا (۱۰۰)' };
  if (score >= 90) return { tier: 'silver', label: 'مدال نقره (۹۰)' };
  if (score >= 80) return { tier: 'bronze', label: 'مدال برنز (۸۰)' };
  return { tier: 'none', label: 'در مسیر مدال برنز (۸۰)' };
}

// ============================================================================
// Narenj Design System V3 Replacement Avatar (1405-08-30-17)
// ============================================================================
export const NARENJ_V3_AVATAR_SRC = '/images/ui/ui-17.svg';

export const AVATAR_REGISTRY: AvatarAsset[] = [
  { id: 'girl-01', category: 'girl', label: 'آواتار ۱', src: NARENJ_V3_AVATAR_SRC },
  { id: 'girl-02', category: 'girl', label: 'آواتار ۲', src: NARENJ_V3_AVATAR_SRC },
  { id: 'girl-03', category: 'girl', label: 'آواتار ۳', src: NARENJ_V3_AVATAR_SRC },
  { id: 'girl-04', category: 'girl', label: 'آواتار ۴', src: NARENJ_V3_AVATAR_SRC },
  { id: 'boy-01', category: 'boy', label: 'آواتار ۵', src: NARENJ_V3_AVATAR_SRC },
  { id: 'boy-02', category: 'boy', label: 'آواتار ۶', src: NARENJ_V3_AVATAR_SRC },
  { id: 'boy-03', category: 'boy', label: 'آواتار ۷', src: NARENJ_V3_AVATAR_SRC },
  { id: 'boy-04', category: 'boy', label: 'آواتار ۸', src: NARENJ_V3_AVATAR_SRC },
  { id: 'teacher-01', category: 'teacher', label: 'آواتار معلم ۱', src: NARENJ_V3_AVATAR_SRC },
  { id: 'teacher-02', category: 'teacher', label: 'آواتار معلم ۲', src: NARENJ_V3_AVATAR_SRC },
  { id: 'default-01', category: 'default', label: 'پیش‌فرض', src: NARENJ_V3_AVATAR_SRC },
];

export function resolveAvatarSrc(
  avatarId: string | null | undefined,
  _fallbackCategory: 'student' | 'teacher' = 'student'
): string {
  const found = AVATAR_REGISTRY.find((a) => a.id === avatarId);
  return found ? found.src : NARENJ_V3_AVATAR_SRC;
}

// ============================================================================
// Grade 4 Mathematics Curriculum (Sourced from skill form - v5.ods + V3 Sample)
// ============================================================================
export const MATH_TOPICS = [
  { code: 'C', title: 'هندسه و تجسم فضایی', accent: '#8ed461' },
  { code: 'A', title: 'درک اعداد و کسرها', accent: '#2ba0ff' },
  { code: 'B', title: 'عملیات و محاسبات', accent: '#ff5c0c' },
  { code: 'D', title: 'اندازه‌گیری و مساحت', accent: '#ff705d' },
];

export const SKILLS_CATALOG: SkillRecord[] = [
  {
    id: 'skill-area-equal',
    code: 'D.AA.1',
    topicCode: 'D',
    topicTitle: 'اندازه‌گیری و مساحت',
    subtopicTitle: 'مفهوم مساحت',
    title: 'تشخیص دو شکل با مساحت برابر و ظاهر متفاوت',
    grade: 4,
    objective: 'دانش‌آموز بتواند با شمارش مربع‌های واحد، شکل‌هایی را که ظاهر متفاوت اما مساحت یکسان دارند تشخیص دهد.',
    misconception: 'تصور اینکه شکل کشیده‌تر یا با محیط بزرگ‌تر، لزوماً مساحت بیشتری دارد.',
    estimatedMinutes: 6,
    isDemoContent: true,
  },
  {
    id: 'skill-fraction-area',
    code: 'A.AF.1',
    topicCode: 'A',
    topicTitle: 'درک اعداد و کسرها',
    subtopicTitle: 'اعداد کسری',
    title: 'درک و نمایش کسر با استفاده از مدل مساحتی',
    grade: 4,
    objective: 'کسرها را با استفاده از سطوح دوبعدی (مربع و مستطیل) با تقسیمات هم‌مساحت مدل‌سازی کند.',
    misconception: 'رنگ کردن تعداد بخش‌ها بدون توجه به برابر بودن مساحت قسمت‌ها.',
    estimatedMinutes: 7,
    isDemoContent: true,
  },
  {
    id: 'skill-place-value',
    code: 'A.AA.2',
    topicCode: 'A',
    topicTitle: 'درک اعداد و کسرها',
    subtopicTitle: 'ارزش مکانی',
    title: 'پیدا کردن ارزش ارقام در عددها تا میلیون',
    grade: 4,
    objective: 'بتواند ارزش مکانی و ارزش عددی هر رقم را در یک عدد چندرقمی تا مرتبه میلیون به دست آورد.',
    misconception: 'اشتباه گرفتن خودِ رقم با ارزش مکانی آن در طبقه هزارگان.',
    estimatedMinutes: 5,
    isDemoContent: true,
  },
  {
    id: 'skill-compare-million',
    code: 'A.AB.1',
    topicCode: 'A',
    topicTitle: 'درک اعداد و کسرها',
    subtopicTitle: 'مقایسه اعداد',
    title: 'مقایسه اعداد تا مرتبه‌ی میلیون',
    grade: 4,
    objective: 'مقایسه اعداد و عبارت‌های عددی تا ۹ رقم با توجه به تعداد ارقام و ارزش مکانی از چپ به راست.',
    misconception: 'بی‌توجهی به تعداد ارقام و مقایسه فقط بر اساس بزرگی رقم اول (مثلاً ۹۹۹ در برابر ۱۰۰۰).',
    estimatedMinutes: 5,
    isDemoContent: true,
  },
  {
    id: 'skill-expanded-form',
    code: 'A.AA.5',
    topicCode: 'A',
    topicTitle: 'درک اعداد و کسرها',
    subtopicTitle: 'ارزش مکانی',
    title: 'نوشتن اعداد به فرم گسترده و استاندارد',
    grade: 4,
    objective: 'بتواند اعداد را به فرم گسترده بنویسد یا فرم گسترده را به عدد استاندارد تبدیل کند.',
    estimatedMinutes: 6,
    isDemoContent: true,
  },
  {
    id: 'skill-area-mult',
    code: 'B.AC.1',
    topicCode: 'B',
    topicTitle: 'عملیات و محاسبات',
    subtopicTitle: 'ضرب مساحتی',
    title: 'روش مساحتی در محاسبه‌ی حاصل ضرب دو رقم در یک رقم',
    grade: 4,
    objective: 'با رسم مدل مساحتی (مستطیل تفکیک‌شده به دهگان و یکان)، حاصل ضرب دو رقم در یک رقم را محاسبه کند.',
    estimatedMinutes: 7,
    isDemoContent: true,
  },
  {
    id: 'skill-symmetry-geo',
    code: 'C.AA.1',
    topicCode: 'C',
    topicTitle: 'هندسه و تجسم فضایی',
    subtopicTitle: 'تقارن و شکل‌ها',
    title: 'تشخیص خط تقارن در چندضلعی‌های منتظم و نامنتظم',
    grade: 4,
    objective: 'تعداد محورهای تقارن شکل‌های هندسی مانند مربع، مستطیل و مثلث متساوی‌الساقین را تشخیص دهد.',
    estimatedMinutes: 5,
    isDemoContent: true,
  },
];

// ============================================================================
// Demo Question Bank (Marked explicitly as محتوای نمونه آموزشی per spec §11)
// ============================================================================
export const DEMO_QUESTIONS_BY_SKILL: Record<string, PracticeQuestion[]> = {
  'skill-area-equal': [
    {
      id: 'q-area-1',
      skillId: 'skill-area-equal',
      kind: 'area_grid_select',
      prompt: 'کدام شکل زیر، مساحتی دقیقاً برابر با شکل نمونه دارد اما ظاهر آن متفاوت است؟',
      hint: 'تعداد مربع‌های رنگی شکل نمونه را بشمار (۶ مربع واحد). سپس شکلی را پیدا کن که دقیقاً ۶ مربع واحد دارد.',
      explanation: 'شکل نمونه از ۶ مربع واحد ساخته شده است. شکل «ب» با وجود کشیده‌تر بودن، دقیقاً ۶ مربع واحد را می‌پوشاند؛ پس مساحت برابر دارند.',
      referenceShape: {
        id: 'ref-1',
        label: 'شکل نمونه (۶ واحد)',
        rows: 4,
        cols: 4,
        cells: [
          [1, 0], [1, 1], [1, 2],
          [2, 0], [2, 1], [2, 2],
        ],
        color: '#ff5c0c',
      },
      gridOptions: [
        {
          id: 'opt-a',
          label: 'شکل الف',
          rows: 4,
          cols: 4,
          cells: [
            [0, 1], [1, 1], [2, 1], [3, 1], [3, 2],
          ],
          color: '#2ba0ff',
        },
        {
          id: 'opt-b',
          label: 'شکل ب',
          rows: 4,
          cols: 4,
          cells: [
            [0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2],
          ],
          color: '#8ed461',
        },
        {
          id: 'opt-c',
          label: 'شکل پ',
          rows: 4,
          cols: 4,
          cells: [
            [0, 1], [0, 2], [1, 1], [1, 2], [2, 1], [2, 2], [3, 1],
          ],
          color: '#ff705d',
        },
      ],
      correctGridId: 'opt-b',
      correctAnswerDisplay: 'شکل ب (۶ مربع واحد)',
    },
    {
      id: 'q-area-2',
      skillId: 'skill-area-equal',
      kind: 'area_grid_select',
      prompt: 'شکل نمونه یک مربع ۴ واحدی است. کدام شکل زیر همان مساحت ۴ واحد را با چیدمان متفاوت نشان می‌دهد؟',
      hint: 'چهار مربع کوچک شکل نمونه را در نظر بگیر و گزینه‌ای را انتخاب کن که دقیقاً ۴ خانه رنگی دارد.',
      explanation: 'مساحت شکل نمونه برابر با ۴ مربع واحد است. شکل «الف» به صورت پلکانی چیده شده اما باز هم دقیقاً ۴ مربع واحد مساحت دارد.',
      referenceShape: {
        id: 'ref-2',
        label: 'شکل نمونه (۴ واحد)',
        rows: 4,
        cols: 4,
        cells: [
          [1, 1], [1, 2],
          [2, 1], [2, 2],
        ],
        color: '#ff5c0c',
      },
      gridOptions: [
        {
          id: 'opt-a',
          label: 'شکل الف',
          rows: 4,
          cols: 4,
          cells: [
            [0, 1], [1, 1], [1, 2], [2, 2],
          ],
          color: '#2ba0ff',
        },
        {
          id: 'opt-b',
          label: 'شکل ب',
          rows: 4,
          cols: 4,
          cells: [
            [1, 0], [1, 1], [1, 2], [1, 3], [2, 3],
          ],
          color: '#8ed461',
        },
        {
          id: 'opt-c',
          label: 'شکل پ',
          rows: 4,
          cols: 4,
          cells: [
            [1, 1], [2, 1], [2, 2],
          ],
          color: '#ff705d',
        },
      ],
      correctGridId: 'opt-a',
      correctAnswerDisplay: 'شکل الف (۴ مربع واحد)',
    },
    {
      id: 'q-area-3',
      skillId: 'skill-area-equal',
      kind: 'area_grid_select',
      prompt: 'کدام شکل مساحتی برابر با شکل نمونه (۵ واحد مربعی) دارد؟',
      hint: 'گول ظاهر پهن یا باریک شکل را نخور! فقط مربع‌های رنگ‌شده را یکی‌یکی بشمار.',
      explanation: 'شکل نمونه ۵ مربع واحد دارد. شکل «پ» شبیه حرف T است و دقیقاً ۵ مربع واحد را می‌پوشاند.',
      referenceShape: {
        id: 'ref-3',
        label: 'شکل نمونه (۵ واحد)',
        rows: 4,
        cols: 4,
        cells: [
          [0, 1], [1, 1], [2, 1], [3, 1], [3, 2],
        ],
        color: '#ff5c0c',
      },
      gridOptions: [
        {
          id: 'opt-a',
          label: 'شکل الف',
          rows: 4,
          cols: 4,
          cells: [
            [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2],
          ],
          color: '#2ba0ff',
        },
        {
          id: 'opt-b',
          label: 'شکل ب',
          rows: 4,
          cols: 4,
          cells: [
            [1, 1], [1, 2], [2, 1], [2, 2],
          ],
          color: '#8ed461',
        },
        {
          id: 'opt-c',
          label: 'شکل پ',
          rows: 4,
          cols: 4,
          cells: [
            [0, 0], [0, 1], [0, 2], [1, 1], [2, 1],
          ],
          color: '#ff705d',
        },
      ],
      correctGridId: 'opt-c',
      correctAnswerDisplay: 'شکل پ (۵ مربع واحد)',
    },
    {
      id: 'q-area-4',
      skillId: 'skill-area-equal',
      kind: 'multiple_choice',
      prompt: 'دو مستطیل داریم: اولی با طول ۶ و عرض ۲، دومی با طول ۴ و عرض ۳. کدام جمله درباره مساحت آن‌ها درست است؟',
      hint: 'مساحت مستطیل از ضرب طول در عرض به دست می‌آید: ۶ × ۲ و ۴ × ۳ را حساب کن.',
      explanation: 'مساحت مستطیل اول ۱۲ = ۲ × ۶ و مساحت مستطیل دوم نیز ۱۲ = ۳ × ۴ است. بنابراین ظاهرشان متفاوت ولی مساحتشان کاملاً برابر است.',
      options: [
        { id: 'a', label: 'مساحت هر دو مستطیل برابر و مساوی ۱۲ واحد است.' },
        { id: 'b', label: 'مستطیل اول چون کشیده‌تر است مساحت بیشتری دارد.' },
        { id: 'c', label: 'مستطیل دوم چون عرض بیشتری دارد مساحت بیشتری دارد.' },
        { id: 'd', label: 'بدون خط‌کش نمی‌توان مساحت آن‌ها را مقایسه کرد.' },
      ],
      correctOptionId: 'a',
      correctAnswerDisplay: 'مساحت هر دو مستطیل برابر و مساوی ۱۲ واحد است.',
    },
    {
      id: 'q-area-5',
      skillId: 'skill-area-equal',
      kind: 'numeric_input',
      prompt: 'سارا یک مستطیل با مساحت ۸ مربع واحد کشید. اگر بخواهد شکل دیگری با همین مساحت بکشد که در هر ردیف آن ۲ مربع باشد، به چند ردیف نیاز دارد؟',
      hint: 'چه عددی در ۲ ضرب شود تا حاصل ۸ به دست آید؟',
      explanation: 'چون ۸ = ۲ × ۴ است، با ۴ ردیفِ ۲ مربعی دقیقاً همان مساحت ۸ مربع واحد ساخته می‌شود.',
      correctNumericAnswers: ['4'],
      numericPlaceholder: 'مثلاً ۴',
      numericUnit: 'ردیف',
      correctAnswerDisplay: '۴ ردیف',
    },
  ],
  'skill-fraction-area': [
    {
      id: 'q-frac-1',
      skillId: 'skill-fraction-area',
      kind: 'fraction_shade',
      prompt: 'برای نمایش کسر ۳/۴ (سه چهارم)، چند قسمت از این مستطیل را باید رنگ کنی؟ روی خانه‌ها کلیک کن.',
      hint: 'شکل به ۴ قسمت مساوی تقسیم شده است (مخرج ۴). صورت کسر یعنی ۳ قسمت را انتخاب کن.',
      explanation: 'وقتی کل شکل ۴ بخش مساوی دارد، رنگ کردن ۳ بخش از آن نمایشگر کسر ۳/۴ است.',
      fractionConfig: { totalParts: 4, targetParts: 3, cols: 4, shapeLabel: 'مستطیل ۴ قسمتی' },
      correctAnswerDisplay: '۳ قسمت از ۴ قسمت',
    },
    {
      id: 'q-frac-2',
      skillId: 'skill-fraction-area',
      kind: 'fraction_shade',
      prompt: 'روی مربع‌های جدول کلیک کن تا کسر ۵/۸ (پنج هشتم) را با مدل مساحتی نشان دهی.',
      hint: 'کل جدول ۸ خانه هم‌اندازه دارد. دقیقاً ۵ خانه را به دلخواه انتخاب کن.',
      explanation: 'در مدل مساحتی، هر ۵ خانه از این ۸ خانه مساوی (در هر چیدمانی) دقیقاً کسر ۵/۸ را نشان می‌دهد.',
      fractionConfig: { totalParts: 8, targetParts: 5, cols: 4, shapeLabel: 'شبکه ۸ قسمتی' },
      correctAnswerDisplay: '۵ قسمت از ۸ قسمت',
    },
    {
      id: 'q-frac-3',
      skillId: 'skill-fraction-area',
      kind: 'fraction_shade',
      prompt: 'نصف (۱/۲) این شکل ۶ قسمتی را رنگ کن.',
      hint: 'نصف عدد ۶ برابر با ۳ است! پس ۳/۶ دقیقاً معادل ۱/۲ است.',
      explanation: 'چون شکل ۶ بخش مساوی دارد، نصف آن برابر ۳ بخش است و کسر ۳/۶ با ۱/۲ برابر است.',
      fractionConfig: { totalParts: 6, targetParts: 3, cols: 3, shapeLabel: 'مستطیل ۶ قسمتی' },
      correctAnswerDisplay: '۳ قسمت از ۶ قسمت (معادل ۱/۲)',
    },
    {
      id: 'q-frac-4',
      skillId: 'skill-fraction-area',
      kind: 'multiple_choice',
      prompt: 'در یک مستطیل ۱۲ قسمتی هم‌اندازه، ۴ قسمت آن رنگ شده است. این بخش رنگی معادل کدام کسر واحد است؟',
      hint: 'ببین چند دسته ۴ تایی درون عدد ۱۲ جا می‌شود.',
      explanation: 'چون ۱۲ تقسیم بر ۴ برابر ۳ است، پس ۴ قسمت از ۱۲ قسمت دقیقاً برابر یک‌سوم (۱/۳) کل شکل است.',
      options: [
        { id: 'a', label: 'یک‌دوم (۱/۲)' },
        { id: 'b', label: 'یک‌سوم (۱/۳)' },
        { id: 'c', label: 'یک‌چهارم (۱/۴)' },
        { id: 'd', label: 'یک‌ششم (۱/۶)' },
      ],
      correctOptionId: 'b',
      correctAnswerDisplay: 'یک‌سوم (۱/۳)',
    },
  ],
  'skill-place-value': [
    {
      id: 'q-pv-1',
      skillId: 'skill-place-value',
      kind: 'numeric_input',
      prompt: 'در عدد ۴۵۸٬۲۳۰ ارزش مکانی رقم ۵ برابر با چه عددی است؟',
      mathExpr: '458,230',
      hint: 'رقم ۵ در مرتبه ده‌هزارگان قرار دارد. به جای ارقام سمت راست آن صفر بگذار.',
      explanation: 'رقم ۵ در ستون ده‌هزارگان است؛ بنابراین ارزش عددی آن برابر ۵۰٬۰۰۰ (پنجاه هزار) است.',
      correctNumericAnswers: ['50000'],
      numericPlaceholder: 'مثلاً ۵۰۰۰۰',
      correctAnswerDisplay: '۵۰٬۰۰۰',
    },
    {
      id: 'q-pv-2',
      skillId: 'skill-place-value',
      kind: 'multiple_choice',
      prompt: 'در کدام عدد زیر، رقم ۷ ارزش مکانی «هفتصد هزار» دارد؟',
      hint: 'از سمت راست سه‌تا سه‌تا جدا کن. مرتبه صدگان هزار، ششمین رقم از سمت راست است.',
      explanation: 'در عدد ۲٬۷۱۴٬۰۵۰ رقم ۷ در جایگاه صدگان هزار قرار گرفته و ارزشش ۷۰۰٬۰۰۰ است.',
      options: [
        { id: 'a', label: '۷۴٬۵۲۰' },
        { id: 'b', label: '۲٬۷۱۴٬۰۵۰' },
        { id: 'c', label: '۷٬۱۲۰٬۰۰۰' },
        { id: 'd', label: '۳۰۷٬۴۰۰' },
      ],
      correctOptionId: 'b',
      correctAnswerDisplay: '۲٬۷۱۴٬۰۵۰',
    },
    {
      id: 'q-pv-3',
      skillId: 'skill-place-value',
      kind: 'numeric_input',
      prompt: 'اگر ۱۲ بسته صدتایی و ۴ دهتایی داشته باشیم، این مقدار برابر چه عددی است؟',
      hint: '۱۰ بسته صدتایی می‌شود یک هزارتایی (۱۰۰۰). حالا ۲ صدتایی و ۴ دهتایی به آن اضافه کن.',
      explanation: '۱۲ صدتایی برابر ۱٬۲۰۰ و ۴ دهتایی برابر ۴۰ است؛ پس مجموع برابر ۱٬۲۴۰ می‌شود.',
      correctNumericAnswers: ['1240'],
      numericPlaceholder: 'عدد را وارد کن',
      correctAnswerDisplay: '۱٬۲۴۰',
    },
    {
      id: 'q-pv-4',
      skillId: 'skill-place-value',
      kind: 'multiple_choice',
      prompt: 'اگر در عدد ۳۸٬۴۰۰ جای رقم ۳ و رقم ۴ را عوض کنیم، عدد جدید چه تغییری می‌کند؟',
      hint: 'عدد جدید می‌شود ۴۸٬۳۰۰. حالا ۴۸٬۳۰۰ را با ۳۸٬۴۰۰ مقایسه کن.',
      explanation: 'با جابه‌جایی ۳ و ۴، عدد از ۳۸٬۴۰۰ به ۴۸٬۳۰۰ تبدیل می‌شود که ۹٬۹۰۰ واحد بزرگ‌تر شده است.',
      options: [
        { id: 'a', label: 'بزرگ‌تر می‌شود' },
        { id: 'b', label: 'کوچک‌تر می‌شود' },
        { id: 'c', label: 'تغییری نمی‌کند' },
      ],
      correctOptionId: 'a',
      correctAnswerDisplay: 'بزرگ‌تر می‌شود',
    },
  ],
  'skill-compare-million': [
    {
      id: 'q-cmp-1',
      skillId: 'skill-compare-million',
      kind: 'multiple_choice',
      prompt: 'کدام علامت باید بین دو عدد ۹۹٬۹۸۰ و ۱۰۰٬۱۲۰ قرار گیرد؟',
      mathExpr: '99,980   ◯   100,120',
      hint: 'اول تعداد ارقام هر عدد را بشمار! عدد ۵ رقمی همیشه از عدد ۶ رقمی کوچک‌تر است.',
      explanation: 'عدد ۹۹٬۹۸۰ فقط ۵ رقم دارد اما ۱۰۰٬۱۲۰ دارای ۶ رقم است؛ پس ۹۹٬۹۸۰ کوچک‌تر از ۱۰۰٬۱۲۰ است.',
      options: [
        { id: 'lt', label: '۹۹٬۹۸۰ کوچک‌تر از ۱۰۰٬۱۲۰ است (<)' },
        { id: 'gt', label: '۹۹٬۹۸۰ بزرگ‌تر از ۱۰۰٬۱۲۰ است (>)' },
        { id: 'eq', label: 'هر دو عدد برابرند (=)' },
      ],
      correctOptionId: 'lt',
      correctAnswerDisplay: '۹۹٬۹۸۰ کوچک‌تر از ۱۰۰٬۱۲۰ است (<)',
    },
    {
      id: 'q-cmp-2',
      skillId: 'skill-compare-million',
      kind: 'multiple_choice',
      prompt: 'بزرگ‌ترین عدد در میان گزینه‌های زیر کدام است؟',
      hint: 'هر چهار عدد ۶ رقمی هستند؛ پس از سمت چپ رقم به رقم مقایسه کن.',
      explanation: 'در مرتبه صدگان هزار، عدد ۶۴۰٬۱۹۰ با رقم ۶ شروع می‌شود و از بقیه بزرگ‌تر است.',
      options: [
        { id: 'a', label: '۵۹۹٬۹۹۹' },
        { id: 'b', label: '۶۰۴٬۹۹۰' },
        { id: 'c', label: '۶۴۰٬۱۹۰' },
        { id: 'd', label: '۶۳۹٬۹۹۹' },
      ],
      correctOptionId: 'c',
      correctAnswerDisplay: '۶۴۰٬۱۹۰',
    },
    {
      id: 'q-cmp-3',
      skillId: 'skill-compare-million',
      kind: 'numeric_input',
      prompt: 'بزرگ‌ترین عدد چهاررقمی که می‌توان ساخت چیست؟',
      hint: 'در هر چهار جایگاه بزرگ‌ترین رقم ممکن یعنی ۹ را قرار بده.',
      explanation: 'بزرگ‌ترین رقم ۹ است؛ بنابراین بزرگ‌ترین عدد چهاررقمی ۹٬۹۹۹ خواهد بود.',
      correctNumericAnswers: ['9999'],
      numericPlaceholder: 'مثلاً ۹۹۹۹',
      correctAnswerDisplay: '۹٬۹۹۹',
    },
  ],
  'skill-expanded-form': [
    {
      id: 'q-exp-1',
      skillId: 'skill-expanded-form',
      kind: 'numeric_input',
      prompt: 'فرم استاندارد این عدد گسترده چیست؟',
      mathExpr: '40,000 + 3,000 + 50 + 7',
      hint: 'دقت کن که در مرتبه صدگان عددی نیامده؛ پس جای صدگان باید صفر بگذاری!',
      explanation: '۴ ده‌هزارتایی، ۳ هزارتایی، ۰ صدتایی، ۵ دهتایی و ۷ یکی می‌شود ۴۳٬۰۵۷.',
      correctNumericAnswers: ['43057'],
      numericPlaceholder: 'عدد استاندارد را بنویس',
      correctAnswerDisplay: '۴۳٬۰۵۷',
    },
    {
      id: 'q-exp-2',
      skillId: 'skill-expanded-form',
      kind: 'multiple_choice',
      prompt: 'کدام گزینه فرم گسترده صحیح عدد ۷۰۵٬۲۱۰ است؟',
      hint: 'هر رقم غیرصفر را با ارزش مکانی خودش بنویس.',
      explanation: '۷ در صدگان هزار (۷۰۰٬۰۰۰)، ۵ در یکان هزار (۵٬۰۰۰)، ۲ در صدگان (۲۰۰) و ۱ در دهگان (۱۰).',
      options: [
        { id: 'a', label: '۷۰۰٬۰۰۰ + ۵٬۰۰۰ + ۲۰۰ + ۱۰' },
        { id: 'b', label: '۷۰۰٬۰۰۰ + ۵۰٬۰۰۰ + ۲۰۰ + ۱۰' },
        { id: 'c', label: '۷۰٬۰۰۰ + ۵٬۰۰۰ + ۲۱۰' },
      ],
      correctOptionId: 'a',
      correctAnswerDisplay: '۷۰۰٬۰۰۰ + ۵٬۰۰۰ + ۲۰۰ + ۱۰',
    },
  ],
  'skill-area-mult': [
    {
      id: 'q-mul-1',
      skillId: 'skill-area-mult',
      kind: 'numeric_input',
      prompt: 'برای محاسبه ۶ × ۲۴ با روش مساحتی، آن را به (۶ × ۲۰) + (۶ × ۴) تقسیم می‌کنیم. حاصل نهایی چقدر است؟',
      mathExpr: '24 × 6 = (20 × 6) + (4 × 6)',
      hint: 'حاصل ۶ × ۲۰ می‌شود ۱۲۰ و حاصل ۶ × ۴ می‌شود ۲۴. حالا این دو را جمع کن.',
      explanation: '۱۲۰ + ۲۴ = ۱۴۴. روش مساحتی ضرب را به دو بخش ساده دهگان و یکان می‌شکند.',
      correctNumericAnswers: ['144'],
      numericPlaceholder: 'حاصل ضرب',
      correctAnswerDisplay: '۱۴۴',
    },
    {
      id: 'q-mul-2',
      skillId: 'skill-area-mult',
      kind: 'numeric_input',
      prompt: 'با روش مساحتی حاصل ضرب ۳۵ × ۴ را حساب کن.',
      mathExpr: '35 × 4 = (30 × 4) + (5 × 4)',
      hint: '۳۰ × ۴ می‌شود ۱۲۰ و ۵ × ۴ می‌شود ۲۰.',
      explanation: '۱۲۰ + ۲۰ = ۱۴۰.',
      correctNumericAnswers: ['140'],
      numericPlaceholder: 'حاصل ضرب',
      correctAnswerDisplay: '۱۴۰',
    },
  ],
  'skill-symmetry-geo': [
    {
      id: 'q-sym-1',
      skillId: 'skill-symmetry-geo',
      kind: 'multiple_choice',
      prompt: 'یک مستطیل (که مربع نیست) چند خط تقارن دارد؟',
      hint: 'اگر مستطیل را از روی قطر تا بزنی، آیا دو گوشه دقیقاً روی هم می‌افتند؟ امتحان کن!',
      explanation: 'مستطیل فقط ۲ خط تقارن دارد (یکی افقی و یکی عمودی از وسط اضلاع)؛ قطرهای مستطیل خط تقارن نیستند.',
      options: [
        { id: 'a', label: '۲ خط تقارن' },
        { id: 'b', label: '۴ خط تقارن' },
        { id: 'c', label: '۱ خط تقارن' },
        { id: 'd', label: 'بی‌شمار خط تقارن' },
      ],
      correctOptionId: 'a',
      correctAnswerDisplay: '۲ خط تقارن',
    },
    {
      id: 'q-sym-2',
      skillId: 'skill-symmetry-geo',
      kind: 'numeric_input',
      prompt: 'یک مربع دقیقاً چند خط تقارن دارد؟',
      hint: 'علاوه بر خط افقی و عمودی، هر دو قطر مربع هم خط تقارن هستند.',
      explanation: 'مربع ۴ خط تقارن دارد: ۲ خط از وسط اضلاع روبه‌رو و ۲ قطر.',
      correctNumericAnswers: ['4'],
      numericPlaceholder: 'تعداد خط تقارن',
      numericUnit: 'خط تقارن',
      correctAnswerDisplay: '۴ خط تقارن',
    },
  ],
};

// ============================================================================
// Demo Accounts & Initial State (School-Code Entry per Spec §15)
// ============================================================================
export const DEFAULT_STUDENT_ACCOUNT: StudentAccount = {
  id: 'stu-mahoor',
  role: 'student',
  schoolCode: 'SARV-402',
  schoolName: 'دبستان سرو',
  firstName: 'ماهور',
  lastName: 'کریمی',
  className: 'کلاس چهارم سرو',
  grade: 4,
  coins: 2470,
  avatarId: null, // Triggers mandatory Avatar + Guided Tour onboarding on first login
  onboardingCompleted: false,
};

export const DEFAULT_TEACHER_ACCOUNT: TeacherAccount = {
  id: 'tch-rad',
  role: 'teacher',
  schoolCode: 'TEACH-402',
  schoolName: 'دبستان سرو',
  fullName: 'خانم مریم راد',
  subject: 'ریاضی پایه چهارم',
  avatarId: 'teacher-01',
  classes: [
    { id: 'cls-sarv', name: 'کلاس چهارم سرو', grade: 4, studentCount: 6, schoolCode: 'SARV-402' },
    { id: 'cls-arghavan', name: 'کلاس چهارم ارغوان', grade: 4, studentCount: 4, schoolCode: 'ARGH-402' },
  ],
};

export const INITIAL_STUDENT_PROGRESS: Record<string, SkillProgress> = {
  'skill-area-equal': {
    skillId: 'skill-area-equal',
    smartScore: 45,
    questionsAnswered: 3,
    correctCount: 2,
    needsAttentionCount: 1,
    elapsedSeconds: 112,
    lastPracticedAt: 'امروز',
  },
  'skill-fraction-area': {
    skillId: 'skill-fraction-area',
    smartScore: 82,
    questionsAnswered: 7,
    correctCount: 6,
    needsAttentionCount: 1,
    elapsedSeconds: 295,
    lastPracticedAt: 'دیروز',
  },
  'skill-place-value': {
    skillId: 'skill-place-value',
    smartScore: 100,
    questionsAnswered: 9,
    correctCount: 9,
    needsAttentionCount: 0,
    elapsedSeconds: 340,
    lastPracticedAt: '۲ روز پیش',
  },
  'skill-compare-million': {
    skillId: 'skill-compare-million',
    smartScore: 60,
    questionsAnswered: 4,
    correctCount: 3,
    needsAttentionCount: 1,
    elapsedSeconds: 185,
    lastPracticedAt: '۳ روز پیش',
  },
};

export const INITIAL_ASSIGNMENTS: AssignmentRecord[] = [
  {
    id: 'asg-1',
    title: 'تمرین هفتگی مساحت و شکل‌های هم‌مساحت',
    classId: 'cls-sarv',
    className: 'کلاس چهارم سرو',
    skillIds: ['skill-area-equal', 'skill-fraction-area'],
    recipientIds: 'all',
    dueDateLabel: 'چهارشنبه ۵ آذر · ساعت ۲۰:۰۰',
    instructions: 'بچه‌ها هنگام مقایسه مساحت دو شکل، حتماً مربع‌های واحد را یکی‌یکی بشمارید و عجله نکنید.',
    createdAtLabel: '۲ روز پیش',
    status: 'active',
  },
  {
    id: 'asg-2',
    title: 'مرور ارزش مکانی و مقایسه اعداد تا میلیون',
    classId: 'cls-sarv',
    className: 'کلاس چهارم سرو',
    skillIds: ['skill-place-value', 'skill-compare-million'],
    recipientIds: 'all',
    dueDateLabel: 'شنبه ۸ آذر · ساعت ۱۹:۰۰',
    instructions: 'ارقام را از سمت راست سه‌تا سه‌تا جدا کنید و سپس مقایسه را انجام دهید.',
    createdAtLabel: '۴ روز پیش',
    status: 'active',
  },
  {
    id: 'asg-3',
    title: 'ضرب مساحتی دو رقمی در یک رقمی',
    classId: 'cls-arghavan',
    className: 'کلاس چهارم ارغوان',
    skillIds: ['skill-area-mult'],
    recipientIds: 'all',
    dueDateLabel: 'پنج‌شنبه ۶ آذر · ساعت ۲۰:۰۰',
    instructions: 'ابتدا عدد دو رقمی را به دهگان و یکان باز کنید.',
    createdAtLabel: 'دیروز',
    status: 'active',
  },
];

export const INITIAL_CLASS_STUDENTS: ClassStudentRecord[] = [
  {
    id: 'stu-mahoor',
    name: 'ماهور کریمی',
    classId: 'cls-sarv',
    avatarId: 'girl-01',
    coins: 2470,
    activeDaysThisWeek: 5,
    assignedCompleted: 3,
    assignedTotal: 4,
    freePracticeCount: 2,
    avgSmartScore: 84,
    minutesPracticed: 48,
    needsSupportSkillIds: ['skill-area-equal'],
    skillScores: {
      'skill-area-equal': 45,
      'skill-fraction-area': 82,
      'skill-place-value': 100,
      'skill-compare-million': 60,
    },
  },
  {
    id: 'stu-arian',
    name: 'آریان رضایی',
    classId: 'cls-sarv',
    avatarId: 'boy-01',
    coins: 1920,
    activeDaysThisWeek: 4,
    assignedCompleted: 4,
    assignedTotal: 4,
    freePracticeCount: 3,
    avgSmartScore: 93,
    minutesPracticed: 56,
    needsSupportSkillIds: [],
    skillScores: {
      'skill-area-equal': 92,
      'skill-fraction-area': 100,
      'skill-place-value': 90,
      'skill-compare-million': 90,
    },
  },
  {
    id: 'stu-baran',
    name: 'باران احمدی',
    classId: 'cls-sarv',
    avatarId: 'girl-02',
    coins: 1450,
    activeDaysThisWeek: 3,
    assignedCompleted: 2,
    assignedTotal: 4,
    freePracticeCount: 1,
    avgSmartScore: 58,
    minutesPracticed: 29,
    needsSupportSkillIds: ['skill-area-equal', 'skill-compare-million'],
    skillScores: {
      'skill-area-equal': 38,
      'skill-fraction-area': 76,
      'skill-place-value': 80,
      'skill-compare-million': 42,
    },
  },
  {
    id: 'stu-radin',
    name: 'رادین محمدی',
    classId: 'cls-sarv',
    avatarId: 'boy-02',
    coins: 2180,
    activeDaysThisWeek: 5,
    assignedCompleted: 3,
    assignedTotal: 4,
    freePracticeCount: 4,
    avgSmartScore: 88,
    minutesPracticed: 62,
    needsSupportSkillIds: [],
    skillScores: {
      'skill-area-equal': 84,
      'skill-fraction-area': 88,
      'skill-place-value': 100,
      'skill-compare-million': 80,
    },
  },
  {
    id: 'stu-dorsa',
    name: 'درسا نادری',
    classId: 'cls-sarv',
    avatarId: 'girl-03',
    coins: 980,
    activeDaysThisWeek: 2,
    assignedCompleted: 1,
    assignedTotal: 4,
    freePracticeCount: 0,
    avgSmartScore: 46,
    minutesPracticed: 18,
    needsSupportSkillIds: ['skill-area-equal', 'skill-fraction-area'],
    skillScores: {
      'skill-area-equal': 30,
      'skill-fraction-area': 44,
      'skill-place-value': 64,
      'skill-compare-million': 0,
    },
  },
  {
    id: 'stu-kian',
    name: 'کیان مرادی',
    classId: 'cls-sarv',
    avatarId: 'boy-03',
    coins: 1730,
    activeDaysThisWeek: 4,
    assignedCompleted: 3,
    assignedTotal: 4,
    freePracticeCount: 2,
    avgSmartScore: 79,
    minutesPracticed: 41,
    needsSupportSkillIds: ['skill-compare-million'],
    skillScores: {
      'skill-area-equal': 80,
      'skill-fraction-area': 85,
      'skill-place-value': 92,
      'skill-compare-million': 58,
    },
  },
  // Class 2: Arghavan
  {
    id: 'stu-sara',
    name: 'سارا شریفی',
    classId: 'cls-arghavan',
    avatarId: 'girl-04',
    coins: 2040,
    activeDaysThisWeek: 5,
    assignedCompleted: 1,
    assignedTotal: 1,
    freePracticeCount: 3,
    avgSmartScore: 91,
    minutesPracticed: 44,
    needsSupportSkillIds: [],
    skillScores: { 'skill-area-mult': 94, 'skill-place-value': 88 },
  },
  {
    id: 'stu-parsa',
    name: 'پارسا جلالی',
    classId: 'cls-arghavan',
    avatarId: 'boy-04',
    coins: 1210,
    activeDaysThisWeek: 2,
    assignedCompleted: 0,
    assignedTotal: 1,
    freePracticeCount: 1,
    avgSmartScore: 52,
    minutesPracticed: 20,
    needsSupportSkillIds: ['skill-area-mult'],
    skillScores: { 'skill-area-mult': 48, 'skill-place-value': 56 },
  },
  {
    id: 'stu-niloofar',
    name: 'نیلوفر حسینی',
    classId: 'cls-arghavan',
    avatarId: 'girl-01',
    coins: 1860,
    activeDaysThisWeek: 4,
    assignedCompleted: 1,
    assignedTotal: 1,
    freePracticeCount: 2,
    avgSmartScore: 86,
    minutesPracticed: 38,
    needsSupportSkillIds: [],
    skillScores: { 'skill-area-mult': 86, 'skill-place-value': 86 },
  },
  {
    id: 'stu-sam',
    name: 'سام یوسفی',
    classId: 'cls-arghavan',
    avatarId: 'boy-01',
    coins: 890,
    activeDaysThisWeek: 1,
    assignedCompleted: 0,
    assignedTotal: 1,
    freePracticeCount: 0,
    avgSmartScore: 40,
    minutesPracticed: 12,
    needsSupportSkillIds: ['skill-area-mult'],
    skillScores: { 'skill-area-mult': 40 },
  },
];
