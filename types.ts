import type { LiveHealthMetrics } from './healthConnect';

export type WorkoutType = 'strength' | 'cardio';
export type StrengthExercise = { id: string; title: string; repetitions: string; weight: string };
export type StoredStrengthExercise = { title: string; repetitions: number; weight: number };
export type Entry =
  | { id: string; title: string; titleKey?: 'strengthSession' | 'activity'; detail: string; accent: string; type: 'strength'; items: string[]; date: string; strength: { exercises: StoredStrengthExercise[] } }
  | { id: string; title: string; titleKey?: 'strengthSession' | 'activity'; detail: string; accent: string; type: 'cardio'; items: string[]; date: string; cardio: { activity: string; durationSeconds: number; metrics: LiveHealthMetrics } };

export type Language = 'en' | 'de' | 'fr' | 'it' | 'es';

export type Copy = { language: string; overview: string; strength: string; cardio: string; recent: string; settings: string; back: string; logStrength: string; strengthSubtitle: string; logCardio: string; cardioSubtitle: string; exercise: string; repetitions: string; weight: string; selectExercise: string; addExercise: string; saveSession: string; saveActivity: string; exercisesInSession: string; recordingWorkout: string; readyToRecord: string; start: string; stop: string; duration: string; phoneWatchData: string; sensorDetail: string; speed: string; steps: string; heartRate: string; calories: string; thisWeek: string; sessionsLogged: string; keepBuilding: string; goalReached?: string; logWorkout: string; recentActivity: string; viewAll: string; recentSubtitle: string; noWorkouts: string; sessionDetails: string; setGoals: string; theme: string; dark: string; light: string; strengthGoal: string; cardioGoal: string; strengthSession: string; exercises: string; reps: string; kg: string; activity: string; minutes: string; sensorPending: string; walking: string; jogging: string; running: string; intention: string; addNewExercise: string; chooseCategory: string; confirmAdd: string; translatingExercise: string; translateExerciseFailed: string; installHealthConnect: string; healthConnectMissing: string; exportData: string; exportTitle: string; exportSubtitle: string; chooseFormat: string; csvFormat: string; pdfFormat: string; rangeAll: string; rangeWeek: string; rangeMonth: string; rangeYear: string; rangeCustom: string; rangeFrom: string; rangeTo: string; entriesInExport: string; exportFailed: string; exportUnavailable: string; dateHeader: string; typeHeader: string; titleHeader: string; detailsHeader: string; exportColumnDate: string; exportColumnType: string; exportColumnTitle: string; exportColumnExercise: string; exportColumnReps: string; exportColumnWeight: string; exportColumnDuration: string; exportColumnHeartRate: string; exportColumnSteps: string; exportColumnSpeed: string; exportColumnCalories: string };

export const localeMap: Record<Language, string> = { en: 'en-GB', de: 'de-DE', fr: 'fr-FR', it: 'it-IT', es: 'es-ES' };

export function formatEntryDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(localeMap[language], { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function getEntryTitle(entry: Entry, copy: Copy) {
  if (entry.titleKey === 'strengthSession') return copy.strengthSession;
  if (entry.titleKey === 'activity') return getActivityLabel(entry.title, copy);
  return entry.title;
}

export function getActivityLabel(activity: string, copy: Copy) {
  return ({ Walking: copy.walking, Jogging: copy.jogging, Running: copy.running } as Record<string, string>)[activity] || activity;
}
