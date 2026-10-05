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
    text: "Perfeito. Analisei seu perfil. Nível intermediário, 60 minutos por sessão. Montei uma divisão AB-CD para otimizar recuperação e volume por grupo muscular.",
  },
];

const presets = [
  "Hipertrofia 4x/semana",
  "Treino de Força 3x",
  "Definição Muscular 5x",
];

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
          text: "Objetivo registrado na Engine IA. Clique em 'Gerar Treino com IA' para compilar as séries e exercícios.",
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.fill}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <BrandMark size={40} />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Coach IA</Text>
            <View style={styles.statusRow}>
              <View style={styles.activeDot} />
              <Text style={styles.statusText}>ENGINE HIPERTROF.IA ONLINE</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push("/profile")} style={styles.moreBtn}>
            <MaterialIcons name="settings" size={22} color={brand.muted} />
          </Pressable>
        </View>

        {/* ── Quick Presets ─────────────────────────────────────────── */}
        <View style={styles.presetRow}>
          {presets.map((preset) => (
            <Pressable
              key={preset}
              onPress={() => send(preset)}
              style={({ pressed }) => [styles.presetChip, pressed && styles.pressed]}
            >
              <MaterialIcons name="bolt" size={12} color={brand.blueGlow} />
              <Text style={styles.presetText}>{preset}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Messages Container ─────────────────────────────────────── */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introCard}>
            <MaterialIcons name="psychology" size={20} color={brand.blueGlow} />
            <Text style={styles.introText}>
              Descreva seu objetivo de treino. A IA compila um protocolo com repetições, carga e tempo de descanso.
            </Text>
          </View>

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* ── Plan Card ────────────────────────────────────────────── */}
          <View style={styles.planCard}>
            <View style={styles.planTop}>
              <View>
                <Text style={styles.planEyebrow}>SUGESTÃO DE ESTRUTURA</Text>
                <Text style={styles.planTitle}>Hipertrofia A/B/C/D · 4 Dias</Text>
              </View>
              <BrandMark size={34} />
            </View>
            <View style={styles.planRows}>
              <PlanRow day="A" label="Peito, Tríceps & Ombro Frontal" />
              <PlanRow day="B" label="Costas, Bíceps & Deltoide Posterior" />
              <PlanRow day="C" label="Membros Inferiores & Panturrilha" />
              <PlanRow day="D" label="Ombros Completo, Core & Funcional" />
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            <PrimaryButton
              label={generating ? "Compilando exercícios..." : "Gerar Treino com IA"}
              variant="accent"
              onPress={generate}
              disabled={generating}
              icon={<MaterialIcons name="auto-awesome" size={18} color={brand.blueGlow} />}
              style={styles.planButton}
            />
          </View>
        </ScrollView>

        {/* ── Composer ───────────────────────────────────────────────── */}
        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            placeholder="Digite seu objetivo ou ajuste de treino..."
            placeholderTextColor={brand.dim}
            returnKeyType="send"
            style={styles.composerInput}
          />
          <Pressable
            accessibilityLabel="Enviar mensagem"
            onPress={() => send()}
            style={({ pressed }) => [styles.sendBtn, pressed && styles.pressed]}
          >
            <MaterialIcons name="arrow-upward" color={brand.text} size={20} />
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
      {isCoach && (
        <View style={styles.coachAvatar}>
          <MaterialIcons name="bolt" size={16} color={brand.blueGlow} />
        </View>
      )}
      <View style={[styles.bubble, isCoach ? styles.coachBubble : styles.userBubble]}>
        <Text style={[styles.bubbleText, !isCoach && styles.userText]}>{message.text}</Text>
      </View>
    </View>
  );
}

function PlanRow({ day, label }: { day: string; label: string }) {
  return (
    <View style={styles.planRow}>
      <View style={styles.dayBadge}>
        <Text style={styles.dayText}>{day}</Text>
      </View>
      <Text style={styles.planRowText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 60 },
  headerCopy: { flex: 1 },
  title: { color: brand.text, fontSize: 19, fontWeight: "900" },
  statusRow: { alignItems: "center", flexDirection: "row", gap: 6, marginTop: 2 },
  activeDot: { backgroundColor: brand.success, borderRadius: 4, height: 6, width: 6 },
  statusText: { color: brand.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  moreBtn: { alignItems: "center", height: 38, justifyContent: "center", width: 38 },
  presetRow: { flexDirection: "row", gap: 8, marginVertical: 8 },
  presetChip: {
    alignItems: "center",
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  presetText: { color: brand.muted, fontSize: 11, fontWeight: "700" },
  messages: { gap: 14, paddingBottom: 20, paddingTop: 10 },
  introCard: {
    alignItems: "center",
    backgroundColor: "rgba(0, 240, 255, 0.06)",
    borderColor: "rgba(0, 240, 255, 0.2)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  introText: { color: brand.muted, flex: 1, fontSize: 12, lineHeight: 17 },
  messageRow: { alignItems: "flex-end", flexDirection: "row", gap: 8 },
  messageRowUser: { justifyContent: "flex-end" },
  coachAvatar: {
    alignItems: "center",
    backgroundColor: brand.surfaceElevated,
    borderColor: brand.borderHighlight,
    borderRadius: 12,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  bubble: { borderRadius: 18, maxWidth: "80%", paddingHorizontal: 14, paddingVertical: 12 },
  coachBubble: {
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  userBubble: { backgroundColor: brand.blue, borderBottomRightRadius: 4 },
  bubbleText: { color: brand.text, fontSize: 14, lineHeight: 20 },
  userText: { color: brand.text, fontWeight: "600" },
  planCard: {
    backgroundColor: brand.surfaceCard,
    borderColor: brand.borderHighlight,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 6,
    padding: 18,
  },
  planTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  planEyebrow: { color: brand.blueGlow, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  planTitle: { color: brand.text, fontSize: 16, fontWeight: "900", marginTop: 3 },
  planRows: { gap: 10, marginTop: 14 },
  planRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  dayBadge: {
    alignItems: "center",
    backgroundColor: "rgba(0, 240, 255, 0.1)",
    borderColor: brand.blueGlow,
    borderRadius: 8,
    borderWidth: 1,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  dayText: { color: brand.blueGlow, fontSize: 12, fontWeight: "900" },
  planRowText: { color: brand.text, fontSize: 13, fontWeight: "600" },
  planButton: { marginTop: 16 },
  error: { color: brand.danger, fontSize: 12, marginTop: 10 },
  composer: {
    alignItems: "center",
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    padding: 6,
  },
  composerInput: { color: brand.text, flex: 1, fontSize: 14, minHeight: 42, paddingHorizontal: 12 },
  sendBtn: {
    alignItems: "center",
    backgroundColor: brand.blue,
    borderRadius: 16,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
});

