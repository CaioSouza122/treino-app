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
    .map((line) => {
      const marcado = /^([-*•]|\d+[.)])\s+/.test(line);
      const clean = line.replace(/^([-*•]|\d+[.)])\s+/, "");
      // Separador " — 4x10" ou ": 3x12" (exige espaço em volta do traço para não cortar "30-45s")
      const match = clean.match(/^(.*?)\s+[-–—]\s+(\d.*)$/) ?? clean.match(/^(.*?):\s*(\d.*)$/);
      // Linha sem marcador de lista e sem prescrição é anotação ("Descanso de 60s", "PROTOCOLO: ..."),
      // não exercício
      if (!marcado && !match) return null;
      return { name: match?.[1]?.trim() || clean, prescription: match?.[2]?.trim() || "Conforme orientação" };
    })
    .filter((item): item is { name: string; prescription: string } => item !== null)
    .map((item, index) => ({ id: `${day.dia}-${index}`, ...item, completed: false }));

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
