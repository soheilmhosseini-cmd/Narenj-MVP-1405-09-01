/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ActivePracticeState,
  AssignmentRecord,
  ClassStudentRecord,
  DEFAULT_STUDENT_ACCOUNT,
  DEFAULT_TEACHER_ACCOUNT,
  INITIAL_ASSIGNMENTS,
  INITIAL_CLASS_STUDENTS,
  INITIAL_STUDENT_PROGRESS,
  SkillProgress,
  StudentAccount,
  UserRole,
} from './data/narenjData';
import { AuthScreen } from './components/AuthScreen';
import { StudentOnboarding } from './components/StudentOnboarding';
import { StudentWorkspace } from './components/StudentWorkspace';
import { TeacherWorkspace } from './components/TeacherWorkspace';
import { SessionSummaryData } from './components/SessionSummary';

const STORAGE_KEY = 'narenj_v3_state_v1';

interface PersistedState {
  role: UserRole | null;
  student: StudentAccount;
  progressMap: Record<string, SkillProgress>;
  assignments: AssignmentRecord[];
  classStudents: ClassStudentRecord[];
  activeSession: ActivePracticeState | null;
  highContrast: boolean;
  largeText: boolean;
}

function loadInitialState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      return {
        role: parsed.role ?? null,
        student: parsed.student ?? DEFAULT_STUDENT_ACCOUNT,
        progressMap: parsed.progressMap ?? INITIAL_STUDENT_PROGRESS,
        assignments: parsed.assignments ?? INITIAL_ASSIGNMENTS,
        classStudents: parsed.classStudents ?? INITIAL_CLASS_STUDENTS,
        activeSession: parsed.activeSession ?? null,
        highContrast: Boolean(parsed.highContrast),
        largeText: Boolean(parsed.largeText),
      };
    }
  } catch {
    // Ignore corrupted storage and fall back to defaults
  }
  return {
    role: null,
    student: DEFAULT_STUDENT_ACCOUNT,
    progressMap: INITIAL_STUDENT_PROGRESS,
    assignments: INITIAL_ASSIGNMENTS,
    classStudents: INITIAL_CLASS_STUDENTS,
    activeSession: null,
    highContrast: false,
    largeText: false,
  };
}

export default function App() {
  const [state, setState] = useState<PersistedState>(loadInitialState);

  // Persist confirmed state across sessions
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  // Apply accessibility classes on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('narenj-high-contrast', state.highContrast);
    root.classList.toggle('narenj-large-text', state.largeText);
  }, [state.highContrast, state.largeText]);

  const handleLogin = (role: UserRole) => {
    setState((prev) => ({ ...prev, role }));
  };

  const handleLogout = () => {
    setState((prev) => ({ ...prev, role: null }));
  };

  const handleCompleteOnboarding = (avatarId: string) => {
    setState((prev) => ({
      ...prev,
      student: {
        ...prev.student,
        avatarId,
        onboardingCompleted: true,
      },
      classStudents: prev.classStudents.map((st) =>
        st.id === prev.student.id ? { ...st, avatarId } : st
      ),
    }));
  };

  const handleChangeAvatar = (avatarId: string) => {
    setState((prev) => ({
      ...prev,
      student: { ...prev.student, avatarId },
      classStudents: prev.classStudents.map((st) =>
        st.id === prev.student.id ? { ...st, avatarId } : st
      ),
    }));
  };

  const handleReplayOnboarding = () => {
    setState((prev) => ({
      ...prev,
      student: { ...prev.student, onboardingCompleted: false },
    }));
  };

  const handleStartOrResumeSkill = (skillId: string, assignmentId?: string) => {
    setState((prev) => {
      // Resume if matching unfinished session exists
      if (prev.activeSession && prev.activeSession.skillId === skillId) {
        return prev;
      }
      const existingProgress = prev.progressMap[skillId];
      const freshSession: ActivePracticeState = {
        skillId,
        assignmentId,
        currentIndex: 0,
        answeredCount: 0,
        correctCount: 0,
        needsAttentionCount: 0,
        smartScore: existingProgress?.smartScore ?? 0,
        elapsedSeconds: 0,
        history: [],
      };
      return { ...prev, activeSession: freshSession };
    });
  };

  const handleUpdateActiveSession = (nextSession: ActivePracticeState) => {
    setState((prev) => ({ ...prev, activeSession: nextSession }));
  };

  const handlePauseSession = (saved: ActivePracticeState) => {
    setState((prev) => {
      const existing = prev.progressMap[saved.skillId];
      const nextProgress: SkillProgress = {
        skillId: saved.skillId,
        smartScore: Math.max(existing?.smartScore ?? 0, saved.smartScore),
        questionsAnswered: (existing?.questionsAnswered ?? 0) + saved.answeredCount,
        correctCount: (existing?.correctCount ?? 0) + saved.correctCount,
        needsAttentionCount: (existing?.needsAttentionCount ?? 0) + saved.needsAttentionCount,
        elapsedSeconds: (existing?.elapsedSeconds ?? 0) + saved.elapsedSeconds,
        lastPracticedAt: 'همین الان',
      };
      return {
        ...prev,
        activeSession: saved.answeredCount > 0 ? saved : null,
        progressMap:
          saved.answeredCount > 0
            ? { ...prev.progressMap, [saved.skillId]: nextProgress }
            : prev.progressMap,
      };
    });
  };

  const handleCompleteSession = (summary: SessionSummaryData) => {
    setState((prev) => {
      const existing = prev.progressMap[summary.skill.id];
      const updatedScore = Math.max(existing?.smartScore ?? 0, summary.finalSmartScore);
      const nextProgress: SkillProgress = {
        skillId: summary.skill.id,
        smartScore: updatedScore,
        questionsAnswered: (existing?.questionsAnswered ?? 0) + summary.answeredCount,
        correctCount: (existing?.correctCount ?? 0) + summary.correctCount,
        needsAttentionCount: (existing?.needsAttentionCount ?? 0) + summary.needsAttentionCount,
        elapsedSeconds: (existing?.elapsedSeconds ?? 0) + summary.elapsedSeconds,
        lastPracticedAt: 'همین الان',
      };

      // Sync Mahoor's live progress into Teacher analytics as well!
      const updatedClassStudents = prev.classStudents.map((st) => {
        if (st.id !== prev.student.id) return st;
        const nextSkillScores = { ...st.skillScores, [summary.skill.id]: updatedScore };
        const scoreValues = Object.values(nextSkillScores).filter((v) => v > 0);
        const nextAvg =
          scoreValues.length > 0
            ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
            : st.avgSmartScore;
        const nextNeedsSupport = Object.entries(nextSkillScores)
          .filter(([, sc]) => sc > 0 && sc < 60)
          .map(([sid]) => sid);

        return {
          ...st,
          coins: st.coins + summary.coinsEarned,
          skillScores: nextSkillScores,
          avgSmartScore: nextAvg,
          needsSupportSkillIds: nextNeedsSupport,
          minutesPracticed: st.minutesPracticed + Math.max(1, Math.round(summary.elapsedSeconds / 60)),
        };
      });

      return {
        ...prev,
        activeSession: null,
        student: {
          ...prev.student,
          coins: prev.student.coins + summary.coinsEarned,
        },
        progressMap: {
          ...prev.progressMap,
          [summary.skill.id]: nextProgress,
        },
        classStudents: updatedClassStudents,
      };
    });
  };

  const handlePublishAssignment = (newAssignment: AssignmentRecord) => {
    setState((prev) => ({
      ...prev,
      assignments: [newAssignment, ...prev.assignments],
    }));
  };

  // 1. Unauthenticated -> School-Code Entry Screen (role auto-resolved from school code)
  if (!state.role) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // 2. Student Role -> Mandatory Avatar + Guided Tour Onboarding (Owner Override §8)
  if (state.role === 'student' && !state.student.onboardingCompleted) {
    return (
      <StudentOnboarding
        student={state.student}
        onComplete={handleCompleteOnboarding}
      />
    );
  }

  // 3. Student Authenticated Workspace
  if (state.role === 'student') {
    return (
      <StudentWorkspace
        student={state.student}
        progressMap={state.progressMap}
        assignments={state.assignments}
        activeSession={state.activeSession}
        highContrast={state.highContrast}
        largeText={state.largeText}
        onToggleHighContrast={() =>
          setState((p) => ({ ...p, highContrast: !p.highContrast }))
        }
        onToggleLargeText={() =>
          setState((p) => ({ ...p, largeText: !p.largeText }))
        }
        onChangeAvatar={handleChangeAvatar}
        onReplayOnboarding={handleReplayOnboarding}
        onStartOrResumeSkill={handleStartOrResumeSkill}
        onUpdateActiveSession={handleUpdateActiveSession}
        onCompleteSession={handleCompleteSession}
        onPauseSession={handlePauseSession}
        onSwitchToTeacherDemo={() => setState((p) => ({ ...p, role: 'teacher' }))}
        onLogout={handleLogout}
      />
    );
  }

  // 4. Teacher Authenticated Workspace
  return (
    <TeacherWorkspace
      teacher={DEFAULT_TEACHER_ACCOUNT}
      assignments={state.assignments}
      classStudents={state.classStudents}
      onPublishAssignment={handlePublishAssignment}
      onSwitchToStudentDemo={() => setState((p) => ({ ...p, role: 'student' }))}
      onLogout={handleLogout}
    />
  );
}
