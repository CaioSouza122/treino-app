import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Registro de treino: cada exercício marcado como feito vira um log.
 * A carga (kg) é opcional no momento da marcação e preenchida em seguida.
 */
export type ProgressLog = {
  id: string;
  /** Dia local no formato YYYY-MM-DD. */
  date: string;
  ts: number;
  workoutId: string;
  session: string;
  exercise: string;
  /** Quantidade de exercícios da sessão — usada para saber se o dia foi concluído. */
  sessionSize: number;
  load: number | null;
};

const KEY = "treinoai:progress-logs";

export function dayKey(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function normalizeExercise(name: string): string {
  return name.trim().toLowerCase();
}

export function logId(workoutId: string, session: string, exercise: string, date: string): string {
  return `${date}|${workoutId}|${session}|${normalizeExercise(exercise)}`;
}

export async function getLogs(): Promise<ProgressLog[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ProgressLog[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveLogs(logs: ProgressLog[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(logs));
}

/** Cria ou atualiza o log (mesmo dia + treino + sessão + exercício). Devolve a lista nova. */
/** Apaga checklist e cargas registradas neste aparelho. */
export async function limparProgresso(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export async function upsertLog(log: Omit<ProgressLog, "id" | "ts">): Promise<ProgressLog[]> {
  const logs = await getLogs();
  const id = logId(log.workoutId, log.session, log.exercise, log.date);
  const next = logs.filter((item) => item.id !== id);
  next.push({ ...log, id, ts: Date.now() });
  await saveLogs(next);
  return next;
}

export async function removeLog(id: string): Promise<ProgressLog[]> {
  const next = (await getLogs()).filter((item) => item.id !== id);
  await saveLogs(next);
  return next;
}

/* ── Frequência ─────────────────────────────────────────────────────────── */

/** Dias em que alguma sessão foi concluída por inteiro. */
export function completedDays(logs: ProgressLog[]): Set<string> {
  const groups = new Map<string, { size: number; exercises: Set<string>; date: string }>();
  for (const log of logs) {
    const key = `${log.date}|${log.workoutId}|${log.session}`;
    const group = groups.get(key) ?? { size: log.sessionSize, exercises: new Set<string>(), date: log.date };
    group.exercises.add(normalizeExercise(log.exercise));
    groups.set(key, group);
  }
  const days = new Set<string>();
  groups.forEach((group) => {
    if (group.exercises.size >= group.size) days.add(group.date);
  });
  return days;
}

export type WeekStat = { start: string; label: string; done: number; planned: number; current: boolean };

function mondayOf(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offset);
  return copy;
}

/** Últimas `weeks` semanas (segunda a domingo), da mais antiga para a atual. */
export function weeklyFrequency(logs: ProgressLog[], planned: number, weeks = 8, now: Date = new Date()): WeekStat[] {
  const days = completedDays(logs);
  const thisMonday = mondayOf(now);
  const result: WeekStat[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(thisMonday);
    start.setDate(start.getDate() - i * 7);
    let done = 0;
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + d);
      if (days.has(dayKey(day))) done++;
    }
    result.push({
      start: dayKey(start),
      label: `${String(start.getDate()).padStart(2, "0")}/${String(start.getMonth() + 1).padStart(2, "0")}`,
      done,
      planned,
      current: i === 0,
    });
  }
  return result;
}

/** Percentual concluído do planejado nas semanas fornecidas (cada semana limitada ao planejado). */
export function adherence(weeks: WeekStat[]): number {
  const planned = weeks.reduce((sum, week) => sum + week.planned, 0);
  if (!planned) return 0;
  const done = weeks.reduce((sum, week) => sum + Math.min(week.done, week.planned), 0);
  return Math.round((done / planned) * 100);
}

/* ── Progressão de carga ────────────────────────────────────────────────── */

export type TrackedExercise = { key: string; name: string; count: number };

/** Exercícios que já têm carga registrada, do mais registrado para o menos. */
export function trackedExercises(logs: ProgressLog[]): TrackedExercise[] {
  const map = new Map<string, TrackedExercise>();
  for (const log of logs) {
    if (log.load == null) continue;
    const key = normalizeExercise(log.exercise);
    const current = map.get(key);
    if (current) current.count++;
    else map.set(key, { key, name: log.exercise, count: 1 });
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export type StrengthPoint = { date: string; load: number };

/** Maior carga de cada dia para o exercício, em ordem cronológica. */
export function strengthSeries(logs: ProgressLog[], key: string): StrengthPoint[] {
  const byDate = new Map<string, number>();
  for (const log of logs) {
    if (log.load == null || normalizeExercise(log.exercise) !== key) continue;
    byDate.set(log.date, Math.max(byDate.get(log.date) ?? 0, log.load));
  }
  return Array.from(byDate.entries())
    .map(([date, load]) => ({ date, load }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Última carga registrada antes do dia informado (para sugerir no campo). */
export function lastLoadBefore(logs: ProgressLog[], exercise: string, date: string): number | null {
  const key = normalizeExercise(exercise);
  const points = strengthSeries(logs, key).filter((point) => point.date < date);
  return points.length ? points[points.length - 1].load : null;
}

export function formatKg(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1).replace(".", ",")} kg`;
}

export function shortDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}
