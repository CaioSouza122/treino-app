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

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).toUpperCase();

  return (
    <ScreenContainer className="px-5">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Topbar ─────────────────────────────────────────────────── */}
        <View style={styles.topbar}>
          <View>
            <Text style={styles.eyebrow}>{today}</Text>
            <Text style={styles.greeting}>
              Olá,{" "}
              <Text style={styles.accent}>{profile?.name || "atleta"}</Text>
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
          </Pressable>
        </View>

        {/* ── Hero card ──────────────────────────────────────────────── */}
        <Entrance delay={60}>
          <View style={styles.hero}>
            <View style={styles.heroTitleRow}>
              <BrandMark size={50} />
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>
                  Monte seu treino{`\n`}
                  <Text style={styles.accent}>com IA</Text>
                </Text>
                <Text style={styles.heroDescription}>
                  Plano ajustado ao seu objetivo e rotina.
                </Text>
              </View>
            </View>
            <PrimaryButton
              label="Começar conversa"
              onPress={() => router.push("/(tabs)/chat" as never)}
              icon={<MaterialIcons name="auto-awesome" color={brand.text} size={18} />}
              style={styles.heroButton}
            />
          </View>
        </Entrance>

        {/* ── Treino atual ───────────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Seu treino atual</Text>
          <Pressable onPress={() => router.push("/workout-detail" as never)}>
            <Text style={styles.textButton}>Ver detalhes</Text>
          </Pressable>
        </View>

        <Entrance delay={120}>
          <Pressable
            onPress={() => router.push("/workout-detail" as never)}
            style={({ pressed }) => [styles.workoutCard, pressed && styles.pressed]}
          >
            <View style={styles.workoutIcon}>
              <MaterialIcons name="fitness-center" color={brand.blueLight} size={25} />
            </View>
            <View style={styles.workoutBody}>
              <View style={styles.workoutLine}>
                <Text style={styles.workoutTitle}>
                  {latest?.days[0]?.foco || "Nenhum treino gerado"}
                </Text>
                <Text style={styles.pill}>{latest ? "RECENTE" : "IA"}</Text>
              </View>
              <Text style={styles.workoutMeta}>
                {latest
                  ? `${latest.days.length} sessões · ${latest.days[0]?.dia || "Treino personalizado"}`
                  : "Gere seu primeiro plano com a IA"}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: latest ? "100%" : "0%" }]}
                />
              </View>
              <Text style={styles.progressText}>
                {latest ? "Treino disponível" : "Aguardando geração"}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" color={brand.muted} size={25} />
          </Pressable>
        </Entrance>

        {/* ── Atividade de hoje ──────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, styles.activityTitle]}>
          Atividade de hoje
        </Text>

        <Entrance delay={180}>
          <View style={styles.stats}>
            <Stat icon="timer" value="45" label="minutos" />
            <Stat icon="local-fire-department" value="2.800" label="kcal" />
            <Stat icon="directions-walk" value="12" label="séries" />
          </View>
        </Entrance>

        {/* ── Dica ───────────────────────────────────────────────────── */}
        <Entrance delay={220}>
          <View style={styles.tip}>
            <MaterialIcons name="bolt" color={brand.blueLight} size={20} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Dica do treinador</Text>
              <Text style={styles.tipText}>
                Mantenha 60–90 segundos de descanso entre as séries de hoje.
              </Text>
            </View>
          </View>
        </Entrance>
      </ScrollView>
    </ScreenContainer>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <MaterialIcons name={icon} color={brand.blueLight} size={22} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 20, paddingBottom: 28, paddingTop: 14 },
  topbar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  eyebrow: { color: brand.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  greeting: { color: brand.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.7, marginTop: 4 },
  accent: { color: brand.blueLight },
  avatar: { alignItems: "center", backgroundColor: brand.blueSoft, borderColor: brand.blue, borderRadius: 24, borderWidth: 1.5, height: 48, justifyContent: "center", width: 48 },
  avatarText: { color: brand.text, fontSize: 13, fontWeight: "900" },
  hero: { backgroundColor: brand.surface, borderColor: brand.blue, borderRadius: 22, borderWidth: 1, padding: 18 },
  heroTitleRow: { flexDirection: "row", gap: 12 },
  heroCopy: { flex: 1 },
  heroTitle: { color: brand.text, fontSize: 23, fontWeight: "900", letterSpacing: -0.5, lineHeight: 27 },
  heroDescription: { color: brand.muted, fontSize: 13, lineHeight: 18, marginTop: 7 },
  heroButton: { marginTop: 18 },
  sectionHead: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  sectionTitle: { color: brand.text, fontSize: 19, fontWeight: "900", letterSpacing: -0.35 },
  textButton: { color: brand.blueLight, fontSize: 13, fontWeight: "800" },
  workoutCard: { alignItems: "center", backgroundColor: brand.surface, borderColor: brand.border, borderRadius: 20, borderWidth: 1, flexDirection: "row", gap: 13, padding: 16 },
  workoutIcon: { alignItems: "center", backgroundColor: brand.blueSoft, borderRadius: 16, height: 50, justifyContent: "center", width: 50 },
  workoutBody: { flex: 1 },
  workoutLine: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  workoutTitle: { color: brand.text, fontSize: 17, fontWeight: "800" },
  pill: { color: brand.blueLight, fontSize: 9, fontWeight: "900", letterSpacing: 0.4 },
  workoutMeta: { color: brand.muted, fontSize: 13, marginTop: 4 },
  progressTrack: { backgroundColor: "#262D3A", borderRadius: 20, height: 6, marginTop: 13, overflow: "hidden" },
  progressFill: { backgroundColor: brand.blue, borderRadius: 20, height: "100%", width: "65%" },
  progressText: { color: brand.blueLight, fontSize: 11, fontWeight: "800", marginTop: 5 },
  activityTitle: { marginTop: 4 },
  stats: { backgroundColor: brand.surface, borderColor: brand.border, borderRadius: 18, borderWidth: 1, flexDirection: "row", paddingVertical: 15 },
  stat: { alignItems: "center", flex: 1, gap: 2 },
  statValue: { color: brand.text, fontSize: 18, fontWeight: "900", marginTop: 3 },
  statLabel: { color: brand.muted, fontSize: 11 },
  tip: { alignItems: "flex-start", backgroundColor: "#0C1A33", borderRadius: 16, flexDirection: "row", gap: 10, padding: 14 },
  tipTitle: { color: brand.text, fontSize: 13, fontWeight: "800" },
  tipText: { color: brand.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
