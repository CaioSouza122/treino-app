import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { brand } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { getProfile, type UserProfile } from "@/lib/profile";
import { parseSession, sessionLetter } from "@/lib/workout-format";
import { getLastWorkout, type LocalWorkout } from "@/lib/workouts-api";

export default function HomeScreen() {
  const router = useRouter();
  const [workout, setWorkout] = useState<LocalWorkout | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getLastWorkout(), getProfile()])
        .then(([lastWorkout, userProfile]) => {
          if (!active) return;
          setWorkout(lastWorkout);
          setProfile(userProfile);
        })
        // Keep the screen usable when profile or workout data is unavailable.
        .catch(() => {})
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, []),
  );

  const name = profile?.name?.trim() || "Atleta";
  const firstName = name.split(/\s+/)[0];
  const date = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const today = date.charAt(0).toLocaleUpperCase() + date.slice(1);
  const weekday = new Date().toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3).toLocaleLowerCase();
  const todayIndex = Math.max(0, workout?.days.findIndex((day) => day.dia.toLocaleLowerCase().startsWith(weekday)) ?? 0);
  const todaySession = workout?.days[todayIndex] ? parseSession(workout.days[todayIndex], todayIndex) : null;

  const openWorkout = (day: number) => {
    if (!workout) return;
    router.push({ pathname: "/workout-detail", params: { workoutId: workout.id, day: String(day) } } as never);
  };

  if (loading) {
    return (
      <ScreenContainer className="px-5">
        <View style={styles.loading}>
          <Text style={styles.muted}>Carregando…</Text>
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
            onPress={() => {
              haptic.light();
              router.push("/profile" as never);
            }}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            <Text style={styles.avatarText}>{name.slice(0, 1).toLocaleUpperCase()}</Text>
          </Pressable>
        </View>

        {workout && todaySession ? (
          <>
            <View style={styles.todayCard}>
              <Text style={styles.todayLabel}>Treino de hoje</Text>
              <Text style={styles.todayTitle}>{todaySession.subtitle}</Text>
              <View style={styles.metaRow}>
                <Meta icon="format-list-bulleted" text={`${todaySession.exercises.length} exercícios`} />
                <Meta icon="schedule" text={`${todaySession.minutes} min`} />
              </View>
              <PrimaryButton
                label="Começar treino"
                onPress={() => openWorkout(todayIndex)}
                icon={<MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />}
                style={styles.todayButton}
              />
            </View>

            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Sua semana</Text>
                <Text style={styles.muted}>{workout.days.length} treinos</Text>
              </View>
              <View style={styles.list}>
                {workout.days.map((day, index) => (
                  <Pressable
                    key={`${day.dia}-${index}`}
                    accessibilityRole="button"
                    onPress={() => openWorkout(index)}
                    style={({ pressed }) => [
                      styles.row,
                      index < workout.days.length - 1 && styles.rowBorder,
                      pressed && styles.rowPressed,
                    ]}
                  >
                    <View style={[styles.letter, index === todayIndex && styles.letterActive]}>
                      <Text style={[styles.letterText, index === todayIndex && styles.letterTextActive]}>
                        {sessionLetter(index)}
                      </Text>
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{day.foco || "Sessão de treino"}</Text>
                      <Text style={styles.rowSub}>{day.dia}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={brand.dim} />
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(tabs)/chat" as never)}
              style={({ pressed }) => [styles.coachLink, pressed && styles.pressed]}
            >
              <View style={styles.coachIcon}>
                <MaterialIcons name="auto-awesome" size={18} color={brand.accentText} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Ajustar meu plano</Text>
                <Text style={styles.rowSub}>Converse com o Coach para mudar exercícios ou dias</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={brand.dim} />
            </Pressable>
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="auto-awesome" size={26} color={brand.accentText} />
            </View>
            <Text style={styles.emptyTitle}>Monte seu primeiro treino</Text>
            <Text style={styles.emptyDescription}>
              Responda algumas perguntas e o Coach cria um plano de hipertrofia sob medida para você.
            </Text>
            <PrimaryButton
              label="Criar meu plano"
              onPress={() => router.push("/(tabs)/chat" as never)}
              style={styles.emptyButton}
            />
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function Meta({ icon, text }: { icon: keyof typeof MaterialIcons.glyphMap; text: string }) {
  return (
    <View style={styles.meta}>
      <MaterialIcons name={icon} size={15} color={brand.muted} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, minHeight: 0, overflow: "scroll" },
  content: { gap: 28, paddingBottom: 32, paddingTop: 16 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  muted: { color: brand.muted, fontSize: 13 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  headerText: { flex: 1 },
  date: { color: brand.muted, fontSize: 13 },
  greeting: { color: brand.text, fontSize: 28, fontWeight: "700", letterSpacing: -0.6, marginTop: 4 },
  avatar: {
    alignItems: "center",
    backgroundColor: brand.surfaceElevated,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  avatarText: { color: brand.text, fontSize: 15, fontWeight: "600" },
  todayCard: { backgroundColor: brand.surface, borderRadius: 20, padding: 20 },
  todayLabel: { color: brand.accentText, fontSize: 13, fontWeight: "600" },
  todayTitle: { color: brand.text, fontSize: 22, fontWeight: "700", letterSpacing: -0.4, marginTop: 6 },
  metaRow: { flexDirection: "row", gap: 16, marginTop: 10 },
  meta: { alignItems: "center", flexDirection: "row", gap: 5 },
  metaText: { color: brand.muted, fontSize: 13 },
  todayButton: { marginTop: 20 },
  sectionHeader: { alignItems: "baseline", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: brand.text, fontSize: 17, fontWeight: "600" },
  list: { backgroundColor: brand.surface, borderRadius: 16, overflow: "hidden" },
  row: { alignItems: "center", flexDirection: "row", gap: 14, minHeight: 64, paddingHorizontal: 16 },
  rowBorder: { borderBottomColor: brand.border, borderBottomWidth: StyleSheet.hairlineWidth },
  rowPressed: { backgroundColor: brand.surfaceElevated },
  rowText: { flex: 1 },
  rowTitle: { color: brand.text, fontSize: 15, fontWeight: "500" },
  rowSub: { color: brand.muted, fontSize: 13, marginTop: 2 },
  letter: {
    alignItems: "center",
    backgroundColor: brand.surfaceElevated,
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  letterActive: { backgroundColor: brand.accent },
  letterText: { color: brand.muted, fontSize: 14, fontWeight: "600" },
  letterTextActive: { color: "#FFFFFF" },
  coachLink: {
    alignItems: "center",
    backgroundColor: brand.surface,
    borderRadius: 16,
    flexDirection: "row",
    gap: 14,
    padding: 16,
  },
  coachIcon: {
    alignItems: "center",
    backgroundColor: brand.accentSoft,
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  emptyState: { alignItems: "center", paddingHorizontal: 8, paddingTop: 72 },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: brand.accentSoft,
    borderRadius: 18,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  emptyTitle: { color: brand.text, fontSize: 22, fontWeight: "700", marginTop: 20, textAlign: "center" },
  emptyDescription: { color: brand.muted, fontSize: 15, lineHeight: 22, marginTop: 8, textAlign: "center" },
  emptyButton: { alignSelf: "stretch", marginTop: 28 },
  pressed: { opacity: 0.7 },
});
