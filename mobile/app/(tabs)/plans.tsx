import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Plate } from "@/components/plate";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { brand, fonts } from "@/constants/brand";
import { getLastWorkout, getWorkoutHistory, type Workout } from "@/lib/workouts-api";

const userId = process.env.EXPO_PUBLIC_TREINO_USER_ID || "mobile-demo-user";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

export default function PlansScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const history = await getWorkoutHistory(userId).catch(() => []);
        const local = await getLastWorkout().catch(() => null);
        if (!active) return;
        setWorkouts(history.length ? history : local ? [local] : []);
        setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const [current, ...previous] = workouts;
  const open = (workout: Workout) =>
    router.push({ pathname: "/workout-detail", params: { workoutId: workout.id } });
  const newPlan = () => router.push("/(tabs)/chat" as never);

  return (
    <ScreenContainer>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Treinos</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Montar novo plano"
            onPress={newPlan}
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          >
            <MaterialIcons name="add" size={24} color={brand.text} />
          </Pressable>
        </View>

        {loading ? (
          <Text style={styles.muted}>Carregando…</Text>
        ) : !current ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum plano ainda</Text>
            <Text style={styles.emptyText}>Os planos que o Coach montar para você ficam guardados aqui.</Text>
            <PrimaryButton label="Montar meu plano" onPress={newPlan} style={styles.emptyButton} />
          </View>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => open(current)}
              style={({ pressed }) => [styles.current, pressed && styles.pressed]}
            >
              <Text style={styles.currentLabel}>Em uso desde {formatDate(current.created_at)}</Text>
              <Text style={styles.currentTitle}>Hipertrofia em {current.days.length} dias</Text>

              <View style={styles.barbell}>
                <View style={styles.bar} />
                {current.days.map((day, index) => (
                  <Plate key={`${day.dia}-${index}`} index={index} size={52} style={styles.loadedPlate} />
                ))}
              </View>

              {current.days.map((day, index) => (
                <View key={`${day.dia}-row-${index}`} style={styles.dayRow}>
                  <Text style={styles.dayLetter}>{String.fromCharCode(65 + index)}</Text>
                  <Text style={styles.dayFocus} numberOfLines={1}>{day.foco || "Sessão de treino"}</Text>
                  <Text style={styles.dayName}>{day.dia}</Text>
                </View>
              ))}

              <View style={styles.openRow}>
                <Text style={styles.openText}>Abrir plano</Text>
                <MaterialIcons name="chevron-right" size={20} color={brand.text} />
              </View>
            </Pressable>

            {previous.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Planos anteriores</Text>
                {previous.map((workout) => (
                  <Pressable
                    key={workout.id}
                    accessibilityRole="button"
                    onPress={() => open(workout)}
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  >
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>Hipertrofia em {workout.days.length} dias</Text>
                      <Text style={styles.rowSub}>{formatDate(workout.created_at)}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color={brand.dim} />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, minHeight: 0, overflow: "scroll" },
  content: { gap: 32, paddingBottom: 32, paddingTop: 16 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  title: { color: brand.text, fontFamily: fonts.display, fontSize: 40, lineHeight: 44 },
  addBtn: {
    alignItems: "center",
    borderColor: brand.borderStrong,
    borderRadius: 21,
    borderWidth: 1.5,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  muted: { color: brand.muted, fontFamily: fonts.body, fontSize: 15 },
  current: { backgroundColor: brand.surface, borderRadius: 20, padding: 20 },
  currentLabel: { color: brand.muted, fontFamily: fonts.body, fontSize: 14 },
  currentTitle: { color: brand.text, fontFamily: fonts.display, fontSize: 30, lineHeight: 34, marginTop: 4 },
  barbell: { alignItems: "center", flexDirection: "row", height: 64, marginVertical: 18, paddingLeft: 12 },
  bar: {
    backgroundColor: "#9A9DA3",
    borderRadius: 3,
    height: 6,
    left: 0,
    position: "absolute",
    right: 0,
  },
  loadedPlate: { marginRight: -8 },
  dayRow: {
    alignItems: "center",
    borderTopColor: brand.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    minHeight: 44,
  },
  dayLetter: { color: brand.muted, fontFamily: fonts.display, fontSize: 18, width: 16 },
  dayFocus: { color: brand.text, flex: 1, fontFamily: fonts.medium, fontSize: 15 },
  dayName: { color: brand.muted, fontFamily: fonts.body, fontSize: 14 },
  openRow: { alignItems: "center", flexDirection: "row", gap: 2, justifyContent: "flex-end", marginTop: 12 },
  openText: { color: brand.text, fontFamily: fonts.semibold, fontSize: 15 },
  sectionTitle: { color: brand.text, fontFamily: fonts.display, fontSize: 24, marginBottom: 4 },
  row: {
    alignItems: "center",
    borderBottomColor: brand.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 64,
  },
  rowText: { flex: 1 },
  rowTitle: { color: brand.text, fontFamily: fonts.semibold, fontSize: 16 },
  rowSub: { color: brand.muted, fontFamily: fonts.body, fontSize: 14, marginTop: 2 },
  empty: { paddingTop: 24 },
  emptyTitle: { color: brand.text, fontFamily: fonts.display, fontSize: 28 },
  emptyText: { color: brand.muted, fontFamily: fonts.body, fontSize: 16, lineHeight: 24, marginTop: 8 },
  emptyButton: { marginTop: 24 },
  pressed: { opacity: 0.7 },
});
