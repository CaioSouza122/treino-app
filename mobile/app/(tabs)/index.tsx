import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { brand } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { getProfile, type UserProfile } from "@/lib/profile";
import { getLastWorkout, type LocalWorkout } from "@/lib/workouts-api";

export default function HomeScreen() {
  const router = useRouter();
  const [workout, setWorkout] = useState<LocalWorkout | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [lastWorkout, userProfile] = await Promise.all([getLastWorkout(), getProfile()]);
      setWorkout(lastWorkout);
      setProfile(userProfile);
    } catch {
      // Keep the screen usable when profile or workout data is unavailable.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const name = profile?.name?.trim() || "Atleta";
  const firstName = name.split(/\s+/)[0];
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const weekday = new Date().toLocaleDateString("pt-BR", { weekday: "short" });
  const todaySession = workout?.days.find((day) =>
    day.dia.toLocaleLowerCase().startsWith(weekday.slice(0, 3).toLocaleLowerCase()),
  ) ?? workout?.days[0];

  const openProfile = () => {
    haptic.light();
    router.push("/profile" as never);
  };

  if (loading) {
    return (
      <ScreenContainer className="px-5">
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Preparando seu painel…</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-5">
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.date}>{today}</Text>
            <Text style={styles.greeting}>Olá, {firstName}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
            onPress={openProfile}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            <Text style={styles.avatarText}>{name.slice(0, 1).toLocaleUpperCase()}</Text>
          </Pressable>
        </View>

        {workout && todaySession ? (
          <>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionEyebrow}>SEU PLANO</Text>
              <Text style={styles.sectionTitle}>Treino de hoje</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/workout-detail" as never)}
              style={({ pressed }) => [styles.featureCard, pressed && styles.pressed]}
            >
              <View style={styles.featureTop}>
                <View style={styles.featureIcon}>
                  <MaterialIcons name="fitness-center" size={21} color={brand.blueGlow} />
                </View>
                <Text style={styles.todayPill}>HOJE</Text>
              </View>
              <Text style={styles.focus}>{todaySession.foco || "Sessão de treino"}</Text>
              <Text style={styles.sessionName}>{todaySession.dia}</Text>
              <View style={styles.cardDivider} />
              <View style={styles.featureBottom}>
                <Text style={styles.exerciseCount}>
                  {todaySession.exercicios.split("\n").filter(Boolean).length} exercícios
                </Text>
                <View style={styles.viewWorkout}>
                  <Text style={styles.viewWorkoutText}>Ver treino</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={brand.blueGlow} />
                </View>
              </View>
            </Pressable>

            <View style={styles.routineHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>ORGANIZAÇÃO</Text>
                <Text style={styles.routineTitle}>Sua rotina</Text>
              </View>
              <Text style={styles.daysCount}>{workout.days.length} dias</Text>
            </View>

            <View style={styles.routineCard}>
              {workout.days.map((day, index) => (
                <Pressable
                  key={`${day.dia}-${index}`}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({ pathname: "/workout-detail", params: { workoutId: workout.id } } as never)
                  }
                  style={({ pressed }) => [
                    styles.routineRow,
                    index < workout.days.length - 1 && styles.routineRowBorder,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.routineDay}>{day.dia}</Text>
                  <Text style={styles.routineFocus} numberOfLines={1}>{day.foco}</Text>
                  <MaterialIcons name="chevron-right" size={20} color={brand.dim} />
                </Pressable>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(tabs)/chat" as never)}
              style={({ pressed }) => [styles.editPlan, pressed && styles.pressed]}
            >
              <MaterialIcons name="auto-awesome" size={17} color={brand.blueGlow} />
              <Text style={styles.editPlanText}>Ajustar plano com o Coach IA</Text>
              <MaterialIcons name="chevron-right" size={19} color={brand.dim} />
            </Pressable>
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="fitness-center" size={24} color={brand.blueGlow} />
            </View>
            <Text style={styles.emptyTitle}>Seu treino começa aqui</Text>
            <Text style={styles.emptyDescription}>
              Monte um plano de treino personalizado e tenha sua rotina organizada em um só lugar.
            </Text>
            <PrimaryButton
              label="Montar meu plano"
              onPress={() => router.push("/(tabs)/chat" as never)}
              variant="primary"
              icon={<MaterialIcons name="arrow-forward" size={18} color={brand.text} />}
              style={styles.createButton}
            />
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, minHeight: 0, overflow: "scroll" },
  content: { gap: 24, paddingBottom: 36, paddingTop: 14 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  loadingText: { color: brand.muted, fontSize: 14 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  headerText: { flex: 1 },
  date: { color: brand.muted, fontSize: 13, fontWeight: "500", textTransform: "capitalize" },
  greeting: { color: brand.text, fontSize: 27, fontWeight: "800", letterSpacing: -0.7, marginTop: 5 },
  avatar: {
    alignItems: "center",
    backgroundColor: brand.surfaceElevated,
    borderColor: brand.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  avatarText: { color: brand.text, fontSize: 16, fontWeight: "700" },
  sectionHeading: { gap: 5, marginTop: 5 },
  sectionEyebrow: { color: brand.dim, fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  sectionTitle: { color: brand.text, fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  featureCard: {
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  featureTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  featureIcon: {
    alignItems: "center",
    backgroundColor: brand.blueSoft,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  todayPill: { color: brand.blueGlow, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  focus: { color: brand.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginTop: 18 },
  sessionName: { color: brand.muted, fontSize: 13, marginTop: 4 },
  cardDivider: { backgroundColor: brand.border, height: 1, marginVertical: 17 },
  featureBottom: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  exerciseCount: { color: brand.muted, fontSize: 12 },
  viewWorkout: { alignItems: "center", flexDirection: "row", gap: 6 },
  viewWorkoutText: { color: brand.blueGlow, fontSize: 13, fontWeight: "700" },
  routineHeader: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between", marginBottom: -14 },
  routineTitle: { color: brand.text, fontSize: 18, fontWeight: "700", marginTop: 4 },
  daysCount: { color: brand.muted, fontSize: 12, paddingBottom: 3 },
  routineCard: {
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  routineRow: { alignItems: "center", flexDirection: "row", gap: 14, minHeight: 54, paddingHorizontal: 15 },
  routineRowBorder: { borderBottomColor: brand.border, borderBottomWidth: StyleSheet.hairlineWidth },
  routineDay: { color: brand.muted, fontSize: 12, fontWeight: "700", minWidth: 52 },
  routineFocus: { color: brand.text, flex: 1, fontSize: 13, fontWeight: "600" },
  editPlan: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: -7,
    minHeight: 42,
    paddingHorizontal: 2,
  },
  editPlanText: { color: brand.muted, flex: 1, fontSize: 13, fontWeight: "600" },
  emptyState: { alignItems: "flex-start", marginTop: 55 },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: brand.blueSoft,
    borderRadius: 15,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  emptyTitle: { color: brand.text, fontSize: 25, fontWeight: "800", letterSpacing: -0.6, marginTop: 24 },
  emptyDescription: { color: brand.muted, fontSize: 15, lineHeight: 23, marginTop: 10, maxWidth: 320 },
  createButton: { alignSelf: "stretch", marginTop: 24 },
  pressed: { opacity: 0.78 },
});
