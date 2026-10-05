import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Entrance } from "@/components/entrance";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { brand } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { getLastWorkout, type LocalWorkout } from "@/lib/workouts-api";
import { getProfile, type UserProfile } from "@/lib/profile";

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEK_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];

function buildWeekData(workout: LocalWorkout | null) {
  const today = new Date().getDay();
  return WEEK_LABELS.map((label, i) => {
    const trained = workout ? i % Math.max(1, 7 - workout.days.length) === 0 : false;
    return { label, trained, isToday: i === today };
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const [workout, setWorkout] = useState<LocalWorkout | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [note, setNote] = useState("");
  const [notesSaved, setNotesSaved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [w, p] = await Promise.all([getLastWorkout(), getProfile()]);
      setWorkout(w);
      setProfile(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const today = new Date()
    .toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" })
    .toUpperCase();

  const todayIndex = new Date().getDay();
  const todayDayName = DAYS_PT[todayIndex];
  const todaySession =
    workout?.days.find((d) => d.dia.toUpperCase().includes(todayDayName.toUpperCase())) ??
    workout?.days[0];

  const weekData = buildWeekData(workout);
  const trainedCount = weekData.filter((d) => d.trained).length;

  function saveNote() {
    if (!note.trim()) return;
    haptic.light();
    setNotesSaved((prev) => [note.trim(), ...prev].slice(0, 5));
    setNote("");
  }

  if (loading) {
    return (
      <ScreenContainer className="px-5">
        <View style={styles.center}>
          <MaterialIcons name="sync" size={26} color={brand.blueGlow} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ── EMPTY STATE ──────────────────────────────────────────────────────────────
  if (!workout) {
    return (
      <ScreenContainer className="px-5">
        <ScrollView contentContainerStyle={styles.emptyContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topbar}>
            <View>
              <Text style={styles.eyebrow}>{today}</Text>
              <Text style={styles.greeting}>
                Olá, <Text style={styles.accent}>{profile?.name || "Atleta"}</Text>
              </Text>
            </View>
            <Pressable
              onPress={() => { haptic.light(); router.push("/profile" as never); }}
              style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
            >
              <Text style={styles.avatarText}>{(profile?.name || "AT").slice(0, 2).toUpperCase()}</Text>
            </Pressable>
          </View>

          <Entrance delay={80}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconRing}>
                <MaterialIcons name="fitness-center" size={36} color={brand.blueGlow} />
              </View>
              <Text style={styles.emptyTitle}>Nenhum plano montado</Text>
              <Text style={styles.emptySubtitle}>
                Crie seu primeiro treino personalizado com a IA e comece a evoluir hoje.
              </Text>
              <PrimaryButton
                label="Criar Treino"
                onPress={() => router.push("/(tabs)/chat" as never)}
                variant="accent"
                icon={<MaterialIcons name="auto-awesome" size={18} color={brand.blueGlow} />}
                style={{ marginTop: 4 }}
              />
            </View>
          </Entrance>

          <Entrance delay={160}>
            <View style={styles.chipRow}>
              <InfoChip icon="psychology" label="IA Personalizada" />
              <InfoChip icon="event-repeat" label="Divisão semanal" />
              <InfoChip icon="insights" label="Progressão" />
            </View>
          </Entrance>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── WITH WORKOUT ─────────────────────────────────────────────────────────────
  return (
    <ScreenContainer className="px-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Topbar */}
        <View style={styles.topbar}>
          <View>
            <Text style={styles.eyebrow}>{today}</Text>
            <Text style={styles.greeting}>
              Olá, <Text style={styles.accent}>{profile?.name || "Atleta"}</Text>
            </Text>
          </View>
          <Pressable
            onPress={() => { haptic.light(); router.push("/profile" as never); }}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            <Text style={styles.avatarText}>{(profile?.name || "AT").slice(0, 2).toUpperCase()}</Text>
            <View style={styles.onlineDot} />
          </Pressable>
        </View>

        {/* ── Treino de Hoje ─────────────────────────────────────────── */}
        <Entrance delay={60}>
          <SectionLabel icon="today" label="Hoje" />
          <Pressable
            onPress={() => router.push("/workout-detail" as never)}
            style={({ pressed }) => [styles.todayCard, pressed && styles.pressed]}
          >
            <View style={styles.todayTop}>
              <View style={styles.todayIconBox}>
                <MaterialIcons name="sports-gymnastics" size={22} color={brand.blueGlow} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.todayLabel}>{todaySession?.foco || "Sessão do Dia"}</Text>
                <Text style={styles.todayMeta}>
                  {todaySession?.dia || "Treino A"} · {workout.days.length} dias/semana
                </Text>
              </View>
              <View style={styles.readyTag}>
                <Text style={styles.readyTagText}>PRONTO</Text>
              </View>
              <MaterialIcons name="chevron-right" color={brand.dim} size={22} />
            </View>
            <View style={styles.divider} />
            <Text style={styles.exercisesPreview} numberOfLines={2}>
              {todaySession?.exercicios
                .split("\n")
                .filter(Boolean)
                .slice(0, 3)
                .join("  ·  ") || "Ver exercícios completos"}
            </Text>
          </Pressable>
        </Entrance>

        {/* ── Divisão Semanal ───────────────────────────────────────── */}
        <Entrance delay={120}>
          <SectionLabel icon="event-repeat" label="Divisão Semanal" />
          <View style={styles.weekPlanCard}>
            {workout.days.map((day, i) => (
              <Pressable
                key={`${day.dia}-${i}`}
                onPress={() =>
                  router.push({
                    pathname: "/workout-detail",
                    params: { workoutId: workout.id },
                  } as never)
                }
                style={({ pressed }) => [
                  styles.dayRow,
                  i < workout.days.length - 1 && styles.dayRowBorder,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>{day.dia.slice(0, 3).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dayFoco}>{day.foco}</Text>
                </View>
                <MaterialIcons name="chevron-right" color={brand.dim} size={18} />
              </Pressable>
            ))}
          </View>
        </Entrance>

        {/* ── Gráfico de Evolução ────────────────────────────────────── */}
        <Entrance delay={180}>
          <View style={styles.sectionRow}>
            <SectionLabel icon="bar-chart" label="Evolução — 7 dias" />
            <View style={styles.streakChip}>
              <MaterialIcons name="local-fire-department" size={13} color={brand.neonLime} />
              <Text style={styles.streakText}>{trainedCount}x essa semana</Text>
            </View>
          </View>
          <View style={styles.chartCard}>
            <View style={styles.chartBars}>
              {weekData.map((day, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: day.trained ? "100%" : "20%",
                          backgroundColor: day.isToday
                            ? brand.blueGlow
                            : day.trained
                            ? brand.blue
                            : brand.border,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, day.isToday && { color: brand.blueGlow }]}>
                    {day.label}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: brand.blueGlow }]} />
                <Text style={styles.legendText}>Hoje</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: brand.blue }]} />
                <Text style={styles.legendText}>Treinado</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: brand.border }]} />
                <Text style={styles.legendText}>Descanso</Text>
              </View>
            </View>
          </View>
        </Entrance>

        {/* ── Anotações ─────────────────────────────────────────────── */}
        <Entrance delay={240}>
          <SectionLabel icon="edit-note" label="Anotações" />
          <View style={styles.notesCard}>
            <View style={styles.noteInputRow}>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Adicionar anotação do treino..."
                placeholderTextColor={brand.dim}
                style={styles.noteInput}
                onSubmitEditing={saveNote}
                returnKeyType="done"
              />
              <Pressable
                onPress={saveNote}
                style={({ pressed }) => [styles.noteAddBtn, pressed && styles.pressed]}
              >
                <MaterialIcons name="add" size={20} color={brand.text} />
              </Pressable>
            </View>
            {notesSaved.length > 0 ? (
              <View style={styles.noteList}>
                {notesSaved.map((n, i) => (
                  <View key={i} style={styles.noteItem}>
                    <View style={styles.noteDot} />
                    <Text style={styles.noteText}>{n}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noteEmpty}>
                Nenhuma anotação ainda. Registre observações, PRs ou ajustes.
              </Text>
            )}
          </View>
        </Entrance>

        {/* ── Quick Action ──────────────────────────────────────────── */}
        <Entrance delay={300}>
          <PrimaryButton
            label="Atualizar Plano com IA"
            onPress={() => router.push("/(tabs)/chat" as never)}
            variant="primary"
            icon={<MaterialIcons name="psychology" size={18} color={brand.text} />}
          />
        </Entrance>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({
  icon,
  label,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.sectionLabel}>
      <MaterialIcons name={icon} size={16} color={brand.blueGlow} />
      <Text style={styles.sectionLabelText}>{label}</Text>
    </View>
  );
}

function InfoChip({
  icon,
  label,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.infoChip}>
      <MaterialIcons name={icon} size={14} color={brand.blueGlow} />
      <Text style={styles.infoChipText}>{label}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: { alignItems: "center", flex: 1, gap: 10, justifyContent: "center" },
  loadingText: { color: brand.muted, fontSize: 13 },

  // Empty state
  emptyContent: { gap: 20, paddingBottom: 40, paddingTop: 12 },
  emptyCard: {
    alignItems: "center",
    backgroundColor: brand.surfaceCard,
    borderColor: brand.borderHighlight,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 32,
  },
  emptyIconRing: {
    alignItems: "center",
    backgroundColor: "rgba(0,240,255,0.08)",
    borderColor: "rgba(0,240,255,0.3)",
    borderRadius: 36,
    borderWidth: 1,
    height: 72,
    justifyContent: "center",
    marginBottom: 4,
    width: 72,
  },
  emptyTitle: {
    color: brand.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptySubtitle: { color: brand.muted, fontSize: 13, lineHeight: 19, textAlign: "center" },
  chipRow: { flexDirection: "row", gap: 8, justifyContent: "center" },
  infoChip: {
    alignItems: "center",
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  infoChipText: { color: brand.muted, fontSize: 11, fontWeight: "700" },

  // Main content
  content: { gap: 14, paddingBottom: 32, paddingTop: 12 },

  // Topbar
  topbar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  eyebrow: { color: brand.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  greeting: { color: brand.text, fontSize: 24, fontWeight: "900", letterSpacing: -0.5, marginTop: 3 },
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

  // Section label
  sectionLabel: { alignItems: "center", flexDirection: "row", gap: 7, marginBottom: 8, marginTop: 2 },
  sectionLabelText: { color: brand.text, fontSize: 14, fontWeight: "900", letterSpacing: 0.1 },
  sectionRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },

  // Today card
  todayCard: {
    backgroundColor: brand.surfaceCard,
    borderColor: brand.borderHighlight,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  todayTop: { alignItems: "center", flexDirection: "row", gap: 12 },
  todayIconBox: {
    alignItems: "center",
    backgroundColor: "rgba(0,240,255,0.08)",
    borderColor: "rgba(0,240,255,0.25)",
    borderRadius: 14,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  todayLabel: { color: brand.text, fontSize: 16, fontWeight: "900", letterSpacing: -0.2 },
  todayMeta: { color: brand.muted, fontSize: 12, marginTop: 2 },
  readyTag: {
    backgroundColor: "rgba(16,185,129,0.12)",
    borderColor: brand.success,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  readyTagText: { color: brand.success, fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  divider: { backgroundColor: brand.border, height: 1, marginVertical: 12 },
  exercisesPreview: { color: brand.muted, fontSize: 12, lineHeight: 17 },

  // Week plan
  weekPlanCard: {
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  dayRow: { alignItems: "center", flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  dayRowBorder: { borderBottomColor: brand.border, borderBottomWidth: 1 },
  dayBadge: {
    alignItems: "center",
    backgroundColor: "rgba(0,240,255,0.08)",
    borderColor: "rgba(0,240,255,0.25)",
    borderRadius: 8,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 44,
  },
  dayBadgeText: { color: brand.blueGlow, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  dayFoco: { color: brand.text, fontSize: 13, fontWeight: "700" },

  // Chart
  chartCard: {
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  chartBars: { alignItems: "flex-end", flexDirection: "row", gap: 8, height: 80 },
  barCol: { alignItems: "center", flex: 1 },
  barTrack: {
    backgroundColor: brand.border,
    borderRadius: 6,
    flex: 1,
    justifyContent: "flex-end",
    overflow: "hidden",
    width: "100%",
  },
  barFill: { borderRadius: 6, width: "100%" },
  barLabel: { color: brand.dim, fontSize: 10, fontWeight: "700", marginTop: 5 },
  chartLegend: {
    borderTopColor: brand.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 14,
    justifyContent: "center",
    marginTop: 12,
    paddingTop: 10,
  },
  legendItem: { alignItems: "center", flexDirection: "row", gap: 5 },
  legendDot: { borderRadius: 4, height: 8, width: 8 },
  legendText: { color: brand.muted, fontSize: 10 },
  streakChip: {
    alignItems: "center",
    backgroundColor: "rgba(163,230,53,0.08)",
    borderColor: "rgba(163,230,53,0.3)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  streakText: { color: brand.neonLime, fontSize: 10, fontWeight: "800" },

  // Notes
  notesCard: {
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  noteInputRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  noteInput: {
    backgroundColor: brand.background,
    borderColor: brand.border,
    borderRadius: 12,
    borderWidth: 1,
    color: brand.text,
    flex: 1,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteAddBtn: {
    alignItems: "center",
    backgroundColor: brand.blue,
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  noteList: { gap: 8, marginTop: 12 },
  noteItem: { alignItems: "flex-start", flexDirection: "row", gap: 8 },
  noteDot: { backgroundColor: brand.blueGlow, borderRadius: 4, height: 6, marginTop: 5, width: 6 },
  noteText: { color: brand.muted, flex: 1, fontSize: 13, lineHeight: 18 },
  noteEmpty: { color: brand.dim, fontSize: 12, marginTop: 10, textAlign: "center" },

  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
