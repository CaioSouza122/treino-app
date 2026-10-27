import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiCall, apiRequest } from "@/lib/_core/api";

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
  /** Código de por que veio da reserva (cabeçalho X-Motivo-Reserva), para diagnóstico. */
  motivo?: string;
  days: WorkoutDay[];
};

export type LocalWorkout = Workout & { source: "api" | "generated" };

export type GeneratedWorkout = { days: WorkoutDay[]; fonte: "ia" | "reserva"; motivo?: string };

const LAST_WORKOUT_KEY = "treinoai:last-workout";

export async function generateWorkout(payload: WorkoutRequest): Promise<GeneratedWorkout> {
  const { data, headers } = await apiRequest<WorkoutDay[]>("/gerar-treino-ia", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  // O backend só manda o cabeçalho quando o treino veio da reserva
  const motivo = headers.get("X-Motivo-Reserva") ?? undefined;
  return { days: data, fonte: motivo ? "reserva" : "ia", motivo };
}

/**
 * Acorda o backend e a API de IA (no Render free os dois dormem): chamado ao abrir o app,
 * para que o toque em Gerar treino não espere mais de um minuto. Falhas são ignoradas.
 */
export function acordarServidores(): void {
  apiCall("/acordar").catch(() => {});
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

export function workoutFromGeneratedDays(gerado: GeneratedWorkout): LocalWorkout {
  return {
    id: `local-${Date.now()}`,
    user_id: "local",
    created_at: new Date().toISOString(),
    days: gerado.days,
    fonte: gerado.fonte,
    motivo: gerado.motivo,
    source: "generated",
  };
}
