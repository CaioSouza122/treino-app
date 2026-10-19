import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Entrance } from "@/components/entrance";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { Label, SectionHead } from "@/components/ui";
import { brand, font, radius, type } from "@/constants/brand";
import { getLastWorkout, getWorkoutHistory, type Workout } from "@/lib/workouts-api";

export default function PlansScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      let history: Workout[] = [];
      try {
        history = await getWorkoutHistory();
      } catch {
        if (active) setOffline(true);
      }
      const local = await getLastWorkout();
      if (!active) return;
      setWorkouts(history.length ? history : local ? [local] : []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const current = workouts[0];
  const open = (id: string) => router.push({ pathname: "/workout-detail", params: { workoutId: id } });

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Entrance>
          <View style={styles.header}>
            <Label color={brand.cyan}>Biblioteca</Label>
            <Text style={styles.h1}>Treinos</Text>
          </View>
        </Entrance>

        {offline && (
          <View style={styles.notice}>
            <MaterialIcons name="cloud-off" size={16} color={brand.muted} />
            <Text style={styles.noticeText}>Sem conexão com o servidor. Mostrando o último treino salvo no aparelho.</Text>
          </View>
        )}

        {loading && <Text style={styles.feedback}>Carregando…</Text>}
        {!loading && !current && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum treino ainda</Text>
            <Text style={styles.feedback}>Gere seu primeiro plano com a IA e ele aparece aqui.</Text>
          </View>
        )}

        {current && (
          <Entrance delay={60}>
            <Pressable onPress={() => open(current.id)} style={({ pressed }) => [styles.current, pressed && styles.pressed]}>
              <View style={styles.currentTop}>
                <Label color={brand.lime}>Atual</Label>
                <Text style={styles.date}>{new Date(current.created_at).toLocaleDateString("pt-BR")}</Text>
              </View>
              <Text style={styles.currentTitle}>{current.days[0]?.foco || "Treino personalizado"}</Text>
              <Text style={styles.currentSub}>{current.days.length} dias por semana · gerado pela IA</Text>
            </Pressable>
          </Entrance>
        )}

        {workouts.length > 1 && (
          <View style={styles.block}>
            <SectionHead title="Histórico" right={<Text style={styles.count}>{workouts.length - 1}</Text>} />
            <View style={styles.list}>
              {workouts.slice(1).map((workout, index) => (
                <Pressable
                  key={workout.id}
                  onPress={() => open(workout.id)}
                  style={({ pressed }) => [styles.row, index > 0 && styles.rowDivider, pressed && styles.pressed]}
                >
                  <Text style={styles.rowIndex}>{String(index + 2).padStart(2, "0")}</Text>
                  <View style={styles.rowBody}>
                    <Text numberOfLines={1} style={styles.rowTitle}>{workout.days[0]?.foco || "Treino personalizado"}</Text>
                    <Text style={styles.rowSub}>
                      {new Date(workout.created_at).toLocaleDateString("pt-BR")} · {workout.days.length} sessões
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" color={brand.dim} size={20} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <PrimaryButton
          label="Novo treino com IA"
          variant="secondary"
          onPress={() => router.push("/(tabs)/chat" as never)}
          icon={<MaterialIcons name="auto-awesome" size={18} color={brand.cyan} />}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 24, paddingBottom: 32, paddingTop: 12 },
  header: { gap: 8 },
  h1: { ...type.h1, fontSize: 34, lineHeight: 39 },
  notice: { alignItems: "center", borderColor: brand.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: 10, padding: 12 },
  noticeText: { ...type.caption, flex: 1 },
  feedback: { ...type.caption, fontSize: 14, lineHeight: 20 },
  empty: { gap: 6, paddingVertical: 12 },
  emptyTitle: { ...type.h2 },
  current: { backgroundColor: brand.surface, borderColor: brand.borderStrong, borderRadius: radius.lg, borderWidth: 1, gap: 8, padding: 20 },
  currentTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  date: { ...type.caption },
  currentTitle: { ...type.h2, fontSize: 24, lineHeight: 29, marginTop: 6 },
  currentSub: { ...type.caption },
  block: { gap: 14 },
  count: { ...type.label, color: brand.text },
  list: { borderColor: brand.border, borderRadius: radius.md, borderWidth: 1, overflow: "hidden" },
  row: { alignItems: "center", backgroundColor: brand.surface, flexDirection: "row", gap: 14, minHeight: 62, paddingHorizontal: 16 },
  rowDivider: { borderTopColor: brand.border, borderTopWidth: 1 },
  rowIndex: { color: brand.dim, fontFamily: font.display, fontSize: 13, letterSpacing: 0.6, width: 24 },
  rowBody: { flex: 1 },
  rowTitle: { ...type.title, fontSize: 15 },
  rowSub: { ...type.caption, marginTop: 2 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
