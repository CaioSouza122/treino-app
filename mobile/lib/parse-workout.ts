import type { WorkoutDay } from "@/lib/workouts-api";

export type Exercise = { id: string; name: string; prescription: string; completed: boolean };
export type Session = {
  id: string;
  label: string;
  subtitle: string;
  duration: string;
  minutes: number | null;
  exercises: Exercise[];
};

/** Converte o texto livre devolvido pela IA em uma sessão estruturada. */
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
        prescription: match?.[2]?.trim() || "Conforme orientação",
        completed: false,
      };
    });

  const minutesText = day.exercicios.match(/Tempo estimado:\s*(\d+)/i)?.[1];
  const minutes = minutesText ? Number(minutesText) : null;

  return {
    id: `${day.dia}-${dayIndex}`,
    label: day.dia || `Treino ${String.fromCharCode(65 + dayIndex)}`,
    subtitle: day.foco || "Treino personalizado",
    duration: minutes ? `${minutes} min` : "—",
    minutes,
    exercises: exercises.length
      ? exercises
      : [{ id: `${day.dia}-empty`, name: "Consulte a descrição do treino", prescription: "—", completed: false }],
  };
}
