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

import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { brand } from "@/constants/brand";
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
          <View style={styles.coachAvatar}>
            <MaterialIcons name="bolt" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Coach</Text>
            <Text style={styles.subtitle}>Monta e ajusta seu treino</Text>
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
            <Text style={styles.planTitle}>Hipertrofia · 4 dias</Text>
            <View style={styles.planRows}>
              <PlanRow day="A" label="Peito, tríceps e ombro" />
              <PlanRow day="B" label="Costas e bíceps" />
              <PlanRow day="C" label="Pernas e panturrilha" />
              <PlanRow day="D" label="Ombros e core" />
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            <PrimaryButton
              label={generating ? "Gerando treino…" : "Gerar treino"}
              onPress={generate}
              disabled={generating}
              icon={<MaterialIcons name="auto-awesome" size={18} color="#FFFFFF" />}
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
            <MaterialIcons name="arrow-upward" color="#FFFFFF" size={20} />
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

function PlanRow({ day, label }: { day: string; label: string }) {
  return (
    <View style={styles.planRow}>
      <Text style={styles.dayText}>{day}</Text>
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
  coachAvatar: {
    alignItems: "center",
    backgroundColor: brand.accent,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerCopy: { flex: 1 },
  title: { color: brand.text, fontSize: 17, fontWeight: "600" },
  subtitle: { color: brand.muted, fontSize: 13, marginTop: 1 },
  iconBtn: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  messagesScroll: { flex: 1, minHeight: 0, overflow: "scroll" },
  messages: { gap: 10, paddingBottom: 16, paddingTop: 16 },
  messageRow: { flexDirection: "row" },
  messageRowUser: { justifyContent: "flex-end" },
  bubble: { borderRadius: 18, maxWidth: "82%", paddingHorizontal: 14, paddingVertical: 10 },
  coachBubble: { backgroundColor: brand.surface, borderBottomLeftRadius: 6 },
  userBubble: { backgroundColor: brand.accent, borderBottomRightRadius: 6 },
  bubbleText: { color: brand.text, fontSize: 15, lineHeight: 21 },
  userText: { color: "#FFFFFF" },
  planCard: { backgroundColor: brand.surface, borderRadius: 18, marginTop: 6, padding: 18 },
  planLabel: { color: brand.accentText, fontSize: 13, fontWeight: "600" },
  planTitle: { color: brand.text, fontSize: 18, fontWeight: "700", marginTop: 4 },
  planRows: { gap: 12, marginTop: 16 },
  planRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  dayText: { color: brand.muted, fontSize: 13, fontWeight: "600", width: 16 },
  planRowText: { color: brand.text, fontSize: 15 },
  planButton: { marginTop: 20 },
  error: { color: brand.danger, fontSize: 13, marginTop: 12 },
  presetScroll: { flexGrow: 0, marginHorizontal: -20 },
  presetRow: { gap: 8, paddingHorizontal: 20, paddingVertical: 8 },
  presetChip: {
    borderColor: brand.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  presetText: { color: brand.text, fontSize: 13 },
  composer: {
    alignItems: "center",
    backgroundColor: brand.surface,
    borderRadius: 24,
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    paddingLeft: 6,
    paddingRight: 5,
    paddingVertical: 5,
  },
  composerInput: { color: brand.text, flex: 1, fontSize: 15, minHeight: 40, paddingHorizontal: 12 },
  sendBtn: {
    alignItems: "center",
    backgroundColor: brand.accent,
    borderRadius: 19,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  sendDisabled: { backgroundColor: brand.surfaceElevated },
  pressed: { opacity: 0.7 },
});
