export type Exercise = {
  id: string;
  name: string;
  prescription: string;
  completed: boolean;
};

export type WorkoutSession = {
  id: string;
  label: string;
  subtitle: string;
  duration: string;
  exercises: Exercise[];
};

export const initialSessions: WorkoutSession[] = [
  {
    id: "a",
    label: "Sessão A",
    subtitle: "Peito e tríceps",
    duration: "60 min",
    exercises: [
      { id: "1", name: "Supino reto", prescription: "4× 8–12", completed: false },
      { id: "2", name: "Supino inclinado halter", prescription: "3× 10–12", completed: false },
      { id: "3", name: "Crucifixo", prescription: "3× 12–15", completed: false },
      { id: "4", name: "Tríceps corda", prescription: "4× 12", completed: false },
      { id: "5", name: "Tríceps francês", prescription: "3× 10–12", completed: false },
    ],
  },
  {
    id: "b",
    label: "Sessão B",
    subtitle: "Costas e bíceps",
    duration: "60 min",
    exercises: [
      { id: "6", name: "Puxada frontal", prescription: "4× 10", completed: false },
      { id: "7", name: "Remada curvada", prescription: "4× 8–12", completed: false },
      { id: "8", name: "Rosca direta", prescription: "3× 10–12", completed: false },
      { id: "9", name: "Rosca martelo", prescription: "3× 12", completed: false },
    ],
  },
];

export function progressFor(exercises: Exercise[]) {
  const done = exercises.filter((exercise) => exercise.completed).length;
  return { done, total: exercises.length, ratio: exercises.length ? done / exercises.length : 0 };
}
