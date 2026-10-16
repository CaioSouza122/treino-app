import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { brand } from "@/constants/brand";
import { getLastWorkout, getWorkoutHistory, type Workout } from "@/lib/workouts-api";

const userId = process.env.EXPO_PUBLIC_TREINO_USER_ID || "mobile-demo-user";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });

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
    <ScreenContainer className="px-5">
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Treinos</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Novo plano"
            onPress={newPlan}
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          >
            <MaterialIcons name="add" size={22} color={brand.text} />
          </Pressable>
        </View>

        {loading ? (
          <Text style={styles.muted}>Carregando…</Text>
        ) : !current ? (
          <View style={styles.empty}>
            <MaterialIcons name="event-note" size={32} color={brand.dim} />
            <Text style={styles.emptyTitle}>Nenhum plano ainda</Text>
            <Text style={styles.emptyText}>Seus planos de treino aparecem aqui depois de criados.</Text>
            <PrimaryButton label="Criar plano" onPress={newPlan} style={styles.emptyButton} />
          </View>
        ) : (
          <>
            <View>
              <Text style={styles.sectionLabel}>Plano atual</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => open(current)}
                style={({ pressed }) => [styles.currentCard, pressed && styles.cardPressed]}
              >
                <View style={styles.currentTop}>
                  <View style={styles.badge}>
                    <View style={styles.badgeDot} />
                    <Text style={styles.badgeText}>Ativo</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={brand.dim} />
                </View>
                <Text style={styles.currentTitle}>Hipertrofia · {current.days.length} dias</Text>
                <Text style={styles.currentSub}>Criado em {formatDate(current.created_at)}</Text>
                <View style={styles.dayChips}>
                  {current.days.map((day, index) => (
                    <Text key={`${day.dia}-${index}`} style={styles.dayChip} numberOfLines={1}>
                      {day.foco || day.dia}
                    </Text>
                  ))}
                </View>
              </Pressable>
            </View>

            {previous.length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>Anteriores</Text>
                <View style={styles.list}>
                  {previous.map((workout, index) => (
                    <Pressable
                      key={workout.id}
                      accessibilityRole="button"
                      onPress={() => open(workout)}
                      style={({ pressed }) => [
                        styles.row,
                        index < previous.length - 1 && styles.rowBorder,
                        pressed && styles.cardPressed,
                      ]}
                    >
                      <View style={styles.rowText}>
                        <Text style={styles.rowTitle}>Hipertrofia · {workout.days.length} dias</Text>
                        <Text style={styles.rowSub}>{formatDate(workout.created_at)}</Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={brand.dim} />
                    </Pressable>
                  ))}
                </View>
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
  content: { gap: 28, paddingBottom: 32, paddingTop: 16 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  title: { color: brand.text, fontSize: 28, fontWeight: "700", letterSpacing: -0.6 },
  addBtn: {
    alignItems: "center",
    backgroundColor: brand.surfaceElevated,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  muted: { color: brand.muted, fontSize: 14 },
  sectionLabel: { color: brand.muted, fontSize: 13, fontWeight: "500", marginBottom: 10 },
  currentCard: { backgroundColor: brand.surface, borderRadius: 20, padding: 20 },
  cardPressed: { backgroundColor: brand.surfaceElevated },
  currentTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  badge: {
    alignItems: "center",
    backgroundColor: brand.successSoft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDot: { backgroundColor: brand.success, borderRadius: 3, height: 6, width: 6 },
  badgeText: { color: brand.success, fontSize: 12, fontWeight: "600" },
  currentTitle: { color: brand.text, fontSize: 20, fontWeight: "700", marginTop: 14 },
  currentSub: { color: brand.muted, fontSize: 13, marginTop: 4 },
  dayChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  dayChip: {
    backgroundColor: brand.surfaceElevated,
    borderRadius: 8,
    color: brand.muted,
    fontSize: 12,
    maxWidth: "100%",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  list: { backgroundColor: brand.surface, borderRadius: 16, overflow: "hidden" },
  row: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 64, paddingHorizontal: 16 },
  rowBorder: { borderBottomColor: brand.border, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1 },
  rowTitle: { color: brand.text, fontSize: 15, fontWeight: "500" },
  rowSub: { color: brand.muted, fontSize: 13, marginTop: 2 },
  empty: { alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 64 },
  emptyTitle: { color: brand.text, fontSize: 18, fontWeight: "600", marginTop: 8 },
  emptyText: { color: brand.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  emptyButton: { alignSelf: "stretch", marginTop: 20 },
  pressed: { opacity: 0.7 },
});
