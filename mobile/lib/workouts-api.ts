import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiCall } from "@/lib/_core/api";

export type WorkoutRequest = {
  altura: number;
  peso: number;
  idade: number;
  vezes_por_semana: number;
  objetivo: string;
  tempo: number;
  nivel?: string;
};

export type WorkoutDay = {
  dia: string;
  foco: string;
  exercicios: string;
};

export type Workout = {
  id: string;
  user_id: string;
  created_at: string;
  /** "ia" ou "reserva" (treino padrão quando a IA está indisponível). */
  fonte?: "ia" | "reserva";
  days: WorkoutDay[];
};

export type LocalWorkout = Workout & { source: "api" | "generated" };

const LAST_WORKOUT_KEY = "treinoai:last-workout";

export async function generateWorkout(payload: WorkoutRequest): Promise<WorkoutDay[]> {
  return apiCall<WorkoutDay[]>("/gerar-treino-ia", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Histórico da conta logada (o backend identifica o usuário pelo token). */
export async function getWorkoutHistory(): Promise<Workout[]> {
  return apiCall<Workout[]>("/historico");
}

export async function saveLastWorkout(workout: LocalWorkout): Promise<void> {
  await AsyncStorage.setItem(LAST_WORKOUT_KEY, JSON.stringify(workout));
}

export async function getLastWorkout(): Promise<LocalWorkout | null> {
  const value = await AsyncStorage.getItem(LAST_WORKOUT_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as LocalWorkout;
  } catch {
    await AsyncStorage.removeItem(LAST_WORKOUT_KEY);
    return null;
  }
}

export function workoutFromGeneratedDays(days: WorkoutDay[], payload: WorkoutRequest): LocalWorkout {
  return {
    id: `local-${Date.now()}`,
    user_id: "local",
    created_at: new Date().toISOString(),
    days,
    source: "generated",
  };
}
