import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { BrandMark } from "@/components/brand-mark";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { Label } from "@/components/ui";
import { brand, font, radius, type } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { defaultProfile, getProfile, type UserProfile } from "@/lib/profile";
import { generateWorkout, saveLastWorkout, workoutFromGeneratedDays } from "@/lib/workouts-api";

type Message = { id: string; from: "coach" | "user"; text: string };

const greeting: Message = {
  id: "greeting",
  from: "coach",
  text: "Conte seu objetivo, nível e qualquer limitação. Quando estiver pronto, gere o plano com base no seu perfil.",
};

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [input, setInput] = useState("");
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      getProfile().then(setProfile).catch(() => setProfile(defaultProfile));
    }, []),
  );

  function send() {
    const text = input.trim();
    if (!text) return;
    haptic.light();
    const stamp = Date.now();
    setMessages((current) => [
      ...current,
      { id: String(stamp), from: "user", text },
      {
        id: String(stamp + 1),
        from: "coach",
        text: "Entendido. Quando estiver pronto, gere o plano abaixo para consultar o treino real.",
      },
    ]);
    setInput("");
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const current = await getProfile();
      const payload = { ...current };
      const days = await generateWorkout(payload);
      const workout = workoutFromGeneratedDays(days, payload);
      await saveLastWorkout(workout);
      router.push({ pathname: "/workout-detail", params: { workoutId: workout.id } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar o treino.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.fill}>
        {/* ── Topo ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <BrandMark size={30} />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Coach IA</Text>
            <Label color={brand.cyan}>Montar treino</Label>
          </View>
          <Pressable accessibilityLabel="Abrir perfil" onPress={() => router.push("/profile" as never)} style={styles.more}>
            <MaterialIcons name="tune" size={22} color={brand.muted} />
          </Pressable>
        </View>

        {/* ── Conversa ─────────────────────────────────────────────── */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* ── Plano a gerar (dados reais do perfil) ──────────────── */}
          <View style={styles.planCard}>
            <Label color={brand.lime}>Plano a gerar</Label>
            <Text style={styles.planTitle}>{profile.objetivo}</Text>
            <View style={styles.planGrid}>
              <PlanItem label="Dias" value={`${profile.vezes_por_semana}x por semana`} />
              <PlanItem label="Duração" value={`${profile.tempo} min`} />
              <PlanItem label="Nível" value={capitalize(profile.nivel)} />
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            <PrimaryButton
              label={generating ? "Gerando…" : "Gerar treino"}
              onPress={generate}
              disabled={generating}
              icon={<MaterialIcons name="auto-awesome" size={18} color={brand.onLime} />}
              style={styles.planButton}
            />
            <Pressable onPress={() => router.push("/profile" as never)} style={styles.editLink}>
              <Text style={styles.editLinkText}>Ajustar dados do perfil</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* ── Campo de mensagem ────────────────────────────────────── */}
        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Mensagem"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            placeholder="Escreva para o treinador…"
            placeholderTextColor={brand.dim}
            returnKeyType="send"
            style={styles.composerInput}
          />
          <Pressable accessibilityLabel="Enviar mensagem" onPress={send} style={({ pressed }) => [styles.send, pressed && styles.pressed]}>
            <MaterialIcons name="arrow-upward" color={brand.onLime} size={20} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isCoach = message.from === "coach";
  return (
    <View style={[styles.messageRow, !isCoach && styles.messageRowUser]}>
      <View style={[styles.bubble, isCoach ? styles.coachBubble : styles.userBubble]}>
        <Text style={[styles.bubbleText, !isCoach && styles.userText]}>{message.text}</Text>
      </View>
    </View>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function PlanItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.planItem}>
      <Text style={styles.planItemLabel}>{label}</Text>
      <Text style={styles.planItemValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 60 },
  headerCopy: { flex: 1, gap: 3 },
  title: { ...type.title, fontSize: 17 },
  more: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  messages: { gap: 12, paddingBottom: 20, paddingTop: 12 },
  messageRow: { flexDirection: "row" },
  messageRowUser: { justifyContent: "flex-end" },
  bubble: { borderRadius: radius.lg, maxWidth: "84%", paddingHorizontal: 14, paddingVertical: 11 },
  coachBubble: { backgroundColor: brand.surface, borderColor: brand.border, borderBottomLeftRadius: 4, borderWidth: 1 },
  userBubble: { backgroundColor: brand.raised, borderBottomRightRadius: 4, borderColor: brand.borderStrong, borderWidth: 1 },
  bubbleText: { color: brand.text, fontSize: 14.5, lineHeight: 21 },
  userText: { color: brand.text },
  planCard: { backgroundColor: brand.surface, borderColor: brand.borderStrong, borderRadius: radius.lg, borderWidth: 1, gap: 12, marginTop: 8, padding: 18 },
  planTitle: { ...type.h2, fontSize: 24, lineHeight: 29, textTransform: "capitalize" },
  planGrid: { flexDirection: "row", gap: 8 },
  planItem: { borderColor: brand.border, borderRadius: radius.sm, borderWidth: 1, flex: 1, gap: 3, padding: 10 },
  planItemLabel: { ...type.label, fontSize: 9 },
  planItemValue: { color: brand.text, fontFamily: font.displayMedium, fontSize: 13 },
  planButton: { marginTop: 4 },
  editLink: { alignItems: "center", paddingVertical: 4 },
  editLinkText: { color: brand.muted, fontSize: 12.5, textDecorationLine: "underline" },
  error: { color: brand.danger, fontSize: 12.5, lineHeight: 18 },
  composer: { alignItems: "center", backgroundColor: brand.surface, borderColor: brand.borderStrong, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: 8, marginBottom: 12, padding: 5 },
  composerInput: { color: brand.text, flex: 1, fontSize: 14.5, minHeight: 42, paddingHorizontal: 10 },
  send: { alignItems: "center", backgroundColor: brand.lime, borderRadius: radius.sm, height: 40, justifyContent: "center", width: 40 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
});
