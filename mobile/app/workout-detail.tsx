import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { brand } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { getLastWorkout, getWorkoutHistory, type LocalWorkout, type Workout, type WorkoutDay } from "@/lib/workouts-api";

type Exercise = { id: string; name: string; prescription: string; completed: boolean };
type Session = { id: string; label: string; subtitle: string; duration: string; exercises: Exercise[] };

const userId = process.env.EXPO_PUBLIC_TREINO_USER_ID || "mobile-demo-user";

function parseExercises(day: WorkoutDay, dayIndex: number): Session {
  const lines = day.exercicios.split("\n").map((line) => line.trim()).filter(Boolean);
  const exercises = lines.filter((line) => !/^tempo estimado:/i.test(line)).map((line, index) => {
    const clean = line.replace(/^[-*•\d.)]+\s*/, "");
    const match = clean.match(/^(.*?)\s*[-–—:]\s*(\d[^\n]*)$/);
    return {
      id: `${day.dia}-${index}`,
      name: match?.[1]?.trim() || clean,
      prescription: match?.[2]?.trim() || "Conforme orientação",
      completed: false,
    };
  });

  return {
    id: `${day.dia}-${dayIndex}`,
    label: day.dia || `Treino ${String.fromCharCode(65 + dayIndex)}`,
    subtitle: day.foco || "Treino personalizado",
    duration: day.exercicios.match(/Tempo estimado:\s*(\d+)/i)?.[1] ? `${day.exercicios.match(/Tempo estimado:\s*(\d+)/i)?.[1]} min` : "—",
    exercises: exercises.length ? exercises : [{ id: `${day.dia}-empty`, name: "Consulte a descrição do treino", prescription: "—", completed: false }],
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
        const selected = history.find((item) => item.id === params.workoutId) ?? history[0] ?? local;
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
    setSessions((current) => current.map((session) => ({ ...session, exercises: session.exercises.map((exercise) => exercise.id === id ? { ...exercise, completed: !exercise.completed } : exercise) })));
  }

  if (loading) return <ScreenContainer className="px-5"><View style={styles.center}><Text style={styles.message}>Carregando seu treino...</Text></View></ScreenContainer>;
  if (error || !workout) return <ScreenContainer className="px-5"><View style={styles.center}><Text style={styles.message}>{error ?? "Treino não encontrado."}</Text></View></ScreenContainer>;

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5"><View style={styles.fill}>
    <ScreenHeader title={sessions[0]?.subtitle || "Treino personalizado"} subtitle={`Gerado pela IA · ${new Date(workout.created_at).toLocaleDateString("pt-BR")}`} right={<Pressable style={styles.menu}><MaterialIcons name="more-horiz" color={brand.text} size={26} /></Pressable>} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.metrics}><Metric icon="calendar-month" value={String(sessions.length)} label="dias" /><Metric icon="timer" value={sessions[0]?.duration.replace(" min", "") || "—"} label="min/sessão" /><Metric icon="fitness-center" value={String(sessions.reduce((sum, session) => sum + session.exercises.length, 0))} label="exercícios" /><Metric icon="bar-chart" value="IA" label="nível" /></View>
      {sessions.map((session, index) => <SessionCard key={session.id} session={session} expanded={index === 0} onToggle={toggle} />)}
    </ScrollView>
    <PrimaryButton label={progress.done === progress.total ? "Treino concluído" : "Começar treino"} onPress={() => {}} icon={<MaterialIcons name={progress.done === progress.total ? "check-circle" : "play-arrow"} color={brand.text} size={21} />} style={styles.start} />
  </View></ScreenContainer>;
}

function Metric({ icon, value, label }: { icon: keyof typeof MaterialIcons.glyphMap; value: string; label: string }) { return <View style={styles.metric}><MaterialIcons name={icon} color={brand.blueLight} size={20} /><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function SessionCard({ session, expanded, onToggle }: { session: Session; expanded: boolean; onToggle: (id: string) => void }) { const done = session.exercises.filter((exercise) => exercise.completed).length; const ratio = session.exercises.length ? done / session.exercises.length : 0; return <View style={styles.session}><View style={styles.sessionHead}><View><Text style={styles.sessionTitle}>{session.label} — {session.subtitle}</Text><Text style={styles.sessionSub}>{done}/{session.exercises.length} exercícios · {session.duration}</Text></View><MaterialIcons name={expanded ? "expand-less" : "expand-more"} color={brand.muted} size={25} /></View><View style={styles.track}><View style={[styles.fillTrack, { width: `${ratio * 100}%` }]} /></View>{expanded && <View style={styles.exerciseList}>{session.exercises.map((exercise, index) => <Pressable key={exercise.id} onPress={() => onToggle(exercise.id)} style={({ pressed }) => [styles.exercise, pressed && styles.pressed]}><View style={[styles.number, exercise.completed && styles.numberComplete]}>{exercise.completed ? <MaterialIcons name="check" color={brand.text} size={15} /> : <Text style={styles.numberText}>{index + 1}</Text>}</View><Text style={[styles.exerciseName, exercise.completed && styles.completeText]}>{exercise.name}</Text><Text style={styles.prescription}>{exercise.prescription}</Text><MaterialIcons name={exercise.completed ? "check-circle" : "radio-button-unchecked"} color={exercise.completed ? brand.success : brand.muted} size={21} /></Pressable>)}</View>}</View>; }

const styles = StyleSheet.create({ fill: { flex: 1 }, center: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 }, message: { color: brand.muted, fontSize: 15, textAlign: "center" }, menu: { alignItems: "center", height: 42, justifyContent: "center", width: 42 }, content: { gap: 16, paddingBottom: 26, paddingTop: 12 }, metrics: { flexDirection: "row", gap: 7 }, metric: { alignItems: "center", backgroundColor: brand.surface, borderColor: brand.border, borderRadius: 14, borderWidth: 1, flex: 1, gap: 3, paddingVertical: 10 }, metricValue: { color: brand.text, fontSize: 16, fontWeight: "900" }, metricLabel: { color: brand.muted, fontSize: 10 }, session: { backgroundColor: brand.surface, borderColor: brand.border, borderRadius: 20, borderWidth: 1, overflow: "hidden", padding: 15 }, sessionHead: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, sessionTitle: { color: brand.text, flex: 1, fontSize: 16, fontWeight: "900" }, sessionSub: { color: brand.muted, fontSize: 12, marginTop: 4 }, track: { backgroundColor: brand.border, borderRadius: 7, height: 5, marginTop: 13, overflow: "hidden" }, fillTrack: { backgroundColor: brand.blue, borderRadius: 7, height: "100%" }, exerciseList: { gap: 8, marginTop: 14 }, exercise: { alignItems: "center", backgroundColor: "#0C0F15", borderColor: brand.border, borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, minHeight: 55, paddingHorizontal: 10 }, number: { alignItems: "center", borderColor: brand.blue, borderRadius: 12, borderWidth: 1, height: 24, justifyContent: "center", width: 24 }, numberComplete: { backgroundColor: brand.success, borderColor: brand.success }, numberText: { color: brand.blueLight, fontSize: 12, fontWeight: "900" }, exerciseName: { color: brand.text, flex: 1, fontSize: 13, fontWeight: "700" }, completeText: { color: brand.muted, textDecorationLine: "line-through" }, prescription: { color: brand.blueLight, fontSize: 12, fontWeight: "800" }, start: { marginBottom: 4 }, pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] } });
