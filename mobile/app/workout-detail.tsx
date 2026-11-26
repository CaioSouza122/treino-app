import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { Label, TraceProgress } from "@/components/ui";
import { brand, font, radius, type } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { preferencias } from "@/lib/preferences";
import { parseSession, type Exercise, type Session } from "@/lib/parse-workout";
import { liberarTela, manterTelaAcesa } from "@/lib/tela-acesa";
import { dayKey, getLogs, lastLoadBefore, logId, removeLog, upsertLog, type ProgressLog } from "@/lib/progress";
import { getWorkoutHistory, type Workout } from "@/lib/workouts-api";

export default function WorkoutDetailScreen() {
  const params = useLocalSearchParams<{ workoutId?: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = dayKey();

  // Na academia o celular fica parado entre as séries: mantém a tela acesa (Configurações)
  useEffect(() => {
    if (!preferencias().telaLigada) return;
    const tag = "treino-aberto";
    manterTelaAcesa(tag);
    return () => liberarTela(tag);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const history = await getWorkoutHistory();
        // Sem id abre o mais recente; com id, nunca troca por outro treino
        const selected = params.workoutId ? history.find((item: Workout) => item.id === params.workoutId) : history[0];
        const savedLogs = await getLogs();
        if (!active) return;
        setLogs(savedLogs);
        if (!selected) setError("Nenhum treino encontrado. Gere seu primeiro treino com a IA.");
        else {
          const parsed = selected.days.map(parseSession);
          setWorkout(selected);
          setSessions(parsed);
          setExpandedId(parsed[0]?.id ?? null);
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar o treino.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [params.workoutId]);

  const todaysLogs = useMemo(() => {
    const map = new Map<string, ProgressLog>();
    for (const log of logs) if (log.date === today) map.set(log.id, log);
    return map;
  }, [logs, today]);

  function logFor(session: Session, exercise: Exercise): ProgressLog | undefined {
    if (!workout) return undefined;
    return todaysLogs.get(logId(workout.id, session.label, exercise.name, today));
  }

  const progress = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const session of sessions) {
      for (const exercise of session.exercises) {
        total++;
        if (workout && todaysLogs.has(logId(workout.id, session.label, exercise.name, today))) done++;
      }
    }
    return { done, total, ratio: total ? done / total : 0 };
  }, [sessions, todaysLogs, workout, today]);

  const minutes = sessions.find((session) => session.minutes)?.minutes;
  const atual = sessions.find((session) => session.id === expandedId) ?? sessions[0];
  const allDone = progress.total > 0 && progress.done === progress.total;

  async function toggle(session: Session, exercise: Exercise) {
    if (!workout) return;
    haptic.medium();
    const existing = logFor(session, exercise);
    const next = existing
      ? await removeLog(existing.id)
      : await upsertLog({
          date: today,
          workoutId: workout.id,
          session: session.label,
          exercise: exercise.name,
          sessionSize: session.exercises.length,
          load: null,
        });
    setLogs(next);
  }

  async function saveLoad(session: Session, exercise: Exercise, load: number | null) {
    if (!workout) return;
    const next = await upsertLog({
      date: today,
      workoutId: workout.id,
      session: session.label,
      exercise: exercise.name,
      sessionSize: session.exercises.length,
      load,
    });
    setLogs(next);
    haptic.light();
  }

  function continueWorkout() {
    if (!workout) return;
    const pending = sessions.find((session) =>
      session.exercises.some((exercise) => !todaysLogs.has(logId(workout.id, session.label, exercise.name, today))),
    );
    if (pending) setExpandedId(pending.id);
  }

  if (loading || error || !workout) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Treino" />
        <View style={styles.center}>
          <Text style={styles.message}>{loading ? "Carregando seu treino…" : error ?? "Treino não encontrado."}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.fill}>
        <ScreenHeader
          title={`Plano de ${sessions.length} ${sessions.length === 1 ? "dia" : "dias"}`}
          subtitle={`Gerado pela IA · ${new Date(workout.created_at).toLocaleDateString("pt-BR")}`}
        />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* ── Resumo ─────────────────────────────────────────────── */}
          <View style={styles.summary}>
            <Summary value={String(sessions.length)} unit="dias" />
            <View style={styles.divider} />
            <Summary value={minutes ? String(minutes) : "—"} unit="min / sessão" />
            <View style={styles.divider} />
            <Summary value={String(progress.total)} unit="exercícios" />
          </View>

          <View style={styles.overall}>
            <View style={styles.overallHead}>
              <Label>Hoje</Label>
              <Text style={styles.overallCount}>{progress.done}/{progress.total}</Text>
            </View>
            <TraceProgress ratio={progress.ratio} />
          </View>

          {/* ── Dias do plano: um por vez ─────────────────────────── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dias}>
            {sessions.map((session) => {
              const done = session.exercises.filter((exercise) => logFor(session, exercise)).length;
              const ativo = session.id === atual?.id;
              const completo = done === session.exercises.length;
              return (
                <Pressable
                  key={session.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: ativo }}
                  onPress={() => {
                    haptic.light();
                    setExpandedId(session.id);
                  }}
                  style={[styles.dia, ativo && styles.diaAtivo]}
                >
                  <Text style={[styles.diaLetra, ativo && styles.diaLetraAtiva]}>{session.label.replace(/^Treino\s+/i, "")}</Text>
                  <Text style={[styles.diaConta, completo && styles.diaCompleto]}>
                    {completo ? "✓" : `${done}/${session.exercises.length}`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {atual && (
            <SessionCard session={atual} done={atual.exercises.filter((exercise) => logFor(atual, exercise)).length}>
              {atual.exercises.map((exercise, index) => (
                <ExerciseRow
                  key={exercise.id}
                  index={index}
                  exercise={exercise}
                  log={logFor(atual, exercise)}
                  lastLoad={lastLoadBefore(logs, exercise.name, today)}
                  onToggle={() => toggle(atual, exercise)}
                  onSaveLoad={(load) => saveLoad(atual, exercise, load)}
                />
              ))}
            </SessionCard>
          )}
        </ScrollView>

        <PrimaryButton
          label={allDone ? "Treino concluído" : progress.done > 0 ? "Continuar treino" : "Começar treino"}
          onPress={continueWorkout}
          disabled={allDone}
          icon={<MaterialIcons name={allDone ? "check" : "play-arrow"} color={brand.onLime} size={20} />}
          style={styles.start}
        />
      </View>
    </ScreenContainer>
  );
}

function Summary({ value, unit }: { value: string; unit: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryUnit}>{unit}</Text>
    </View>
  );
}

function SessionCard({ session, done, children }: { session: Session; done: number; children: React.ReactNode }) {
  const ratio = session.exercises.length ? done / session.exercises.length : 0;
  return (
    <View style={styles.session}>
      <View style={styles.sessionHead}>
        <Label color={done === session.exercises.length ? brand.lime : brand.cyan}>{session.label}</Label>
        <Text style={styles.sessionTitle}>{session.subtitle}</Text>
        <Text style={styles.sessionSub}>
          {done}/{session.exercises.length} exercícios feitos hoje{session.minutes ? ` · ${session.duration}` : ""}
        </Text>
        <TraceProgress ratio={ratio} />
      </View>
      <View style={styles.exerciseList}>{children}</View>
    </View>
  );
}

/** "4x8-12" → ["4 séries", "8-12 reps"]; outros formatos ficam como vieram. */
function etiquetas(prescricao: string): string[] {
  const m = prescricao.match(/^(\d+)\s*[xX×]\s*(.+)$/);
  return m ? [`${m[1]} séries`, `${m[2].trim()} reps`] : [prescricao];
}

/** Uma linha do checklist. Ao concluir, aparece o campo para anotar a carga usada (kg). */
function ExerciseRow({
  index,
  exercise,
  log,
  lastLoad,
  onToggle,
  onSaveLoad,
}: {
  index: number;
  exercise: Exercise;
  log: ProgressLog | undefined;
  lastLoad: number | null;
  onToggle: () => void;
  onSaveLoad: (load: number | null) => void;
}) {
  const completed = !!log;
  const [text, setText] = useState(log?.load != null ? String(log.load).replace(".", ",") : "");

  useEffect(() => {
    setText(log?.load != null ? String(log.load).replace(".", ",") : "");
  }, [log?.id, log?.load]);

  function commit() {
    const value = Number(text.replace(",", "."));
    const load = text.trim() && Number.isFinite(value) && value > 0 ? value : null;
    if (load !== (log?.load ?? null)) onSaveLoad(load);
  }

  return (
    <View style={[styles.exercise, index > 0 && styles.exerciseDivider]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        onPress={onToggle}
        style={styles.exerciseMain}
      >
        <View style={[styles.check, completed && styles.checkOn]}>
          {completed ? (
            <MaterialIcons name="check" color={brand.onLime} size={14} />
          ) : (
            <Text style={styles.checkIndex}>{index + 1}</Text>
          )}
        </View>
        <View style={styles.exerciseText}>
          <Text style={[styles.exerciseName, completed && styles.exerciseDone]}>{exercise.name}</Text>
          <View style={styles.tags}>
            {etiquetas(exercise.prescription).map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
        </View>
      </Pressable>
      {completed && (
        <View style={styles.loadBox}>
          <TextInput
            accessibilityLabel={`Carga usada em ${exercise.name}, em quilos`}
            value={text}
            onChangeText={setText}
            onBlur={commit}
            onSubmitEditing={commit}
            keyboardType="decimal-pad"
            placeholder={lastLoad != null ? String(lastLoad).replace(".", ",") : "0"}
            placeholderTextColor={brand.dim}
            style={styles.loadInput}
          />
          <Text style={styles.loadUnit}>kg</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  message: { ...type.caption, fontSize: 15, textAlign: "center" },
  content: { gap: 18, paddingBottom: 24, paddingTop: 8 },
  summary: { alignItems: "center", flexDirection: "row" },
  summaryItem: { flex: 1, gap: 2 },
  summaryValue: { color: brand.text, fontFamily: font.display, fontSize: 26, letterSpacing: -0.3 },
  summaryUnit: { ...type.label, fontSize: 9.5 },
  divider: { backgroundColor: brand.border, height: 32, marginRight: 16, width: 1 },
  overall: { gap: 10 },
  overallHead: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  overallCount: { color: brand.text, fontFamily: font.displayMedium, fontSize: 13 },
  dias: { gap: 8 },
  dia: { alignItems: "center", backgroundColor: brand.surface, borderColor: brand.border, borderRadius: radius.md, borderWidth: 1, gap: 2, minWidth: 58, paddingHorizontal: 12, paddingVertical: 10 },
  diaAtivo: { backgroundColor: brand.limeSoft, borderColor: brand.lime },
  diaLetra: { color: brand.text, fontFamily: font.display, fontSize: 20 },
  diaLetraAtiva: { color: brand.lime },
  diaConta: { ...type.caption, fontSize: 11 },
  diaCompleto: { color: brand.lime },
  session: { backgroundColor: brand.surface, borderColor: brand.border, borderRadius: radius.lg, borderWidth: 1, overflow: "hidden" },
  sessionHead: { gap: 6, padding: 16 },
  sessionTitle: { ...type.h2, fontSize: 20 },
  sessionSub: { ...type.caption, marginBottom: 6 },
  exerciseList: { borderTopColor: brand.border, borderTopWidth: 1 },
  exercise: { alignItems: "center", flexDirection: "row", gap: 10, minHeight: 60, paddingHorizontal: 16, paddingVertical: 10 },
  exerciseDivider: { borderTopColor: brand.border, borderTopWidth: 1 },
  exerciseMain: { alignItems: "center", flex: 1, flexDirection: "row", gap: 12 },
  exerciseText: { flex: 1, gap: 2 },
  check: { alignItems: "center", borderColor: brand.borderStrong, borderRadius: 7, borderWidth: 1.5, height: 24, justifyContent: "center", width: 24 },
  checkOn: { backgroundColor: brand.lime, borderColor: brand.lime },
  checkIndex: { color: brand.muted, fontFamily: font.displayMedium, fontSize: 11 },
  exerciseName: { color: brand.text, fontSize: 14.5, fontWeight: "600", lineHeight: 20 },
  exerciseDone: { color: brand.muted },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  tag: { borderColor: brand.cyan, borderRadius: 6, borderWidth: 1, color: brand.cyan, fontFamily: font.displayMedium, fontSize: 11.5, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2 },
  loadBox: { alignItems: "center", flexDirection: "row", gap: 6 },
  loadInput: { backgroundColor: brand.background, borderColor: brand.lime, borderRadius: radius.sm, borderWidth: 1, color: brand.text, fontFamily: font.displayMedium, fontSize: 14, height: 38, textAlign: "center", width: 64 },
  loadUnit: { ...type.label, fontSize: 10 },
  start: { marginBottom: 6, marginTop: 4 },
  pressed: { opacity: 0.8 },
});
