import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { BrandMark } from "@/components/brand-mark";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { brand } from "@/constants/brand";
import { getWorkoutHistory, getLastWorkout, type Workout } from "@/lib/workouts-api";

const userId = process.env.EXPO_PUBLIC_TREINO_USER_ID || "mobile-demo-user";

export default function PlansScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const history = await getWorkoutHistory(userId).catch(() => []);
      const local = await getLastWorkout();
      if (active) setWorkouts(history.length ? history : local ? [local] : []);
      if (active) setLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  const current = workouts[0];
  return <ScreenContainer className="px-5"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>BIBLIOTECA</Text><Text style={styles.title}>Meus treinos</Text></View><BrandMark size={40} /></View>
    {loading && <Text style={styles.feedback}>Carregando histórico...</Text>}
    {!loading && !current && <Text style={styles.feedback}>Você ainda não tem treinos. Gere seu primeiro plano com a IA.</Text>}
    {current && <Pressable onPress={() => router.push({ pathname: "/workout-detail", params: { workoutId: current.id } })} style={({ pressed }) => [styles.current, pressed && styles.pressed]}><View style={styles.currentTop}><View style={styles.blueSquare}><MaterialIcons name="fitness-center" size={25} color={brand.text} /></View><View style={{ flex: 1 }}><Text style={styles.currentTitle}>{current.days[0]?.foco || "Treino personalizado"}</Text><Text style={styles.currentSub}>{current.days.length} dias por semana · Gerado pela IA</Text></View><Text style={styles.active}>RECENTE</Text></View><Text style={styles.currentProgress}>{new Date(current.created_at).toLocaleDateString("pt-BR")} · {current.days.length} sessões</Text></Pressable>}
    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Histórico</Text><Text style={styles.count}>{workouts.length} {workouts.length === 1 ? "treino" : "treinos"}</Text></View>
    {workouts.slice(1).map((workout) => <Pressable key={workout.id} onPress={() => router.push({ pathname: "/workout-detail", params: { workoutId: workout.id } })} style={({ pressed }) => [styles.mini, pressed && styles.pressed]}><View style={styles.miniIcon}><MaterialIcons name="history" size={22} color={brand.blueLight} /></View><View style={{ flex: 1 }}><Text style={styles.miniTitle}>{workout.days[0]?.foco || "Treino personalizado"}</Text><Text style={styles.miniSub}>{new Date(workout.created_at).toLocaleDateString("pt-BR")} · {workout.days.length} sessões</Text></View><MaterialIcons name="chevron-right" color={brand.muted} size={22} /></Pressable>)}
    <PrimaryButton label="Montar novo treino com IA" onPress={() => router.push("/(tabs)/chat" as never)} icon={<MaterialIcons name="auto-awesome" size={18} color={brand.text} />} style={{ marginTop: 8 }} />
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: 16, paddingBottom: 28, paddingTop: 14 }, header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }, eyebrow: { color: brand.blueLight, fontSize: 11, fontWeight: "900", letterSpacing: 0.7 }, title: { color: brand.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.7, marginTop: 3 }, feedback: { color: brand.muted, fontSize: 14, lineHeight: 20, paddingVertical: 24 }, current: { backgroundColor: brand.surface, borderColor: brand.blue, borderRadius: 22, borderWidth: 1, padding: 17 }, currentTop: { alignItems: "center", flexDirection: "row", gap: 12 }, blueSquare: { alignItems: "center", backgroundColor: brand.blue, borderRadius: 15, height: 47, justifyContent: "center", width: 47 }, currentTitle: { color: brand.text, flex: 1, fontSize: 18, fontWeight: "900" }, currentSub: { color: brand.muted, fontSize: 12, marginTop: 4 }, active: { color: brand.blueLight, fontSize: 10, fontWeight: "900", letterSpacing: 0.4 }, currentProgress: { color: brand.muted, fontSize: 12, marginTop: 16 }, sectionHead: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 8 }, sectionTitle: { color: brand.text, fontSize: 18, fontWeight: "900" }, count: { color: brand.muted, fontSize: 12 }, mini: { alignItems: "center", backgroundColor: brand.surface, borderColor: brand.border, borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 12, padding: 14 }, miniIcon: { alignItems: "center", backgroundColor: brand.blueSoft, borderRadius: 13, height: 42, justifyContent: "center", width: 42 }, miniTitle: { color: brand.text, flex: 1, fontSize: 15, fontWeight: "800" }, miniSub: { color: brand.muted, fontSize: 12, marginTop: 3 }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] } });
