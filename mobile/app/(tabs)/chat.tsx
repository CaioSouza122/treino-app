import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { BrandMark } from "@/components/brand-mark";
import { Plate } from "@/components/plate";
import { buttonInk, PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { brand, fonts } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { getProfile } from "@/lib/profile";
import { generateWorkout, saveLastWorkout, workoutFromGeneratedDays } from "@/lib/workouts-api";

type Message = { id: string; from: "coach" | "user"; text: string };

const seed: Message[] = [
  { id: "1", from: "user", text: "Quero montar um treino focado em hipertrofia, 4x por semana." },
  {
    id: "2",
    from: "coach",
    text: "Perfeito. Pelo seu perfil (intermediário, 60 min por sessão), sugiro uma divisão em 4 dias para equilibrar volume e recuperação.",
  },
];

const presets = ["Hipertrofia 4x por semana", "Força 3x por semana", "Treino de 45 minutos", "Foco em pernas"];

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(seed);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const userId = process.env.EXPO_PUBLIC_TREINO_USER_ID || "mobile-demo-user";

  function send(customText?: string) {
    const text = (customText || input).trim();
    if (!text) return;
    haptic.light();
    setMessages((current) => [...current, { id: String(Date.now()), from: "user", text }]);
    if (!customText) setInput("");

    setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: String(Date.now() + 1),
          from: "coach",
          text: "Anotado. Quando estiver pronto, toque em \"Gerar treino\" e eu monto as séries e exercícios.",
        },
      ]);
    }, 400);
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const profile = await getProfile();
      const payload = { ...profile, user_id: userId };
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
    <ScreenContainer edges={["top", "left", "right"]} className="px-5">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.fill}>
        <View style={styles.header}>
          <BrandMark size={38} />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Coach</Text>
            <Text style={styles.subtitle}>Monta e ajusta seu plano</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
            onPress={() => router.push("/profile")}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <MaterialIcons name="person-outline" size={22} color={brand.muted} />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          <View style={styles.planCard}>
            <Text style={styles.planLabel}>Plano sugerido</Text>
            <Text style={styles.planTitle}>Hipertrofia em 4 dias</Text>
            <View style={styles.planRows}>
              <PlanRow index={0} label="Peito, tríceps e ombro" />
              <PlanRow index={1} label="Costas e bíceps" />
              <PlanRow index={2} label="Pernas e panturrilha" />
              <PlanRow index={3} label="Ombros e core" />
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            <PrimaryButton
              label={generating ? "Gerando treino…" : "Gerar treino"}
              onPress={generate}
              disabled={generating}
              icon={<MaterialIcons name="auto-awesome" size={18} color={buttonInk.primary} />}
              style={styles.planButton}
            />
          </View>
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.presetScroll}
          contentContainerStyle={styles.presetRow}
        >
          {presets.map((preset) => (
            <Pressable
              key={preset}
              onPress={() => send(preset)}
              style={({ pressed }) => [styles.presetChip, pressed && styles.pressed]}
            >
              <Text style={styles.presetText}>{preset}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            placeholder="Escreva uma mensagem"
            placeholderTextColor={brand.dim}
            returnKeyType="send"
            style={styles.composerInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem"
            disabled={!input.trim()}
            onPress={() => send()}
            style={({ pressed }) => [styles.sendBtn, !input.trim() && styles.sendDisabled, pressed && styles.pressed]}
          >
            <MaterialIcons name="arrow-upward" color={input.trim() ? brand.background : brand.muted} size={20} />
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

function PlanRow({ index, label }: { index: number; label: string }) {
  return (
    <View style={styles.planRow}>
      <Plate index={index} size={30} />
      <Text style={styles.planRowText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    alignItems: "center",
    borderBottomColor: brand.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    marginHorizontal: -20,
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerCopy: { flex: 1 },
  title: { color: brand.text, fontFamily: fonts.display, fontSize: 26, lineHeight: 28 },
  subtitle: { color: brand.muted, fontFamily: fonts.body, fontSize: 14 },
  iconBtn: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  messagesScroll: { flex: 1, minHeight: 0, overflow: "scroll" },
  messages: { gap: 10, paddingBottom: 16, paddingTop: 16 },
  messageRow: { flexDirection: "row" },
  messageRowUser: { justifyContent: "flex-end" },
  bubble: { borderRadius: 16, maxWidth: "84%", paddingHorizontal: 14, paddingVertical: 10 },
  coachBubble: { backgroundColor: brand.surface, borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: brand.accent, borderTopRightRadius: 4 },
  bubbleText: { color: brand.text, fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
  userText: { color: brand.background, fontFamily: fonts.medium },
  planCard: { borderColor: brand.borderStrong, borderRadius: 18, borderWidth: 1.5, marginTop: 8, padding: 18 },
  planLabel: { color: brand.muted, fontFamily: fonts.medium, fontSize: 14 },
  planTitle: { color: brand.text, fontFamily: fonts.display, fontSize: 28, lineHeight: 30, marginTop: 2 },
  planRows: { gap: 10, marginTop: 16 },
  planRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  planRowText: { color: brand.text, fontFamily: fonts.medium, fontSize: 16 },
  planButton: { marginTop: 20 },
  error: { color: brand.danger, fontFamily: fonts.body, fontSize: 14, marginTop: 12 },
  presetScroll: { flexGrow: 0, marginHorizontal: -20 },
  presetRow: { gap: 8, paddingHorizontal: 20, paddingVertical: 8 },
  presetChip: {
    borderColor: brand.borderStrong,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  presetText: { color: brand.text, fontFamily: fonts.medium, fontSize: 14 },
  composer: {
    alignItems: "center",
    backgroundColor: brand.surface,
    borderRadius: 26,
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    paddingLeft: 6,
    paddingRight: 5,
    paddingVertical: 5,
  },
  composerInput: { color: brand.text, flex: 1, fontFamily: fonts.body, fontSize: 16, minHeight: 42, paddingHorizontal: 12 },
  sendBtn: {
    alignItems: "center",
    backgroundColor: brand.accent,
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  sendDisabled: { backgroundColor: brand.surfaceElevated },
  pressed: { opacity: 0.7 },
});
