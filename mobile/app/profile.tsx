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
    setProfile((current) => ({
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
            <BrandMark size={40} />
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
              <Text style={styles.plan}>Perfil de treino personalizado</Text>
            </View>

            {/* ── Formulário ───────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Dados para a IA</Text>

            <Field
              label="Nome"
              value={profile.name}
              onChangeText={(name) => {
                setProfile((current) => ({ ...current, name }));
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
                  setProfile((current) => ({ ...current, nivel }));
                  setSaved(false);
                }}
              />
            </View>

            <Field
              label="Objetivo"
              value={profile.objetivo}
              onChangeText={(objetivo) => {
                setProfile((current) => ({ ...current, objetivo }));
                setSaved(false);
              }}
            />

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
              <MaterialIcons name="save" color={brand.text} size={19} />
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
                  }}
                  style={({ pressed }) => [styles.item, pressed && styles.pressed]}
                >
                  <MaterialIcons name={item.icon} size={22} color={brand.blueLight} />
                  <Text style={styles.itemText}>{item.label}</Text>
                  <MaterialIcons name="chevron-right" size={21} color={brand.dim} />
                </Pressable>
              ))}
            </View>

            {/* ── Logout ───────────────────────────────────────────── */}
            <Pressable
              onPress={() => router.replace("/")}
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
  scrim: { backgroundColor: "rgba(0,0,0,0.52)", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  fullPress: { flex: 1 },
  drawer: { backgroundColor: brand.background, borderBottomRightRadius: 28, borderTopRightRadius: 28, height: "100%", width: "92%" },
  drawerTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 8 },
  close: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  content: { gap: 15, padding: 20 },
  profile: { alignItems: "center" },
  avatar: { alignItems: "center", backgroundColor: brand.blueSoft, borderColor: brand.blue, borderRadius: 44, borderWidth: 2, height: 78, justifyContent: "center", width: 78 },
  avatarText: { color: brand.text, fontSize: 21, fontWeight: "900" },
  name: { color: brand.text, fontSize: 22, fontWeight: "900", marginTop: 10 },
  plan: { color: brand.muted, fontSize: 12, marginTop: 4 },
  sectionTitle: { color: brand.text, fontSize: 17, fontWeight: "900", marginTop: 5 },
  row: { flexDirection: "row", gap: 10 },
  field: { flex: 1, gap: 6 },
  label: { color: brand.muted, fontSize: 11, fontWeight: "700" },
  input: { backgroundColor: brand.surface, borderColor: brand.border, borderRadius: 12, borderWidth: 1, color: brand.text, fontSize: 14, minHeight: 42, paddingHorizontal: 11 },
  save: { alignItems: "center", backgroundColor: brand.blue, borderRadius: 14, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 48 },
  saveText: { color: brand.text, fontSize: 14, fontWeight: "900" },
  disabled: { opacity: 0.55 },
  list: { borderTopColor: brand.border, borderTopWidth: 1, marginTop: 4 },
  item: { alignItems: "center", borderBottomColor: brand.border, borderBottomWidth: 1, flexDirection: "row", gap: 14, minHeight: 52 },
  itemText: { color: brand.text, flex: 1, fontSize: 14, fontWeight: "700" },
  logout: { alignItems: "center", flexDirection: "row", gap: 13, minHeight: 50, paddingHorizontal: 4 },
  logoutText: { color: brand.danger, fontSize: 15, fontWeight: "800" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
