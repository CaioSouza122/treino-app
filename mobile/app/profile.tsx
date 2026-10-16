import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, SlideInLeft, ReduceMotion } from "react-native-reanimated";

import { BrandMark } from "@/components/brand-mark";
import { ScreenContainer } from "@/components/screen-container";
import { brand } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { defaultProfile, getProfile, saveProfile, type UserProfile } from "@/lib/profile";

const menu = [
  { icon: "fitness-center", label: "Meus Treinos" },
  { icon: "psychology", label: "Montar Treino com IA" },
  { icon: "history", label: "Histórico de Planos" },
  { icon: "insights", label: "Métricas & Progresso" },
  { icon: "settings", label: "Configurações" },
] as const;

type NumericField = "altura" | "peso" | "idade" | "vezes_por_semana" | "tempo";

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile().then(setProfile).catch(() => setProfile(defaultProfile));
  }, []);

  function updateNumber(field: NumericField, value: string) {
    const numeric = Number(value.replace(",", "."));
    setProfile((current: UserProfile) => ({
      ...current,
      [field]: Number.isFinite(numeric) ? numeric : 0,
    }));
    setSaved(false);
  }

  async function handleSave() {
    if (
      !profile.altura ||
      !profile.peso ||
      !profile.idade ||
      !profile.vezes_por_semana ||
      !profile.tempo ||
      !profile.objetivo ||
      !profile.nivel
    )
      return;
    setSaving(true);
    await saveProfile(profile);
    setSaving(false);
    setSaved(true);
    haptic.success();
  }

  return (
    <ScreenContainer
      containerClassName="bg-transparent"
      edges={["top", "bottom", "left", "right"]}
      className="px-0"
    >
      <View style={styles.fill}>
        {/* ── Scrim ─────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
          style={styles.scrim}
        >
          <Pressable onPress={() => router.back()} style={styles.fullPress} />
        </Animated.View>

        {/* ── Drawer ─────────────────────────────────────────────────── */}
        <Animated.View
          entering={SlideInLeft.duration(240).reduceMotion(ReduceMotion.System)}
          style={styles.drawer}
        >
          {/* Header */}
          <View style={styles.drawerTop}>
            <Pressable
              accessibilityLabel="Fechar perfil"
              onPress={() => router.back()}
              style={styles.closeBtn}
            >
              <MaterialIcons name="close" color={brand.muted} size={22} />
            </Pressable>
            <BrandMark size={36} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Profile Header ───────────────────────────────────── */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarRing}>
                <Text style={styles.avatarText}>
                  {(profile.name || "AT").slice(0, 2).toUpperCase()}
                </Text>
                <View style={styles.proBadge}>
                  <Text style={styles.proText}>PRO</Text>
                </View>
              </View>
              <Text style={styles.name}>{profile.name || "Atleta"}</Text>
              <Text style={styles.planSub}>Perfil Atleta Otimizado</Text>
            </View>

            {/* ── Form Data ───────────────────────────────────────── */}
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="tune" size={16} color={brand.blueGlow} />
              <Text style={styles.sectionTitle}>Parâmetros Físicos</Text>
            </View>

            <Field
              label="Nome do Atleta"
              value={profile.name}
              onChangeText={(name) => {
                setProfile((current: UserProfile) => ({ ...current, name }));
                setSaved(false);
              }}
            />

            <View style={styles.row}>
              <Field
                label="Altura (cm)"
                value={String(profile.altura)}
                keyboardType="numeric"
                onChangeText={(value) => updateNumber("altura", value)}
              />
              <Field
                label="Peso (kg)"
                value={String(profile.peso)}
                keyboardType="decimal-pad"
                onChangeText={(value) => updateNumber("peso", value)}
              />
            </View>

            <View style={styles.row}>
              <Field
                label="Idade"
                value={String(profile.idade)}
                keyboardType="numeric"
                onChangeText={(value) => updateNumber("idade", value)}
              />
              <Field
                label="Frequência (dias/sem)"
                value={String(profile.vezes_por_semana)}
                keyboardType="numeric"
                onChangeText={(value) => updateNumber("vezes_por_semana", value)}
              />
            </View>

            <View style={styles.row}>
              <Field
                label="Tempo/Sessão (min)"
                value={String(profile.tempo)}
                keyboardType="numeric"
                onChangeText={(value) => updateNumber("tempo", value)}
              />
              <Field
                label="Nível Experiência"
                value={profile.nivel}
                onChangeText={(nivel) => {
                  setProfile((current: UserProfile) => ({ ...current, nivel }));
                  setSaved(false);
                }}
              />
            </View>

            <Field
              label="Objetivo Principal"
              value={profile.objetivo}
              onChangeText={(objetivo) => {
                setProfile((current: UserProfile) => ({ ...current, objetivo }));
                setSaved(false);
              }}
            />

            {/* ── Save Button ─────────────────────────────────────── */}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && styles.pressed,
                saving && styles.disabled,
              ]}
            >
              <MaterialIcons name={saved ? "check" : "save"} color={brand.text} size={18} />
              <Text style={styles.saveText}>
                {saving ? "Atualizando..." : saved ? "Dados Atualizados" : "Salvar Configurações"}
              </Text>
            </Pressable>

            {/* ── Navigation Links ─────────────────────────────────── */}
            <View style={styles.menuList}>
              {menu.map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => {
                    haptic.light();
                    if (item.label === "Meus Treinos" || item.label === "Histórico de Planos")
                      router.replace("/(tabs)/plans" as never);
                    if (item.label === "Montar Treino com IA")
                      router.replace("/(tabs)/chat" as never);
                  }}
                  style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
                >
                  <MaterialIcons name={item.icon} size={20} color={brand.blueGlow} />
                  <Text style={styles.menuText}>{item.label}</Text>
                  <MaterialIcons name="chevron-right" size={20} color={brand.dim} />
                </Pressable>
              ))}
            </View>

            {/* ── Logout Button ───────────────────────────────────── */}
            <Pressable
              onPress={() => router.replace("/")}
              style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
            >
              <MaterialIcons name="logout" size={20} color={brand.danger} />
              <Text style={styles.logoutText}>Encerrar Sessão</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "numeric" | "decimal-pad";
}) {
  return (
    <View style={styles.fieldBox}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={brand.dim}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: "transparent", flex: 1 },
  scrim: { backgroundColor: "rgba(0,0,0,0.65)", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  fullPress: { flex: 1 },
  drawer: {
    backgroundColor: brand.background,
    borderBottomRightRadius: 28,
    borderColor: brand.border,
    borderRightWidth: 1,
    borderTopRightRadius: 28,
    height: "100%",
    width: "90%",
  },
  drawerTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 10 },
  closeBtn: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  scrollView: { flex: 1, minHeight: 0, overflow: "scroll" },
  content: { gap: 14, padding: 18 },
  profileHeader: { alignItems: "center", marginVertical: 6 },
  avatarRing: {
    alignItems: "center",
    backgroundColor: brand.surfaceElevated,
    borderColor: brand.blueGlow,
    borderRadius: 40,
    borderWidth: 2,
    height: 72,
    justifyContent: "center",
    position: "relative",
    width: 72,
  },
  avatarText: { color: brand.text, fontSize: 20, fontWeight: "900" },
  proBadge: {
    backgroundColor: brand.blue,
    borderRadius: 4,
    bottom: -4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    position: "absolute",
  },
  proText: { color: brand.text, fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  name: { color: brand.text, fontSize: 20, fontWeight: "900", marginTop: 10 },
  planSub: { color: brand.muted, fontSize: 11, marginTop: 2 },
  sectionHeaderRow: { alignItems: "center", flexDirection: "row", gap: 6, marginTop: 4 },
  sectionTitle: { color: brand.text, fontSize: 14, fontWeight: "900" },
  row: { flexDirection: "row", gap: 10 },
  fieldBox: { flex: 1, gap: 5 },
  label: { color: brand.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  input: {
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 12,
    borderWidth: 1,
    color: brand.text,
    fontSize: 14,
    fontWeight: "600",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  saveBtn: {
    alignItems: "center",
    backgroundColor: brand.blue,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
    marginTop: 4,
  },
  saveText: { color: brand.text, fontSize: 14, fontWeight: "900" },
  disabled: { opacity: 0.5 },
  menuList: { borderColor: brand.border, borderTopWidth: 1, marginTop: 8, paddingTop: 4 },
  menuItem: {
    alignItems: "center",
    borderColor: brand.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 48,
  },
  menuText: { color: brand.text, flex: 1, fontSize: 13, fontWeight: "700" },
  logoutBtn: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 4,
  },
  logoutText: { color: brand.danger, fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});

