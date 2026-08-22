type TestEntry = {
  id: string;
  title: string;
  detail: string;
  accent: string;
  type: 'strength' | 'cardio';
  items: string[];
  date: string;
};

const strengthExerciseNames = ['Bench Press', 'Squat', 'Deadlift', 'Chest Press', 'Rowing', 'Overhead Press', 'Leg Press', 'Pull-Up'];
const cardioActivities = ['Walking', 'Jogging', 'Running'];
const sessionDate = (sequence: number) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(sequence / 3) * 7 - (sequence % 3) * 2);
  date.setHours(7 + (sequence % 4), (sequence * 15) % 60, 0, 0);
  return date.toISOString();
};

const cardioSessionDate = (index: number) => {
  const date = new Date();
  if (index < 3) {
    date.setDate(date.getDate() - index * 2);
  } else if (index < 33) {
    date.setDate(1 + ((index - 3) % Math.max(1, date.getDate() - 1)));
  } else if (index < 63) {
    date.setMonth(date.getMonth() - 1, 1 + ((index - 33) % 28));
  } else {
    date.setMonth(date.getMonth() - 2 - Math.floor((index - 63) / 20), 1 + ((index - 63) % 28));
  }
  date.setHours(7 + (index % 4), (index * 15) % 60, 0, 0);
  return date.toISOString();
};

export const testStrengthEntries: TestEntry[] = Array.from({ length: 150 }, (_, index) => {
  const exercise = strengthExerciseNames[index % strengthExerciseNames.length];
  const exerciseCount = (index % 3) + 1;
  const repetitions = 8 + (index % 5) * 2;
  const weight = 20 + (index % 10) * 5;
  return {
    id: `test-strength-${index + 1}`,
    title: `Strength session ${index + 1}`,
    detail: `${exerciseCount} exercises · ${exercise} · ${repetitions} reps · ${weight} kg`,
    accent: '#FF6B4A',
    type: 'strength',
    date: sessionDate(index),
    items: Array.from({ length: exerciseCount }, (_, itemIndex) => {
      const itemExercise = strengthExerciseNames[(index + itemIndex) % strengthExerciseNames.length];
      return `${itemExercise} · ${repetitions} reps · ${weight + itemIndex * 5} kg`;
    }),
  };
});

export const testCardioEntries: TestEntry[] = Array.from({ length: 100 }, (_, index) => {
  const activity = cardioActivities[index % cardioActivities.length];
  const duration = 20 + (index % 8) * 5;
  return {
    id: `test-cardio-${index + 1}`,
    title: activity,
    detail: `${duration} min · Sensor data pending`,
    accent: '#9BE15D',
    type: 'cardio',
    date: cardioSessionDate(index),
    items: [`Activity: ${activity}`, `Duration: ${duration} minutes`, 'Sensor data pending'],
  };
});

export const testEntries: TestEntry[] = [...testStrengthEntries, ...testCardioEntries].sort((first, second) => Date.parse(second.date) - Date.parse(first.date));
