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
import { Label, SectionHead } from "@/components/ui";
import { brand, font, radius, type } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { defaultProfile, enviarPerfil, getProfile, saveProfile, type UserProfile } from "@/lib/profile";
import { encerrarSessao } from "@/lib/session";

const menu = [
  { icon: "fitness-center", label: "Meus treinos" },
  { icon: "auto-awesome", label: "Montar treino com IA" },
  { icon: "history", label: "Histórico" },
  { icon: "bar-chart", label: "Progresso" },
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
      !profile.nivel
    )
      return;
    setSaving(true);
    await saveProfile(profile);
    // Guarda também na conta; sem rede, os dados ficam no aparelho e vão no próximo salvar
    await enviarPerfil(profile).catch(() => {});
    setSaving(false);
    setSaved(true);
    haptic.success();
  }

  return (
    <ScreenContainer
      transparent
      edges={["top", "bottom", "left", "right"]}
      padded={false}
    >
      <View style={styles.fill}>
        {/* ── Scrim (fundo escuro clicável para fechar) ─────────────── */}
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
          {/* Cabeçalho do drawer */}
          <View style={styles.drawerTop}>
            <Pressable
              accessibilityLabel="Fechar perfil"
              onPress={() => router.back()}
              style={styles.close}
            >
              <MaterialIcons name="close" color={brand.muted} size={22} />
            </Pressable>
            <BrandMark size={32} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Avatar ───────────────────────────────────────────── */}
            <View style={styles.profile}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile.name.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.name}>{profile.name || "Seu perfil"}</Text>
              <Label>Perfil de treino</Label>
            </View>

            {/* ── Formulário ───────────────────────────────────────── */}
            <SectionHead title="Dados para a IA" />

            <Field
              label="Nome"
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
                label="Dias/semana"
                value={String(profile.vezes_por_semana)}
                keyboardType="numeric"
                onChangeText={(value) => updateNumber("vezes_por_semana", value)}
              />
            </View>

            <View style={styles.row}>
              <Field
                label="Tempo (min)"
                value={String(profile.tempo)}
                keyboardType="numeric"
                onChangeText={(value) => updateNumber("tempo", value)}
              />
              <Field
                label="Nível"
                value={profile.nivel}
                onChangeText={(nivel) => {
                  setProfile((current: UserProfile) => ({ ...current, nivel }));
                  setSaved(false);
                }}
              />
            </View>

            {/* O objetivo é perguntado pelo Coach IA, na aba IA */}

            {/* ── Botão salvar ─────────────────────────────────────── */}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [
                styles.save,
                pressed && styles.pressed,
                saving && styles.disabled,
              ]}
            >
              <MaterialIcons name="check" color={brand.onLime} size={19} />
              <Text style={styles.saveText}>
                {saving ? "Salvando..." : saved ? "Perfil salvo" : "Salvar perfil"}
              </Text>
            </Pressable>

            {/* ── Menu de navegação ─────────────────────────────────── */}
            <View style={styles.list}>
              {menu.map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => {
                    haptic.light();
                    if (item.label === "Meus treinos" || item.label === "Histórico")
                      router.replace("/(tabs)/plans" as never);
                    if (item.label === "Montar treino com IA")
                      router.replace("/(tabs)/chat" as never);
                    if (item.label === "Configurações") router.push("/settings" as never);
                  }}
                  style={({ pressed }) => [styles.item, pressed && styles.pressed]}
                >
                  <MaterialIcons name={item.icon} size={20} color={brand.cyan} />
                  <Text style={styles.itemText}>{item.label}</Text>
                  <MaterialIcons name="chevron-right" size={21} color={brand.dim} />
                </Pressable>
              ))}
            </View>

            {/* ── Logout ───────────────────────────────────────────── */}
            <Pressable
              onPress={async () => {
                haptic.light();
                await encerrarSessao();
                router.replace("/login");
              }}
              style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
            >
              <MaterialIcons name="logout" size={21} color={brand.danger} />
              <Text style={styles.logoutText}>Sair da conta</Text>
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
    <View style={styles.field}>
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
  scrim: { backgroundColor: "rgba(0,0,0,0.6)", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  fullPress: { flex: 1 },
  drawer: { backgroundColor: brand.background, borderRightColor: brand.border, borderRightWidth: 1, height: "100%", width: "92%" },
  drawerTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 8 },
  close: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  content: { gap: 16, padding: 20 },
  profile: { alignItems: "center", gap: 8 },
  avatar: { alignItems: "center", borderColor: brand.lime, borderRadius: radius.md, borderWidth: 1.5, height: 72, justifyContent: "center", width: 72 },
  avatarText: { color: brand.text, fontFamily: font.display, fontSize: 22, letterSpacing: 0.6 },
  name: { ...type.h2, marginTop: 6 },
  row: { flexDirection: "row", gap: 10 },
  field: { flex: 1, gap: 7 },
  label: { ...type.label, fontSize: 10 },
  input: { backgroundColor: brand.surface, borderColor: brand.borderStrong, borderRadius: radius.sm + 2, borderWidth: 1, color: brand.text, fontSize: 15, minHeight: 44, paddingHorizontal: 12 },
  save: { alignItems: "center", backgroundColor: brand.lime, borderRadius: radius.md, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 50 },
  saveText: { color: brand.onLime, fontFamily: font.display, fontSize: 13, letterSpacing: 1.2, textTransform: "uppercase" },
  disabled: { opacity: 0.5 },
  list: { borderTopColor: brand.border, borderTopWidth: 1, marginTop: 6 },
  item: { alignItems: "center", borderBottomColor: brand.border, borderBottomWidth: 1, flexDirection: "row", gap: 14, minHeight: 54 },
  itemText: { color: brand.text, flex: 1, fontSize: 15, fontWeight: "600" },
  logout: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 50, paddingHorizontal: 2 },
  logoutText: { color: brand.danger, fontSize: 14.5, fontWeight: "700" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
