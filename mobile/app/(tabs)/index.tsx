import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { BrandMark } from "@/components/brand-mark";
import { ScreenContainer } from "@/components/screen-container";
import { Label } from "@/components/ui";
import { brand, font, radius, type } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { getUsuario } from "@/lib/session";
import { liberarTela, manterTelaAcesa } from "@/lib/tela-acesa";
import { acordarServidores, conversar, lerConversa, salvarConversa, type Mensagem } from "@/lib/workouts-api";

const SUGESTOES = ["Monte um treino para mim", "Como ganhar massa muscular?", "O que comer antes do treino?"];

export default function CoachScreen() {
  const router = useRouter();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [nome, setNome] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    lerConversa().then(setMensagens);
    getUsuario()
      .then((usuario) => setNome(usuario?.nome.trim().split(" ")[0] ?? null))
      .catch(() => {});
  }, []);

  // O app pode ter ficado em segundo plano tempo bastante para o Render dormir de novo
  useFocusEffect(useCallback(() => acordarServidores(), []));

  async function enviar(texto: string) {
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;
    haptic.light();
    const conversa: Mensagem[] = [...mensagens, { id: `u-${Date.now()}`, papel: "usuario", texto: conteudo }];
    setMensagens(conversa);
    setInput("");
    setEnviando(true);
    // Com a tela apagada o Android corta a rede do app no meio da resposta
    manterTelaAcesa("coach");
    let resposta: Mensagem;
    try {
      const r = await conversar(conversa);
      resposta = { id: `ia-${Date.now()}`, papel: "ia", texto: r.resposta, treinoId: r.treino_id ?? undefined };
    } catch (cause) {
      const texto = cause instanceof Error ? cause.message : "Não consegui responder agora. Tente de novo.";
      resposta = { id: `ia-${Date.now()}`, papel: "ia", texto, erro: true };
    } finally {
      liberarTela("coach");
      setEnviando(false);
    }
    const final = [...conversa, resposta];
    setMensagens(final);
    await salvarConversa(final);
  }

  async function novaConversa() {
    if (enviando) return;
    setMensagens([]);
    await salvarConversa([]);
  }

  const saudacao =
    `Olá${nome ? `, ${nome}` : ""}! Sou seu Coach IA. Posso montar seu treino, ajustar o plano, ` +
    "tirar dúvidas sobre exercícios, alimentação e recuperação. Como posso ajudar?";

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.fill}>
        <View style={styles.header}>
          <BrandMark size={30} />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Coach IA</Text>
            <Label color={brand.cyan}>Treino e saúde</Label>
          </View>
          <Pressable accessibilityLabel="Nova conversa" onPress={novaConversa} style={styles.icone}>
            <MaterialIcons name="add-comment" size={22} color={brand.muted} />
          </Pressable>
          <Pressable accessibilityLabel="Configurações" onPress={() => router.push("/settings")} style={styles.icone}>
            <MaterialIcons name="settings" size={22} color={brand.muted} />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          <Balao papel="ia" texto={saudacao} />
          {mensagens.length === 0 && (
            <View style={styles.chips}>
              {SUGESTOES.map((sugestao) => (
                <Pressable
                  key={sugestao}
                  accessibilityRole="button"
                  onPress={() => enviar(sugestao)}
                  style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
                >
                  <Text style={styles.chipText}>{sugestao}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {mensagens.map((m) => (
            <Balao
              key={m.id}
              papel={m.papel}
              texto={m.texto}
              erro={m.erro}
              onAbrirTreino={m.treinoId ? () => router.push({ pathname: "/workout-detail", params: { workoutId: m.treinoId } }) : undefined}
            />
          ))}
          {enviando && <Balao papel="ia" texto="Pensando…" />}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Mensagem"
            maxLength={2000}
            multiline
            value={input}
            onChangeText={setInput}
            placeholder="Pergunte sobre treino ou saúde…"
            placeholderTextColor={brand.dim}
            style={styles.composerInput}
          />
          <Pressable
            accessibilityLabel="Enviar mensagem"
            disabled={enviando || !input.trim()}
            onPress={() => enviar(input)}
            style={({ pressed }) => [styles.send, (enviando || !input.trim()) && styles.sendOff, pressed && styles.pressed]}
          >
            <MaterialIcons name="arrow-upward" color={brand.onLime} size={20} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Balao({
  papel,
  texto,
  erro,
  onAbrirTreino,
}: {
  papel: Mensagem["papel"];
  texto: string;
  erro?: boolean;
  onAbrirTreino?: () => void;
}) {
  const daIA = papel === "ia";
  return (
    <View style={[styles.messageRow, !daIA && styles.messageRowUser]}>
      <View style={[styles.bubble, daIA ? styles.coachBubble : styles.userBubble, erro && styles.erroBubble]}>
        <Text selectable style={styles.bubbleText}>
          {texto}
        </Text>
        {onAbrirTreino && (
          <Pressable accessibilityRole="button" onPress={onAbrirTreino} style={({ pressed }) => [styles.abrir, pressed && styles.pressed]}>
            <MaterialIcons name="fitness-center" size={16} color={brand.onLime} />
            <Text style={styles.abrirTexto}>Abrir treino salvo</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { alignItems: "center", flexDirection: "row", gap: 8, minHeight: 60 },
  headerCopy: { flex: 1, gap: 3, marginLeft: 4 },
  title: { ...type.title, fontSize: 17 },
  icone: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  messages: { gap: 12, paddingBottom: 20, paddingTop: 12 },
  messageRow: { flexDirection: "row" },
  messageRowUser: { justifyContent: "flex-end" },
  bubble: { borderRadius: radius.lg, maxWidth: "88%", paddingHorizontal: 14, paddingVertical: 11 },
  coachBubble: { backgroundColor: brand.surface, borderColor: brand.border, borderBottomLeftRadius: 4, borderWidth: 1 },
  userBubble: { backgroundColor: brand.raised, borderBottomRightRadius: 4, borderColor: brand.borderStrong, borderWidth: 1 },
  erroBubble: { borderColor: brand.danger },
  bubbleText: { color: brand.text, fontSize: 14.5, lineHeight: 21 },
  abrir: { alignItems: "center", alignSelf: "flex-start", backgroundColor: brand.lime, borderRadius: radius.sm, flexDirection: "row", gap: 6, marginTop: 10, paddingHorizontal: 12, paddingVertical: 8 },
  abrirTexto: { color: brand.onLime, fontFamily: font.displayMedium, fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderColor: brand.borderStrong, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { color: brand.text, fontFamily: font.displayMedium, fontSize: 13 },
  composer: { alignItems: "flex-end", backgroundColor: brand.surface, borderColor: brand.borderStrong, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: 8, marginBottom: 12, padding: 5 },
  composerInput: { color: brand.text, flex: 1, fontSize: 14.5, maxHeight: 120, minHeight: 42, paddingHorizontal: 10, paddingVertical: 10 },
  send: { alignItems: "center", backgroundColor: brand.lime, borderRadius: radius.sm, height: 40, justifyContent: "center", width: 40 },
  sendOff: { opacity: 0.4 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
});
