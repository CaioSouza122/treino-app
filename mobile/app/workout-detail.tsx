import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { brand } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { parseSession, sessionLetter, type Session } from "@/lib/workout-format";
import { getLastWorkout, getWorkoutHistory, type Workout } from "@/lib/workouts-api";

const userId = process.env.EXPO_PUBLIC_TREINO_USER_ID || "mobile-demo-user";

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ workoutId?: string; day?: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState(Number(params.day) || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const local = await getLastWorkout();
        const history = await getWorkoutHistory(userId).catch(() => []);
        const found =
          history.find((item: Workout) => item.id === params.workoutId) ??
          (local?.id === params.workoutId ? local : null) ??
          history[0] ??
          local;
        if (!active) return;
        if (!found) setError("Nenhum treino encontrado. Crie seu primeiro plano com o Coach.");
        else {
          setWorkout(found);
          setSessions(found.days.map(parseSession));
          setSelected((current) => Math.min(current, found.days.length - 1));
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar o treino.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [params.workoutId]);

  const session = sessions[selected];
  const progress = useMemo(() => {
    const exercises = session?.exercises ?? [];
    const done = exercises.filter((exercise) => exercise.completed).length;
    return { done, total: exercises.length, ratio: exercises.length ? done / exercises.length : 0 };
  }, [session]);
  const finished = progress.total > 0 && progress.done === progress.total;

  function toggle(id: string) {
    haptic.light();
    setSessions((current) =>
      current.map((item, index) =>
        index !== selected
          ? item
          : {
              ...item,
              exercises: item.exercises.map((exercise) =>
                exercise.id === id ? { ...exercise, completed: !exercise.completed } : exercise,
              ),
            },
      ),
    );
  }

  if (loading || error || !workout || !session) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
        <ScreenHeader title="Treino" />
        <View style={styles.center}>
          {loading ? (
            <Text style={styles.message}>Carregando treino…</Text>
          ) : (
            <>
              <Text style={styles.message}>{error ?? "Treino não encontrado."}</Text>
              <PrimaryButton label="Falar com o Coach" onPress={() => router.replace("/(tabs)/chat" as never)} />
            </>
          )}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
      <ScreenHeader title="Treino" subtitle={`Criado em ${new Date(workout.created_at).toLocaleDateString("pt-BR")}`} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {sessions.length > 1 && (
          <View style={styles.segmented}>
            {sessions.map((item, index) => (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: index === selected }}
                onPress={() => {
                  haptic.light();
                  setSelected(index);
                }}
                style={[styles.segment, index === selected && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, index === selected && styles.segmentTextActive]}>
                  {sessionLetter(index)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View>
          <Text style={styles.dayLabel}>{session.label}</Text>
          <Text style={styles.title}>{session.subtitle}</Text>
          <Text style={styles.summary}>
            {session.exercises.length} exercícios · {session.minutes} min
          </Text>
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progresso</Text>
            <Text style={styles.progressValue}>
              {progress.done}/{progress.total}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.trackFill, { width: `${progress.ratio * 100}%` }]} />
          </View>
        </View>

        <View style={styles.list}>
          {session.exercises.map((exercise, index) => (
            <Pressable
              key={exercise.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: exercise.completed }}
              onPress={() => toggle(exercise.id)}
              style={({ pressed }) => [
                styles.exercise,
                index < session.exercises.length - 1 && styles.exerciseBorder,
                pressed && styles.exercisePressed,
              ]}
            >
              <View style={[styles.check, exercise.completed && styles.checkDone]}>
                {exercise.completed ? (
                  <MaterialIcons name="check" color="#FFFFFF" size={16} />
                ) : (
                  <Text style={styles.checkIndex}>{index + 1}</Text>
                )}
              </View>
              <View style={styles.exerciseText}>
                <Text style={[styles.exerciseName, exercise.completed && styles.exerciseNameDone]}>
                  {exercise.name}
                </Text>
                <Text style={styles.prescription}>{exercise.prescription}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={finished ? "Concluir treino" : progress.done > 0 ? "Continuar treino" : "Começar treino"}
          onPress={() => (finished ? (haptic.success(), router.back()) : haptic.light())}
          variant={finished ? "primary" : "secondary"}
          icon={
            <MaterialIcons
              name={finished ? "check" : "play-arrow"}
              color={finished ? "#FFFFFF" : brand.text}
              size={20}
            />
          }
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, minHeight: 0, overflow: "scroll" },
  content: { gap: 24, paddingBottom: 24, paddingTop: 12 },
  center: { alignItems: "center", flex: 1, gap: 20, justifyContent: "center", padding: 24 },
  message: { color: brand.muted, fontSize: 15, textAlign: "center" },
  segmented: { backgroundColor: brand.surface, borderRadius: 12, flexDirection: "row", gap: 4, padding: 4 },
  segment: { alignItems: "center", borderRadius: 9, flex: 1, height: 36, justifyContent: "center" },
  segmentActive: { backgroundColor: brand.surfaceElevated },
  segmentText: { color: brand.dim, fontSize: 14, fontWeight: "600" },
  segmentTextActive: { color: brand.text },
  dayLabel: { color: brand.accentText, fontSize: 13, fontWeight: "600" },
  title: { color: brand.text, fontSize: 26, fontWeight: "700", letterSpacing: -0.5, marginTop: 4 },
  summary: { color: brand.muted, fontSize: 14, marginTop: 6 },
  progressBlock: { gap: 8 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { color: brand.muted, fontSize: 13 },
  progressValue: { color: brand.text, fontSize: 13, fontWeight: "600" },
  track: { backgroundColor: brand.surfaceElevated, borderRadius: 3, height: 6, overflow: "hidden" },
  trackFill: { backgroundColor: brand.success, borderRadius: 3, height: "100%" },
  list: { backgroundColor: brand.surface, borderRadius: 16, overflow: "hidden" },
  exercise: { alignItems: "center", flexDirection: "row", gap: 14, minHeight: 68, paddingHorizontal: 16, paddingVertical: 12 },
  exerciseBorder: { borderBottomColor: brand.border, borderBottomWidth: StyleSheet.hairlineWidth },
  exercisePressed: { backgroundColor: brand.surfaceElevated },
  check: {
    alignItems: "center",
    borderColor: brand.borderStrong,
    borderRadius: 14,
    borderWidth: 1.5,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  checkDone: { backgroundColor: brand.success, borderColor: brand.success },
  checkIndex: { color: brand.muted, fontSize: 12, fontWeight: "600" },
  exerciseText: { flex: 1 },
  exerciseName: { color: brand.text, fontSize: 15, fontWeight: "500" },
  exerciseNameDone: { color: brand.dim, textDecorationLine: "line-through" },
  prescription: { color: brand.muted, fontSize: 13, marginTop: 3 },
  footer: { borderTopColor: brand.border, borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 8, paddingTop: 12 },
});
