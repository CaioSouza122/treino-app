import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { brand } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { defaultProfile, getProfile, saveProfile, type UserProfile } from "@/lib/profile";

type NumericField = "altura" | "peso" | "idade" | "vezes_por_semana" | "tempo";

const levels = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];

const goals = [
  { value: "hipertrofia", label: "Hipertrofia" },
  { value: "forca", label: "Força" },
  { value: "definicao", label: "Definição" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile().then(setProfile).catch(() => setProfile(defaultProfile));
  }, []);

  function update(patch: Partial<UserProfile>) {
    setProfile((current) => ({ ...current, ...patch }));
    setSaved(false);
  }

  function updateNumber(field: NumericField, value: string) {
    const numeric = Number(value.replace(",", "."));
    update({ [field]: Number.isFinite(numeric) ? numeric : 0 });
  }

  const valid = Boolean(
    profile.altura && profile.peso && profile.idade && profile.vezes_por_semana && profile.tempo && profile.objetivo && profile.nivel,
  );

  async function handleSave() {
    if (!valid) return;
    setSaving(true);
    await saveProfile(profile);
    setSaving(false);
    setSaved(true);
    haptic.success();
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
      <ScreenHeader title="Perfil" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(profile.name || "A").slice(0, 1).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{profile.name || "Atleta"}</Text>
        </View>

        <Section title="Dados pessoais">
          <Field label="Nome" value={profile.name} onChangeText={(name) => update({ name })} />
          <View style={styles.row}>
            <Field label="Idade" suffix="anos" value={String(profile.idade)} keyboardType="numeric" onChangeText={(v) => updateNumber("idade", v)} />
            <Field label="Altura" suffix="cm" value={String(profile.altura)} keyboardType="numeric" onChangeText={(v) => updateNumber("altura", v)} />
            <Field label="Peso" suffix="kg" value={String(profile.peso)} keyboardType="decimal-pad" onChangeText={(v) => updateNumber("peso", v)} />
          </View>
        </Section>

        <Section title="Treino">
          <View style={styles.row}>
            <Field label="Dias por semana" value={String(profile.vezes_por_semana)} keyboardType="numeric" onChangeText={(v) => updateNumber("vezes_por_semana", v)} />
            <Field label="Duração" suffix="min" value={String(profile.tempo)} keyboardType="numeric" onChangeText={(v) => updateNumber("tempo", v)} />
          </View>
          <Choice label="Nível" options={levels} value={profile.nivel} onChange={(nivel) => update({ nivel })} />
          <Choice label="Objetivo" options={goals} value={profile.objetivo} onChange={(objetivo) => update({ objetivo })} />
        </Section>

        <PrimaryButton
          label={saving ? "Salvando…" : saved ? "Alterações salvas" : "Salvar alterações"}
          onPress={handleSave}
          disabled={saving || !valid}
          variant={saved ? "secondary" : "primary"}
          icon={saved ? <MaterialIcons name="check" size={18} color={brand.success} /> : undefined}
        />

        <View style={styles.list}>
          <ListItem icon="format-list-bulleted" label="Meus treinos" onPress={() => router.replace("/(tabs)/plans" as never)} />
          <ListItem icon="chat-bubble-outline" label="Falar com o Coach" onPress={() => router.replace("/(tabs)/chat" as never)} last />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/")}
          style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
        >
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  suffix,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  suffix?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor={brand.dim}
          style={styles.input}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function Choice({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.segmented}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => {
                haptic.light();
                onChange(option.value);
              }}
              style={[styles.segment, active && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ListItem({
  icon,
  label,
  onPress,
  last,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => [styles.listItem, !last && styles.listBorder, pressed && styles.listPressed]}
    >
      <MaterialIcons name={icon} size={20} color={brand.muted} />
      <Text style={styles.listText}>{label}</Text>
      <MaterialIcons name="chevron-right" size={20} color={brand.dim} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, minHeight: 0, overflow: "scroll" },
  content: { gap: 28, paddingBottom: 32, paddingTop: 8 },
  identity: { alignItems: "center", gap: 12 },
  avatar: {
    alignItems: "center",
    backgroundColor: brand.surfaceElevated,
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  avatarText: { color: brand.text, fontSize: 28, fontWeight: "600" },
  name: { color: brand.text, fontSize: 20, fontWeight: "700" },
  section: { gap: 14 },
  sectionTitle: { color: brand.text, fontSize: 17, fontWeight: "600" },
  row: { flexDirection: "row", gap: 10 },
  field: { flex: 1, gap: 6 },
  label: { color: brand.muted, fontSize: 13 },
  inputWrap: {
    alignItems: "center",
    backgroundColor: brand.surface,
    borderColor: brand.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  input: { color: brand.text, flex: 1, fontSize: 15, minWidth: 0, paddingVertical: 10 },
  suffix: { color: brand.dim, fontSize: 13, marginLeft: 4 },
  segmented: { backgroundColor: brand.surface, borderRadius: 12, flexDirection: "row", gap: 4, padding: 4 },
  segment: { alignItems: "center", borderRadius: 9, flex: 1, justifyContent: "center", minHeight: 38 },
  segmentActive: { backgroundColor: brand.surfaceElevated },
  segmentText: { color: brand.muted, fontSize: 13, fontWeight: "500" },
  segmentTextActive: { color: brand.text, fontWeight: "600" },
  list: { backgroundColor: brand.surface, borderRadius: 16, overflow: "hidden" },
  listItem: { alignItems: "center", flexDirection: "row", gap: 14, minHeight: 54, paddingHorizontal: 16 },
  listBorder: { borderBottomColor: brand.border, borderBottomWidth: StyleSheet.hairlineWidth },
  listPressed: { backgroundColor: brand.surfaceElevated },
  listText: { color: brand.text, flex: 1, fontSize: 15 },
  logout: { alignItems: "center", minHeight: 44, justifyContent: "center" },
  logoutText: { color: brand.danger, fontSize: 15, fontWeight: "500" },
  pressed: { opacity: 0.7 },
});
