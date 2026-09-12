import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BrandMark } from "@/components/brand-mark";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { brand } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { getProfile } from "@/lib/profile";
import { generateWorkout, saveLastWorkout, workoutFromGeneratedDays } from "@/lib/workouts-api";

type Message = { id: string; from: "coach" | "user"; text: string };
const seed: Message[] = [
  { id: "1", from: "user", text: "Quero montar um treino para hipertrofia, 4x por semana." },
  { id: "2", from: "coach", text: "Ótimo. Qual seu nível de experiência, tempo disponível por sessão e alguma limitação física?" },
  { id: "3", from: "user", text: "Sou intermediário, tenho 1 hora por sessão e sem limitações." },
];

export default function ChatScreen() {
  const router = useRouter(); const [messages, setMessages] = useState(seed); const [input, setInput] = useState(""); const [generating, setGenerating] = useState(false); const [error, setError] = useState<string | null>(null); const scrollRef = useRef<ScrollView>(null);
  const userId = process.env.EXPO_PUBLIC_TREINO_USER_ID || "mobile-demo-user";
  function send() { const text = input.trim(); if (!text) return; haptic.light(); setMessages((current) => [...current, { id: String(Date.now()), from: "user", text }]); setInput(""); setMessages((current) => [...current, { id: String(Date.now() + 1), from: "coach", text: "Entendido. Quando estiver pronto, gere o plano abaixo para consultar o treino real." }]); }
  async function generate() { setGenerating(true); setError(null); try { const profile = await getProfile(); const payload = { ...profile, user_id: userId }; const days = await generateWorkout(payload); const workout = workoutFromGeneratedDays(days, payload); await saveLastWorkout(workout); router.push({ pathname: "/workout-detail", params: { workoutId: workout.id } }); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível gerar o treino."); } finally { setGenerating(false); } }
  return <ScreenContainer edges={["top", "left", "right"]} className="px-5">
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.fill}>
      <View style={styles.header}><BrandMark size={38} /><View style={styles.headerCopy}><Text style={styles.title}>Montar treino</Text><Text style={styles.online}>IA Coach <Text style={styles.dot}>• online</Text></Text></View><Pressable onPress={() => router.push("/profile")} style={styles.more}><MaterialIcons name="more-horiz" size={25} color={brand.muted} /></Pressable></View>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.messages} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}><Text style={styles.introText}>Conte seu objetivo. Eu monto um plano sob medida para você.</Text></View>
        {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
        <View style={styles.planCard}><View style={styles.planTop}><View><Text style={styles.planEyebrow}>PLANO SUGERIDO</Text><Text style={styles.planTitle}>Hipertrofia · 4x/semana</Text></View><BrandMark size={36} /></View><View style={styles.planRows}><PlanRow day="A" label="Peito e tríceps" /><PlanRow day="B" label="Costas e bíceps" /><PlanRow day="C" label="Pernas" /><PlanRow day="D" label="Ombros e core" /></View>{error && <Text style={styles.error}>{error}</Text>}<PrimaryButton label={generating ? "Gerando treino..." : "Gerar treino com IA"} variant="secondary" onPress={generate} disabled={generating} style={styles.planButton} /></View>
      </ScrollView>
      <View style={styles.composer}><TextInput value={input} onChangeText={setInput} onSubmitEditing={send} placeholder="Pergunte algo ao treinador..." placeholderTextColor={brand.dim} returnKeyType="send" style={styles.composerInput} /><Pressable accessibilityLabel="Enviar mensagem" onPress={send} style={({ pressed }) => [styles.send, pressed && styles.pressed]}><MaterialIcons name="arrow-upward" color={brand.text} size={22} /></Pressable></View>
    </KeyboardAvoidingView>
  </ScreenContainer>;
}

function MessageBubble({ message }: { message: Message }) { const coach = message.from === "coach"; return <View style={[styles.messageRow, !coach && styles.messageRowUser]}>{coach && <BrandMark size={28} />}{<View style={[styles.bubble, coach ? styles.coachBubble : styles.userBubble]}><Text style={[styles.bubbleText, !coach && styles.userText]}>{message.text}</Text></View>}</View>; }
function PlanRow({ day, label }: { day: string; label: string }) { return <View style={styles.planRow}><View style={styles.day}><Text style={styles.dayText}>{day}</Text></View><Text style={styles.planRowText}>{label}</Text></View>; }
const styles = StyleSheet.create({ fill: { flex: 1 }, header: { alignItems: "center", flexDirection: "row", gap: 10, minHeight: 62 }, headerCopy: { flex: 1 }, title: { color: brand.text, fontSize: 19, fontWeight: "900" }, online: { color: brand.muted, fontSize: 13, marginTop: 2 }, dot: { color: brand.blueLight }, more: { alignItems: "center", height: 40, justifyContent: "center", width: 40 }, messages: { gap: 14, paddingBottom: 20, paddingTop: 14 }, intro: { alignSelf: "center", backgroundColor: "#0E1420", borderRadius: 14, paddingHorizontal: 13, paddingVertical: 8 }, introText: { color: brand.muted, fontSize: 12 }, messageRow: { alignItems: "flex-end", flexDirection: "row", gap: 8 }, messageRowUser: { justifyContent: "flex-end" }, bubble: { borderRadius: 18, maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 12 }, coachBubble: { backgroundColor: brand.surface, borderColor: brand.border, borderWidth: 1, borderBottomLeftRadius: 5 }, userBubble: { backgroundColor: brand.blue, borderBottomRightRadius: 5 }, bubbleText: { color: brand.text, fontSize: 15, lineHeight: 21 }, userText: { color: brand.text }, planCard: { backgroundColor: brand.surface, borderColor: brand.border, borderRadius: 20, borderWidth: 1, marginTop: 4, padding: 16 }, planTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, planEyebrow: { color: brand.blueLight, fontSize: 10, fontWeight: "900", letterSpacing: 0.7 }, planTitle: { color: brand.text, fontSize: 17, fontWeight: "900", marginTop: 5 }, planRows: { gap: 10, marginTop: 16 }, planRow: { alignItems: "center", flexDirection: "row", gap: 10 }, day: { alignItems: "center", borderColor: brand.blue, borderRadius: 13, borderWidth: 1, height: 26, justifyContent: "center", width: 26 }, dayText: { color: brand.blueLight, fontSize: 12, fontWeight: "900" }, planRowText: { color: brand.text, fontSize: 14, fontWeight: "600" }, planButton: { marginTop: 18 }, error: { color: "#FF8F8F", fontSize: 12, lineHeight: 17, marginTop: 12 }, composer: { alignItems: "center", backgroundColor: brand.surface, borderColor: brand.border, borderRadius: 19, borderWidth: 1, flexDirection: "row", gap: 7, marginBottom: 12, padding: 6 }, composerInput: { color: brand.text, flex: 1, fontSize: 14, minHeight: 42, paddingHorizontal: 10 }, send: { alignItems: "center", backgroundColor: brand.blue, borderRadius: 15, height: 42, justifyContent: "center", width: 42 }, pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
});
