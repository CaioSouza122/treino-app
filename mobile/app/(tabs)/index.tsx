import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BrandMark } from "@/components/brand-mark";
import { Entrance } from "@/components/entrance";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { brand } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { getLastWorkout, type LocalWorkout } from "@/lib/workouts-api";
import { getProfile, type UserProfile } from "@/lib/profile";

export default function HomeScreen() {
  const router = useRouter();
  const [latest, setLatest] = useState<LocalWorkout | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    Promise.all([getLastWorkout(), getProfile()])
      .then(([workout, currentProfile]) => {
        setLatest(workout);
        setProfile(currentProfile);
      })
      .catch(() => {
        setLatest(null);
        setProfile(null);
      });
  }, []);

  const today = new Date()
    .toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "short",
    })
    .toUpperCase();

  return (
    <ScreenContainer className="px-5">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Topbar ─────────────────────────────────────────────────── */}
        <View style={styles.topbar}>
          <View>
            <View style={styles.dateBadge}>
              <MaterialIcons name="calendar-today" color={brand.blueGlow} size={11} />
              <Text style={styles.eyebrow}>{today}</Text>
            </View>
            <Text style={styles.greeting}>
              Olá, <Text style={styles.accent}>{profile?.name || "Atleta"}</Text>
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Abrir perfil"
            onPress={() => {
              haptic.light();
              router.push("/profile" as never);
            }}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            <Text style={styles.avatarText}>
              {(profile?.name || "AT").slice(0, 2).toUpperCase()}
            </Text>
            <View style={styles.onlineDot} />
          </Pressable>
        </View>

        {/* ── AI Engine Hero Card ─────────────────────────────────────── */}
        <Entrance delay={60}>
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <BrandMark size={46} />
              <View style={styles.liveChip}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveChipText}>ENGINE IA ATIVA</Text>
              </View>
            </View>

            <View style={styles.heroBody}>
              <Text style={styles.heroTitle}>
                Plano de Carga <Text style={styles.accent}>Inteligente</Text>
              </Text>
              <Text style={styles.heroSub}>
                Algoritmo otimizado para progressão contínua de hipertrofia e volume muscular.
              </Text>
            </View>

            <PrimaryButton
              label="Gerar Novo Plano com IA"
              onPress={() => router.push("/(tabs)/chat" as never)}
              variant="accent"
              icon={<MaterialIcons name="psychology" color={brand.blueGlow} size={20} />}
              style={styles.heroButton}
            />
          </View>
        </Entrance>

        {/* ── Treino Atual ───────────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionTitleWrap}>
            <MaterialIcons name="fitness-center" color={brand.blueLight} size={18} />
            <Text style={styles.sectionTitle}>Sessão Atual</Text>
          </View>
          <Pressable onPress={() => router.push("/workout-detail" as never)}>
            <Text style={styles.textButton}>Ver detalhes</Text>
          </Pressable>
        </View>

        <Entrance delay={120}>
          <Pressable
            onPress={() => router.push("/workout-detail" as never)}
            style={({ pressed }) => [styles.workoutCard, pressed && styles.pressed]}
          >
            <View style={styles.workoutIconBox}>
              <MaterialIcons name="sports-gymnastics" color={brand.blueGlow} size={24} />
            </View>
            <View style={styles.workoutBody}>
              <View style={styles.workoutLine}>
                <Text style={styles.workoutTitle} numberOfLines={1}>
                  {latest?.days[0]?.foco || "Nenhum plano gerado"}
                </Text>
                <View style={styles.statusTag}>
                  <Text style={styles.statusTagText}>
                    {latest ? "PRONTO" : "AGUARDANDO"}
                  </Text>
                </View>
              </View>
              <Text style={styles.workoutMeta}>
                {latest
                  ? `${latest.days.length} dias/semana · ${latest.days[0]?.dia || "Treino A"}`
                  : "Gere seu primeiro plano na aba Coach IA"}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: latest ? "100%" : "0%" }]}
                />
              </View>
            </View>
            <MaterialIcons name="chevron-right" color={brand.dim} size={24} />
          </Pressable>
        </Entrance>

        {/* ── Atividade e Métricas ───────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionTitleWrap}>
            <MaterialIcons name="insights" color={brand.neonLime} size={18} />
            <Text style={styles.sectionTitle}>Métricas de Desempenho</Text>
          </View>
        </View>

        <Entrance delay={180}>
          <View style={styles.statsGrid}>
            <StatBox icon="timer" value="45" label="min/sessão" color={brand.blueGlow} />
            <StatBox icon="local-fire-department" value="2.8k" label="kcal estimadas" color={brand.neonLime} />
            <StatBox icon="format-list-numbered" value="12" label="séries totais" color={brand.violet} />
          </View>
        </Entrance>

        {/* ── Orientação do Treinador ──────────────────────────────── */}
        <Entrance delay={220}>
          <View style={styles.tipCard}>
            <View style={styles.tipIconWrap}>
              <MaterialIcons name="lightbulb" color={brand.blueGlow} size={20} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>RECOMENDAÇÃO TÉCNICA</Text>
              <Text style={styles.tipText}>
                Descanso de 60 a 90 segundos garante maior ressíntese de ATP para cargas pesadas.
              </Text>
            </View>
          </View>
        </Entrance>
      </ScrollView>
    </ScreenContainer>
  );
}

function StatBox({
  icon,
  value,
  label,
  color,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.statIconBadge, { backgroundColor: `${color}15`, borderColor: `${color}40` }]}>
        <MaterialIcons name={icon} color={color} size={18} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18, paddingBottom: 28, paddingTop: 12 },
  topbar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  dateBadge: { alignItems: "center", flexDirection: "row", gap: 5 },
  eyebrow: { color: brand.muted, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  greeting: { color: brand.text, fontSize: 26, fontWeight: "900", letterSpacing: -0.6, marginTop: 4 },
  accent: { color: brand.blueGlow },
  avatar: {
    alignItems: "center",
    backgroundColor: brand.surfaceElevated,
    borderColor: brand.blueGlow,
    borderRadius: 22,
    borderWidth: 1.5,
    height: 44,
    justifyContent: "center",
    position: "relative",
    width: 44,
  },
  avatarText: { color: brand.text, fontSize: 13, fontWeight: "900" },
  onlineDot: {
    backgroundColor: brand.neonLime,
    borderRadius: 5,
    bottom: 0,
    height: 10,
    position: "absolute",
    right: 0,
    width: 10,
  },
  heroCard: {
    backgroundColor: brand.surfaceCard,
    borderColor: brand.borderHighlight,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  heroHeader: {
    alignItems: "center",
    flexDirection: "row",
    justify: "space-between",
  },
  liveChip: {
    alignItems: "center",
    backgroundColor: "rgba(0, 240, 255, 0.08)",
    borderColor: "rgba(0, 240, 255, 0.3)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pulseDot: {
    backgroundColor: brand.blueGlow,
    borderRadius: 4,
    height: 6,
    width: 6,
  },
  liveChipText: {
    color: brand.blueGlow,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroBody: { marginVertical: 14 },
  heroTitle: { color: brand.text, fontSize: 22, fontWeight: "900", letterSpacing: -0.5, lineHeight: 28 },
  heroSub: { color: brand.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
  heroButton: { marginTop: 4 },
  sectionHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  sectionTitleWrap: { alignItems: "center", flexDirection: "row", gap: 8 },
  sectionTitle: { color: brand.text, fontSize: 17, fontWeight: "900", letterSpacing: -0.3 },
  textButton: { color: brand.blueGlow, fontSize: 12, fontWeight: "800" },
  workoutCard: {
    alignItems: "center",
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: 16,
  },
  workoutIconBox: {
    alignItems: "center",
    backgroundColor: "rgba(0, 240, 255, 0.08)",
    borderColor: "rgba(0, 240, 255, 0.2)",
    borderRadius: 16,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  workoutBody: { flex: 1 },
  workoutLine: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  workoutTitle: { color: brand.text, flex: 1, fontSize: 16, fontWeight: "800" },
  statusTag: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderColor: brand.success,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusTagText: { color: brand.success, fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  workoutMeta: { color: brand.muted, fontSize: 12, marginTop: 3 },
  progressTrack: { backgroundColor: brand.border, borderRadius: 10, height: 4, marginTop: 10, overflow: "hidden" },
  progressFill: { backgroundColor: brand.blueGlow, borderRadius: 10, height: "100%" },
  statsGrid: { flexDirection: "row", gap: 10 },
  statItem: {
    alignItems: "center",
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 14,
  },
  statIconBadge: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    marginBottom: 8,
    width: 34,
  },
  statValue: { color: brand.text, fontSize: 17, fontWeight: "900" },
  statLabel: { color: brand.muted, fontSize: 10, marginTop: 2 },
  tipCard: {
    alignItems: "center",
    backgroundColor: "rgba(19, 35, 66, 0.5)",
    borderColor: brand.borderHighlight,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  tipIconWrap: {
    alignItems: "center",
    backgroundColor: "rgba(0, 240, 255, 0.1)",
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  tipContent: { flex: 1 },
  tipTitle: { color: brand.blueGlow, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  tipText: { color: brand.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});

