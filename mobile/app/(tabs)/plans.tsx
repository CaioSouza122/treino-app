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
    return () => {
      active = false;
    };
  }, []);

  const current = workouts[0];

  return (
    <ScreenContainer className="px-5">
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <View style={styles.eyebrowBadge}>
              <MaterialIcons name="folder-special" size={12} color={brand.blueGlow} />
              <Text style={styles.eyebrow}>BIBLIOTECA ATLETA</Text>
            </View>
            <Text style={styles.title}>Meus Treinos</Text>
          </View>
          <BrandMark size={42} />
        </View>

        {/* ── Estado vazio / carregando ──────────────────────────────── */}
        {loading && (
          <View style={styles.feedbackBox}>
            <MaterialIcons name="sync" size={24} color={brand.blueGlow} />
            <Text style={styles.feedbackText}>Sincronizando biblioteca de treinos...</Text>
          </View>
        )}

        {!loading && !current && (
          <View style={styles.feedbackBox}>
            <MaterialIcons name="post-add" size={28} color={brand.dim} />
            <Text style={styles.feedbackText}>
              Nenhum plano cadastrado. Inicie o Coach IA para gerar seu treino.
            </Text>
          </View>
        )}

        {/* ── Treino ativo (destaque) ────────────────────────────────── */}
        {current && (
          <Pressable
            onPress={() =>
              router.push({ pathname: "/workout-detail", params: { workoutId: current.id } })
            }
            style={({ pressed }) => [styles.currentCard, pressed && styles.pressed]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconBox}>
                <MaterialIcons name="fitness-center" size={22} color={brand.blueGlow} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.currentTitle} numberOfLines={1}>
                  {current.days[0]?.foco || "Plano Personalizado"}
                </Text>
                <Text style={styles.currentSub}>
                  {current.days.length} sessões semanais · Otimizado por IA
                </Text>
              </View>
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>ATIVO</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardFooter}>
              <View style={styles.footerItem}>
                <MaterialIcons name="event" size={14} color={brand.muted} />
                <Text style={styles.footerText}>
                  {new Date(current.created_at).toLocaleDateString("pt-BR")}
                </Text>
              </View>
              <View style={styles.footerItem}>
                <MaterialIcons name="view-carousel" size={14} color={brand.muted} />
                <Text style={styles.footerText}>{current.days.length} Dias</Text>
              </View>
            </View>
          </Pressable>
        )}

        {/* ── Histórico Section ─────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Histórico de Planos</Text>
          <Text style={styles.countText}>
            {workouts.length} {workouts.length === 1 ? "registro" : "registros"}
          </Text>
        </View>

        {/* ── Lista de treinos anteriores ────────────────────────────── */}
        {workouts.slice(1).map((workout) => (
          <Pressable
            key={workout.id}
            onPress={() =>
              router.push({ pathname: "/workout-detail", params: { workoutId: workout.id } })
            }
            style={({ pressed }) => [styles.historyItem, pressed && styles.pressed]}
          >
            <View style={styles.historyIcon}>
              <MaterialIcons name="history" size={20} color={brand.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTitle}>
                {workout.days[0]?.foco || "Plano Personalizado"}
              </Text>
              <Text style={styles.historySub}>
                {new Date(workout.created_at).toLocaleDateString("pt-BR")} ·{" "}
                {workout.days.length} sessões
              </Text>
            </View>
            <MaterialIcons name="chevron-right" color={brand.dim} size={22} />
          </Pressable>
        ))}

        {/* ── CTA Botão ──────────────────────────────────────────────── */}
        <PrimaryButton
          label="Montar Novo Treino com IA"
          onPress={() => router.push("/(tabs)/chat" as never)}
          variant="accent"
          icon={<MaterialIcons name="psychology" size={20} color={brand.blueGlow} />}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, minHeight: 0, overflow: "scroll" },
  content: { gap: 16, paddingBottom: 28, paddingTop: 14 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  eyebrowBadge: { alignItems: "center", flexDirection: "row", gap: 5 },
  eyebrow: { color: brand.blueGlow, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  title: { color: brand.text, fontSize: 26, fontWeight: "900", letterSpacing: -0.6, marginTop: 4 },
  feedbackBox: {
    alignItems: "center",
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    justifyContent: "center",
    paddingVertical: 32,
  },
  feedbackText: { color: brand.muted, fontSize: 13, textAlign: "center" },
  currentCard: {
    backgroundColor: brand.surfaceCard,
    borderColor: brand.borderHighlight,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  cardHeaderRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  iconBox: {
    alignItems: "center",
    backgroundColor: "rgba(0, 240, 255, 0.1)",
    borderColor: "rgba(0, 240, 255, 0.3)",
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  currentTitle: { color: brand.text, fontSize: 17, fontWeight: "900" },
  currentSub: { color: brand.muted, fontSize: 12, marginTop: 3 },
  activeTag: {
    backgroundColor: "rgba(0, 240, 255, 0.12)",
    borderColor: brand.blueGlow,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  activeTagText: { color: brand.blueGlow, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  cardDivider: { backgroundColor: brand.border, height: 1, marginVertical: 14 },
  cardFooter: { flexDirection: "row", gap: 16 },
  footerItem: { alignItems: "center", flexDirection: "row", gap: 6 },
  footerText: { color: brand.muted, fontSize: 12, fontWeight: "600" },
  sectionHead: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  sectionTitle: { color: brand.text, fontSize: 17, fontWeight: "900" },
  countText: { color: brand.dim, fontSize: 12, fontWeight: "700" },
  historyItem: {
    alignItems: "center",
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  historyIcon: {
    alignItems: "center",
    backgroundColor: brand.surfaceElevated,
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  historyTitle: { color: brand.text, fontSize: 14, fontWeight: "800" },
  historySub: { color: brand.muted, fontSize: 11, marginTop: 2 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});

