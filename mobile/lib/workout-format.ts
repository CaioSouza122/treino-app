import type { WorkoutDay } from "@/lib/workouts-api";

export type Exercise = { id: string; name: string; prescription: string; completed: boolean };
export type Session = { id: string; label: string; subtitle: string; minutes: number; exercises: Exercise[] };

const DURATION = /Tempo estimado:\s*(\d+)/i;

/** Turns the free-text `exercicios` block returned by the API into structured exercises. */
export function parseSession(day: WorkoutDay, dayIndex: number): Session {
  const lines = day.exercicios.split("\n").map((line) => line.trim()).filter(Boolean);
  const exercises = lines
    .filter((line) => !/^tempo estimado:/i.test(line))
    .map((line, index) => {
      const clean = line.replace(/^[-*•\d.)]+\s*/, "");
      const match = clean.match(/^(.*?)\s*[-–—:]\s*(\d[^\n]*)$/);
      return {
        id: `${day.dia}-${index}`,
        name: match?.[1]?.trim() || clean,
        prescription: match?.[2]?.trim() || "3x10 a 12 repetições",
        completed: false,
      };
    });

  return {
    id: `${day.dia}-${dayIndex}`,
    label: day.dia || `Treino ${sessionLetter(dayIndex)}`,
    subtitle: day.foco || "Sessão de hipertrofia",
    minutes: Number(day.exercicios.match(DURATION)?.[1] ?? 50),
    exercises: exercises.length
      ? exercises
      : [{ id: `${day.dia}-empty`, name: "Consulte o protocolo de treino", prescription: "3x12", completed: false }],
  };
}

export function sessionLetter(index: number) {
  return String.fromCharCode(65 + index);
}
