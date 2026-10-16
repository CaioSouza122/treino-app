import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { brand } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { getLastWorkout, getWorkoutHistory, type Workout, type WorkoutDay } from "@/lib/workouts-api";

type Exercise = { id: string; name: string; prescription: string; completed: boolean };
type Session = { id: string; label: string; subtitle: string; duration: string; exercises: Exercise[] };

const userId = process.env.EXPO_PUBLIC_TREINO_USER_ID || "mobile-demo-user";

function parseExercises(day: WorkoutDay, dayIndex: number): Session {
  const lines = day.exercicios.split("\n").map((line: string) => line.trim()).filter(Boolean);
  const exercises = lines
    .filter((line: string) => !/^tempo estimado:/i.test(line))
    .map((line: string, index: number) => {
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
    label: day.dia || `Treino ${String.fromCharCode(65 + dayIndex)}`,
    subtitle: day.foco || "Sessão de Hipertrofia",
    duration: day.exercicios.match(/Tempo estimado:\s*(\d+)/i)?.[1] ? `${day.exercicios.match(/Tempo estimado:\s*(\d+)/i)?.[1]} min` : "50 min",
    exercises: exercises.length ? exercises : [{ id: `${day.dia}-empty`, name: "Consulte o protocolo de treino", prescription: "3x12", completed: false }],
  };
}

export default function WorkoutDetailScreen() {
  const params = useLocalSearchParams<{ workoutId?: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const local = await getLastWorkout();
        const history = await getWorkoutHistory(userId).catch(() => []);
        const selected = history.find((item: Workout) => item.id === params.workoutId) ?? history[0] ?? local;
        if (!active) return;
        if (!selected) setError("Nenhum treino encontrado. Gere seu primeiro treino com a IA.");
        else {
          setWorkout(selected);
          setSessions(selected.days.map(parseExercises));
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

  const progress = useMemo(() => {
    const all = sessions.flatMap((session) => session.exercises);
    const done = all.filter((exercise) => exercise.completed).length;
    return { done, total: all.length, ratio: all.length ? done / all.length : 0 };
  }, [sessions]);

  function toggle(id: string) {
    haptic.medium();
    setSessions((current) =>
      current.map((session) => ({
        ...session,
        exercises: session.exercises.map((exercise) =>
          exercise.id === id ? { ...exercise, completed: !exercise.completed } : exercise
        ),
      }))
    );
  }

  if (loading) {
    return (
      <ScreenContainer className="px-5">
        <View style={styles.center}>
          <MaterialIcons name="sync" size={32} color={brand.blueGlow} />
          <Text style={styles.message}>Carregando protocolo de treino...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !workout) {
    return (
      <ScreenContainer className="px-5">
        <View style={styles.center}>
          <MaterialIcons name="warning" size={32} color={brand.danger} />
          <Text style={styles.message}>{error ?? "Treino não encontrado."}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={sessions[0]?.subtitle || "Plano Hipertrofia"}
          subtitle={`OTIMIZADO POR IA · ${new Date(workout.created_at).toLocaleDateString("pt-BR")}`}
          right={
            <Pressable style={styles.menuBtn}>
              <MaterialIcons name="more-vert" color={brand.text} size={22} />
            </Pressable>
          }
        />

        {/* Métricas do treino */}
        <View style={styles.metricsRow}>
          <MetricBox icon="event-repeat" value={String(sessions.length)} label="dias/sem" color={brand.blueGlow} />
          <MetricBox icon="timer" value={sessions[0]?.duration.replace(" min", "") || "50"} label="min/sessão" color={brand.neonLime} />
          <MetricBox icon="fitness-center" value={String(sessions.reduce((sum, session) => sum + session.exercises.length, 0))} label="exercícios" color={brand.violet} />
          <MetricBox icon="insights" value="ALTA" label="intensidade" color={brand.success} />
        </View>

        {/* Progresso Geral */}
        <View style={styles.overallProgressCard}>
          <View style={styles.overallHeader}>
            <Text style={styles.overallTitle}>PROGRESSO DA SESSÃO</Text>
            <Text style={styles.overallRatio}>{progress.done} de {progress.total} concluídos</Text>
          </View>
          <View style={styles.trackBar}>
            <View style={[styles.fillBar, { width: `${progress.ratio * 100}%` }]} />
          </View>
        </View>

        {/* Listagem de Sessões */}
        {sessions.map((session, index) => (
          <SessionCard key={session.id} session={session} defaultExpanded={index === 0} onToggle={toggle} />
        ))}

        <PrimaryButton
          label={progress.done === progress.total ? "Concluir Sessão de Treino" : "Iniciar Treino Atual"}
          onPress={() => haptic.success()}
          variant={progress.done === progress.total ? "primary" : "accent"}
          icon={<MaterialIcons name={progress.done === progress.total ? "check-circle" : "play-arrow"} color={brand.text} size={20} />}
          style={styles.startBtn}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

function MetricBox({ icon, value, label, color }: { icon: keyof typeof MaterialIcons.glyphMap; value: string; label: string; color: string }) {
  return (
    <View style={styles.metricCard}>
      <MaterialIcons name={icon} color={color} size={18} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SessionCard({ session, defaultExpanded, onToggle }: { session: Session; defaultExpanded: boolean; onToggle: (id: string) => void }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const done = session.exercises.filter((ex) => ex.completed).length;
  const ratio = session.exercises.length ? done / session.exercises.length : 0;

  return (
    <View style={styles.sessionCard}>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.sessionHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sessionTitle}>{session.label} — {session.subtitle}</Text>
          <Text style={styles.sessionSub}>{done} de {session.exercises.length} exercícios · {session.duration}</Text>
        </View>
        <MaterialIcons name={expanded ? "expand-less" : "expand-more"} color={brand.muted} size={24} />
      </Pressable>

      <View style={styles.sessionTrack}>
        <View style={[styles.sessionTrackFill, { width: `${ratio * 100}%` }]} />
      </View>

      {expanded && (
        <View style={styles.exerciseList}>
          {session.exercises.map((exercise, index) => (
            <Pressable
              key={exercise.id}
              onPress={() => onToggle(exercise.id)}
              style={({ pressed }) => [styles.exerciseRow, pressed && styles.pressed, exercise.completed && styles.exerciseRowDone]}
            >
              <View style={[styles.numBadge, exercise.completed && styles.numBadgeDone]}>
                {exercise.completed ? (
                  <MaterialIcons name="check" color={brand.text} size={14} />
                ) : (
                  <Text style={styles.numText}>{index + 1}</Text>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.exerciseName, exercise.completed && styles.textDone]}>
                  {exercise.name}
                </Text>
                <Text style={styles.prescriptionText}>{exercise.prescription}</Text>
              </View>

              <MaterialIcons
                name={exercise.completed ? "check-circle" : "radio-button-unchecked"}
                color={exercise.completed ? brand.success : brand.dim}
                size={22}
              />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, minHeight: 0, overflow: "scroll" },
  center: { alignItems: "center", flex: 1, gap: 12, justifyContent: "center", padding: 24 },
  message: { color: brand.muted, fontSize: 14, textAlign: "center" },
  menuBtn: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  content: { gap: 14, paddingBottom: 24, paddingTop: 10 },
  metricsRow: { flexDirection: "row", gap: 8 },
  metricCard: {
    alignItems: "center",
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    paddingVertical: 12,
  },
  metricValue: { color: brand.text, fontSize: 16, fontWeight: "900" },
  metricLabel: { color: brand.muted, fontSize: 9 },
  overallProgressCard: {
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  overallHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  overallTitle: { color: brand.blueGlow, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  overallRatio: { color: brand.muted, fontSize: 11, fontWeight: "700" },
  trackBar: { backgroundColor: brand.border, borderRadius: 6, height: 6, overflow: "hidden" },
  fillBar: { backgroundColor: brand.blueGlow, borderRadius: 6, height: "100%" },
  sessionCard: {
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    padding: 16,
  },
  sessionHead: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sessionTitle: { color: brand.text, fontSize: 15, fontWeight: "900" },
  sessionSub: { color: brand.muted, fontSize: 12, marginTop: 3 },
  sessionTrack: { backgroundColor: brand.border, borderRadius: 6, height: 3, marginTop: 12, overflow: "hidden" },
  sessionTrackFill: { backgroundColor: brand.blueGlow, borderRadius: 6, height: "100%" },
  exerciseList: { gap: 8, marginTop: 14 },
  exerciseRow: {
    alignItems: "center",
    backgroundColor: brand.background,
    borderColor: brand.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 12,
  },
  exerciseRowDone: {
    backgroundColor: "rgba(16, 185, 129, 0.05)",
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  numBadge: {
    alignItems: "center",
    borderColor: brand.blueGlow,
    borderRadius: 10,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  numBadgeDone: { backgroundColor: brand.success, borderColor: brand.success },
  numText: { color: brand.blueGlow, fontSize: 11, fontWeight: "900" },
  exerciseName: { color: brand.text, fontSize: 13, fontWeight: "800" },
  textDone: { color: brand.muted, textDecorationLine: "line-through" },
  prescriptionText: { color: brand.blueLight, fontSize: 11, fontWeight: "700", marginTop: 1 },
  startBtn: { marginBottom: 4 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});

