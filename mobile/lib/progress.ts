import AsyncStorage from "@react-native-async-storage/async-storage";

/** Completed exercise ids, keyed by session id. */
export type SessionProgress = Record<string, string[]>;

type StoredProgress = { date: string; done: SessionProgress };

const progressKey = (workoutId: string) => `treinoai:progress:${workoutId}`;

/** Local calendar day (YYYY-MM-DD); checks only count for the day they were made. */
function todayKey() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export async function getTodayProgress(workoutId: string): Promise<SessionProgress> {
  const raw = await AsyncStorage.getItem(progressKey(workoutId));
  if (!raw) return {};
  try {
    const stored = JSON.parse(raw) as StoredProgress;
    return stored.date === todayKey() ? stored.done : {};
  } catch {
    await AsyncStorage.removeItem(progressKey(workoutId));
    return {};
  }
}

export async function saveTodayProgress(workoutId: string, done: SessionProgress): Promise<void> {
  const stored: StoredProgress = { date: todayKey(), done };
  await AsyncStorage.setItem(progressKey(workoutId), JSON.stringify(stored));
}
