import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyChart, FrequencyChart, StrengthChart, strengthDelta } from "@/components/charts";

import { BrandMark, Wordmark } from "@/components/brand-mark";
import { Entrance } from "@/components/entrance";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { Label, SectionHead } from "@/components/ui";
import { brand, font, radius, type } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { parseSession } from "@/lib/parse-workout";
import {
  adherence,
  formatKg,
  getLogs,
  strengthSeries,
  trackedExercises,
  weeklyFrequency,
  type ProgressLog,
} from "@/lib/progress";
import { getProfile, type UserProfile } from "@/lib/profile";
import { getLastWorkout, type LocalWorkout } from "@/lib/workouts-api";

export default function HomeScreen() {
  const router = useRouter();
  const [latest, setLatest] = useState<LocalWorkout | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getLastWorkout(), getProfile(), getLogs()])
        .then(([workout, currentProfile, savedLogs]) => {
          setLatest(workout);
          setProfile(currentProfile);
          setLogs(savedLogs);
        })
        .catch(() => {
          setLatest(null);
          setProfile(null);
        });
    }, []),
  );

  const sessions = useMemo(() => (latest ? latest.days.map(parseSession) : []), [latest]);
  const next = sessions[0];

  const planned = profile?.vezes_por_semana ?? 4;
  const weeks = useMemo(() => weeklyFrequency(logs, planned), [logs, planned]);
  const thisWeek = weeks[weeks.length - 1];
  const tracked = useMemo(() => trackedExercises(logs), [logs]);
  const activeKey = tracked.find((item) => item.key === selectedKey)?.key ?? tracked[0]?.key ?? null;
  const series = useMemo(() => (activeKey ? strengthSeries(logs, activeKey) : []), [logs, activeKey]);
  const activeName = tracked.find((item) => item.key === activeKey)?.name ?? "";
  const delta = strengthDelta(series);

  const today = new Date()
    .toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" })
    .replace(".", "");
  const name = profile?.name?.trim() || "atleta";

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Topo ─────────────────────────────────────────────────── */}
        <View style={styles.topbar}>
          <View style={styles.brandRow}>
            <BrandMark size={26} />
            <Wordmark size={17} />
          </View>
          <Pressable
            accessibilityLabel="Abrir perfil"
            onPress={() => {
              haptic.light();
              router.push("/profile" as never);
            }}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            <Text style={styles.avatarText}>{name.slice(0, 2).toUpperCase()}</Text>
          </Pressable>
        </View>

        <Entrance>
          <View style={styles.greeting}>
            <Label>{today}</Label>
            <Text style={styles.h1}>
              Olá, {name}<Text style={styles.dot}>.</Text>
            </Text>
          </View>
        </Entrance>

        {/* ── Próximo treino ───────────────────────────────────────── */}
        <Entrance delay={80}>
          {next ? (
            <Pressable
              onPress={() => router.push({ pathname: "/workout-detail", params: { workoutId: latest?.id } })}
              style={({ pressed }) => [styles.next, pressed && styles.pressed]}
            >
              <View style={styles.nextTop}>
                <Label color={brand.lime}>Próximo treino</Label>
                <Text style={styles.nextTag}>{next.label}</Text>
              </View>
              <Text style={styles.nextTitle}>{next.subtitle}</Text>
              <View style={styles.nextMeta}>
                <Meta icon="fitness-center" text={`${next.exercises.length} exercícios`} />
                <Meta icon="timer" text={next.duration} />
              </View>
              <PrimaryButton
                label="Iniciar"
                onPress={() => router.push({ pathname: "/workout-detail", params: { workoutId: latest?.id } })}
                icon={<MaterialIcons name="arrow-forward" size={18} color={brand.onLime} />}
                style={styles.nextButton}
              />
            </Pressable>
          ) : (
            <View style={styles.next}>
              <Label color={brand.cyan}>Sem plano ainda</Label>
              <Text style={styles.nextTitle}>Deixe a IA montar o seu treino.</Text>
              <Text style={styles.emptyCopy}>
                Seu perfil já está pronto. Em menos de um minuto você tem um plano dividido por dias.
              </Text>
              <PrimaryButton
                label="Montar treino"
                onPress={() => router.push("/(tabs)/chat" as never)}
                icon={<MaterialIcons name="auto-awesome" size={18} color={brand.onLime} />}
                style={styles.nextButton}
              />
            </View>
          )}
        </Entrance>

        {/* ── Frequência ───────────────────────────────────────────── */}
        <Entrance delay={110}>
          <View style={styles.block}>
            <SectionHead title="Frequência" />
            <View style={styles.bigRow}>
              <View style={styles.bigItem}>
                <Text style={styles.bigValue}>
                  {thisWeek.done}<Text style={styles.bigOf}>/{planned}</Text>
                </Text>
                <Text style={styles.bigLabel}>dias nesta semana</Text>
              </View>
              <View style={[styles.bigItem, styles.bigRight]}>
                <Text style={[styles.bigValue, { color: brand.lime }]}>{adherence(weeks)}%</Text>
                <Text style={styles.bigLabel}>últimas 8 semanas</Text>
              </View>
            </View>
            <FrequencyChart weeks={weeks} />
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.swatch, styles.swatchPlanned]} />
                <Text style={styles.legendText}>Planejado</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.swatch, styles.swatchDone]} />
                <Text style={styles.legendText}>Concluído</Text>
              </View>
            </View>
          </View>
        </Entrance>

        {/* ── Evolução de força ────────────────────────────────────── */}
        <Entrance delay={170}>
          <View style={styles.block}>
            <SectionHead title="Evolução de força" />
            {tracked.length === 0 ? (
              <EmptyChart
                title="Sem cargas registradas"
                text="Ao concluir um exercício, anote a carga usada. Aqui você acompanha a evolução de cada um."
              />
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  {tracked.map((item) => {
                    const on = item.key === activeKey;
                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => {
                          haptic.light();
                          setSelectedKey(item.key);
                        }}
                        style={[styles.chip, on && styles.chipOn]}
                      >
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{item.name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <View style={styles.bigRow}>
                  <View style={styles.bigItem}>
                    <Text style={styles.bigValue}>{series.length ? formatKg(series[series.length - 1].load) : "—"}</Text>
                    <Text style={styles.bigLabel} numberOfLines={1}>{activeName} · última carga</Text>
                  </View>
                  {delta && (
                    <View style={[styles.bigItem, styles.bigRight]}>
                      <Text style={[styles.delta, { color: delta.positive ? brand.lime : brand.danger }]}>{delta.text}</Text>
                    </View>
                  )}
                </View>
                <StrengthChart points={series} />
              </>
            )}
          </View>
        </Entrance>

        {/* ── Plano da semana ──────────────────────────────────────── */}
        {sessions.length > 0 && (
          <Entrance delay={140}>
            <View style={styles.block}>
              <SectionHead title="Plano da semana" />
              <View style={styles.list}>
                {sessions.map((session, index) => (
                  <Pressable
                    key={session.id}
                    onPress={() => router.push({ pathname: "/workout-detail", params: { workoutId: latest?.id } })}
                    style={({ pressed }) => [styles.row, index > 0 && styles.rowDivider, pressed && styles.pressed]}
                  >
                    <Text style={styles.rowIndex}>{String(index + 1).padStart(2, "0")}</Text>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{session.subtitle}</Text>
                      <Text style={styles.rowSub}>{session.exercises.length} exercícios · {session.duration}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={brand.dim} />
                  </Pressable>
                ))}
              </View>
            </View>
          </Entrance>
        )}

        {/* ── Perfil que a IA usa ──────────────────────────────────── */}
        {profile && (
          <Entrance delay={200}>
            <View style={styles.block}>
              <SectionHead title="Seus dados" />
              <View style={styles.stats}>
                <Stat value={String(profile.vezes_por_semana)} unit="dias/sem" />
                <View style={styles.statDivider} />
                <Stat value={String(profile.tempo)} unit="min" />
                <View style={styles.statDivider} />
                <Stat value={String(profile.peso)} unit="kg" />
                <View style={styles.statDivider} />
                <Stat value={String(profile.altura)} unit="cm" />
              </View>
              <Text style={styles.profileLine}>
                Objetivo: <Text style={styles.profileValue}>{profile.objetivo}</Text> · Nível:{" "}
                <Text style={styles.profileValue}>{profile.nivel}</Text>
              </Text>
            </View>
          </Entrance>
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

function Stat({ value, unit }: { value: string; unit: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 28, paddingBottom: 32, paddingTop: 12 },
  topbar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  brandRow: { alignItems: "center", flexDirection: "row", gap: 9 },
  avatar: { alignItems: "center", borderColor: brand.borderStrong, borderRadius: radius.sm, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  avatarText: { color: brand.text, fontFamily: font.displayMedium, fontSize: 12, letterSpacing: 0.6 },
  greeting: { gap: 8 },
  h1: { ...type.h1, fontSize: 34, lineHeight: 39 },
  dot: { color: brand.lime },
  next: { backgroundColor: brand.surface, borderColor: brand.borderStrong, borderRadius: radius.lg, borderWidth: 1, gap: 14, padding: 20 },
  nextTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  nextTag: { ...type.label, borderColor: brand.borderStrong, borderRadius: 6, borderWidth: 1, color: brand.text, paddingHorizontal: 8, paddingVertical: 3 },
  nextTitle: { ...type.h2, fontSize: 24, lineHeight: 29 },
  nextMeta: { flexDirection: "row", gap: 18 },
  meta: { alignItems: "center", flexDirection: "row", gap: 6 },
  metaText: { color: brand.muted, fontSize: 13 },
  emptyCopy: { ...type.caption, fontSize: 14, lineHeight: 20 },
  nextButton: { marginTop: 6 },
  block: { gap: 14 },
  bigRow: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between" },
  bigItem: { flexShrink: 1, gap: 2 },
  bigRight: { alignItems: "flex-end" },
  bigValue: { color: brand.text, fontFamily: font.display, fontSize: 30, letterSpacing: -0.4, lineHeight: 34 },
  bigOf: { color: brand.dim, fontSize: 20 },
  bigLabel: { ...type.label, fontSize: 9.5 },
  delta: { fontFamily: font.displayMedium, fontSize: 12.5 },
  legend: { flexDirection: "row", gap: 16 },
  legendItem: { alignItems: "center", flexDirection: "row", gap: 6 },
  legendText: { ...type.caption, fontSize: 11.5 },
  swatch: { borderRadius: 2, height: 10, width: 10 },
  swatchPlanned: { borderColor: brand.borderStrong, borderWidth: 1 },
  swatchDone: { backgroundColor: brand.lime },
  chips: { gap: 8 },
  chip: { borderColor: brand.border, borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  chipOn: { backgroundColor: brand.limeSoft, borderColor: brand.lime },
  chipText: { color: brand.muted, fontFamily: font.displayMedium, fontSize: 12 },
  chipTextOn: { color: brand.lime },
  list: { borderColor: brand.border, borderRadius: radius.md, borderWidth: 1, overflow: "hidden" },
  row: { alignItems: "center", backgroundColor: brand.surface, flexDirection: "row", gap: 14, minHeight: 62, paddingHorizontal: 16 },
  rowDivider: { borderTopColor: brand.border, borderTopWidth: 1 },
  rowIndex: { color: brand.cyan, fontFamily: font.display, fontSize: 13, letterSpacing: 0.6, width: 24 },
  rowBody: { flex: 1 },
  rowTitle: { ...type.title, fontSize: 15 },
  rowSub: { ...type.caption, marginTop: 2 },
  stats: { alignItems: "center", flexDirection: "row" },
  stat: { alignItems: "flex-start", flex: 1, gap: 2, paddingLeft: 2 },
  statValue: { color: brand.text, fontFamily: font.display, fontSize: 24, letterSpacing: -0.3 },
  statUnit: { ...type.label, fontSize: 9.5 },
  statDivider: { backgroundColor: brand.border, height: 30, width: 1 },
  profileLine: { ...type.caption },
  profileValue: { color: brand.text, textTransform: "capitalize" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
