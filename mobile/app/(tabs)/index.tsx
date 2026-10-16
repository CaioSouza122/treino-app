import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Plate } from "@/components/plate";
import { buttonInk, PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { brand, fonts } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { getProfile, type UserProfile } from "@/lib/profile";
import { parseSession } from "@/lib/workout-format";
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
      <ScreenContainer>
        <View style={styles.loading}>
          <Text style={styles.muted}>Carregando…</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false}>
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
            <View>
              <View style={styles.hero}>
                <View style={styles.heroText}>
                  <Text style={styles.heroLead}>Hoje é dia de</Text>
                  <Text style={styles.heroTitle}>{todaySession.subtitle}</Text>
                  <Text style={styles.heroMeta}>
                    {todaySession.exercises.length} exercícios{"\n"}cerca de {todaySession.minutes} minutos
                  </Text>
                </View>
                <Plate index={todayIndex} size={190} caption={`${todaySession.minutes} MIN`} style={styles.heroPlate} />
              </View>
              <PrimaryButton
                label="Começar treino"
                onPress={() => openWorkout(todayIndex)}
                icon={<MaterialIcons name="play-arrow" size={22} color={buttonInk.primary} />}
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>Sua semana</Text>
              {workout.days.map((day, index) => (
                <Pressable
                  key={`${day.dia}-${index}`}
                  accessibilityRole="button"
                  onPress={() => openWorkout(index)}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                >
                  <Plate index={index} size={44} />
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{day.foco || "Sessão de treino"}</Text>
                    <Text style={styles.rowSub}>{index === todayIndex ? `${day.dia}, hoje` : day.dia}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={brand.dim} />
                </Pressable>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(tabs)/chat" as never)}
              style={({ pressed }) => [styles.coachLink, pressed && styles.pressed]}
            >
              <Text style={styles.coachText}>
                Quer trocar um exercício ou mudar os dias? <Text style={styles.coachAction}>Fale com o Coach</Text>
              </Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Plate index={0} size={120} muted />
            <Text style={styles.emptyTitle}>Sua barra está vazia</Text>
            <Text style={styles.emptyDescription}>
              Conte ao Coach seu objetivo e quantos dias você treina. Ele monta um plano de hipertrofia sob medida.
            </Text>
            <PrimaryButton
              label="Montar meu plano"
              onPress={() => router.push("/(tabs)/chat" as never)}
              style={styles.emptyButton}
            />
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, minHeight: 0, overflow: "scroll" },
  content: { gap: 36, paddingBottom: 32, paddingHorizontal: 20, paddingTop: 16 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  muted: { color: brand.muted, fontFamily: fonts.body, fontSize: 14 },
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  headerText: { flex: 1 },
  date: { color: brand.muted, fontFamily: fonts.body, fontSize: 14 },
  greeting: { color: brand.text, fontFamily: fonts.display, fontSize: 40, lineHeight: 44, marginTop: 2 },
  avatar: {
    alignItems: "center",
    borderColor: brand.borderStrong,
    borderRadius: 21,
    borderWidth: 1.5,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  avatarText: { color: brand.text, fontFamily: fonts.display, fontSize: 20 },
  // The plate bleeds past the right edge of the screen on purpose.
  hero: { alignItems: "center", flexDirection: "row", marginBottom: 24, marginRight: -20, overflow: "hidden" },
  heroPlate: { marginRight: -48 },
  heroText: { flex: 1, paddingRight: 12 },
  heroLead: { color: brand.muted, fontFamily: fonts.medium, fontSize: 15 },
  heroTitle: { color: brand.text, fontFamily: fonts.display, fontSize: 38, lineHeight: 40, marginTop: 4 },
  heroMeta: { color: brand.muted, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, marginTop: 12 },
  sectionTitle: { color: brand.text, fontFamily: fonts.display, fontSize: 26, marginBottom: 6 },
  row: {
    alignItems: "center",
    borderBottomColor: brand.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 14,
    minHeight: 72,
  },
  rowText: { flex: 1 },
  rowTitle: { color: brand.text, fontFamily: fonts.semibold, fontSize: 16 },
  rowSub: { color: brand.muted, fontFamily: fonts.body, fontSize: 14, marginTop: 2 },
  coachLink: { paddingVertical: 4 },
  coachText: { color: brand.muted, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  coachAction: { color: brand.text, fontFamily: fonts.semibold, textDecorationLine: "underline" },
  emptyState: { alignItems: "flex-start", paddingTop: 48 },
  emptyTitle: { color: brand.text, fontFamily: fonts.display, fontSize: 36, lineHeight: 40, marginTop: 28 },
  emptyDescription: { color: brand.muted, fontFamily: fonts.body, fontSize: 16, lineHeight: 24, marginTop: 10 },
  emptyButton: { alignSelf: "stretch", marginTop: 28 },
  pressed: { opacity: 0.7 },
});
