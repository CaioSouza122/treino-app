import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Plate } from "@/components/plate";
import { buttonInk, PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { brand, fonts, plateFor } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { parseSession, type Session } from "@/lib/workout-format";
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
  const plate = plateFor(selected);
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
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
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
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScreenHeader title="Treino da semana" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {sessions.length > 1 && (
          <View style={styles.plates} accessibilityRole="tablist">
            {sessions.map((item, index) => {
              const active = index === selected;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    haptic.light();
                    setSelected(index);
                  }}
                  style={[styles.plateTab, active && { borderColor: plateFor(index).color }]}
                >
                  <Plate index={index} size={44} muted={!active} />
                </Pressable>
              );
            })}
          </View>
        )}

        <View>
          <Text style={styles.dayLabel}>{session.label}</Text>
          <Text style={styles.title}>{session.subtitle}</Text>
          <Text style={styles.summary}>
            {session.exercises.length} exercícios, cerca de {session.minutes} minutos
          </Text>
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.track}>
            <View style={[styles.trackFill, { backgroundColor: plate.color, width: `${progress.ratio * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {finished ? "Tudo feito. Bom treino!" : `${progress.done} de ${progress.total} feitos`}
          </Text>
        </View>

        <View>
          {session.exercises.map((exercise, index) => (
            <Pressable
              key={exercise.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: exercise.completed }}
              onPress={() => toggle(exercise.id)}
              style={({ pressed }) => [styles.exercise, pressed && styles.pressed]}
            >
              <View
                style={[
                  styles.check,
                  exercise.completed && { backgroundColor: plate.color, borderColor: plate.color },
                ]}
              >
                {exercise.completed ? (
                  <MaterialIcons name="check" color={plate.ink} size={18} />
                ) : (
                  <Text style={styles.checkIndex}>{index + 1}</Text>
                )}
              </View>
              <View style={styles.exerciseText}>
                <Text style={[styles.exerciseName, exercise.completed && styles.exerciseNameDone]}>
                  {exercise.name}
                </Text>
              </View>
              <Text style={[styles.prescription, exercise.completed && styles.exerciseNameDone]}>
                {exercise.prescription}
              </Text>
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
              color={finished ? buttonInk.primary : buttonInk.secondary}
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
  content: { gap: 28, paddingBottom: 24, paddingTop: 12 },
  center: { alignItems: "center", flex: 1, gap: 20, justifyContent: "center", padding: 24 },
  message: { color: brand.muted, fontFamily: fonts.body, fontSize: 16, textAlign: "center" },
  plates: { flexDirection: "row", gap: 10 },
  plateTab: { borderColor: "transparent", borderRadius: 28, borderWidth: 2, padding: 4 },
  dayLabel: { color: brand.muted, fontFamily: fonts.medium, fontSize: 15 },
  title: { color: brand.text, fontFamily: fonts.display, fontSize: 40, lineHeight: 42, marginTop: 2 },
  summary: { color: brand.muted, fontFamily: fonts.body, fontSize: 15, marginTop: 8 },
  progressBlock: { gap: 8 },
  track: { backgroundColor: brand.surfaceElevated, borderRadius: 4, height: 8, overflow: "hidden" },
  trackFill: { borderRadius: 4, height: "100%" },
  progressText: { color: brand.muted, fontFamily: fonts.body, fontSize: 14 },
  exercise: {
    alignItems: "center",
    borderBottomColor: brand.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 14,
    minHeight: 64,
    paddingVertical: 10,
  },
  pressed: { opacity: 0.7 },
  check: {
    alignItems: "center",
    borderColor: brand.borderStrong,
    borderRadius: 16,
    borderWidth: 1.5,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  checkIndex: { color: brand.muted, fontFamily: fonts.display, fontSize: 16 },
  exerciseText: { flex: 1 },
  exerciseName: { color: brand.text, fontFamily: fonts.medium, fontSize: 16 },
  exerciseNameDone: { color: brand.dim, textDecorationLine: "line-through" },
  prescription: { color: brand.text, fontFamily: fonts.display, fontSize: 20 },
  footer: { borderTopColor: brand.border, borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 8, paddingTop: 12 },
});
