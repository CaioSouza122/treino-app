import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { BrandMark } from "@/components/brand-mark";
import { ScreenContainer } from "@/components/screen-container";
import { Label } from "@/components/ui";
import { VoltagemChip } from "@/components/voltagem";
import { brand, font, radius, type } from "@/constants/brand";
import { haptic } from "@/lib/haptics";
import { getLogs, voltagem } from "@/lib/progress";
import { getUsuario } from "@/lib/session";
import { liberarTela, manterTelaAcesa } from "@/lib/tela-acesa";
import {
  acordarServidores,
  apagarConversa,
  conversar,
  listarConversas,
  novaConversa,
  salvarConversa,
  type Conversa,
  type Mensagem,
} from "@/lib/workouts-api";

const SUGESTOES = ["Monte um treino para mim", "Como ganhar massa muscular?", "O que comer antes do treino?"];

export default function CoachScreen() {
  const router = useRouter();
  const [conversa, setConversa] = useState<Conversa>(novaConversa);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [nome, setNome] = useState<string | null>(null);
  const [volts, setVolts] = useState(0);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    listarConversas().then((lista) => {
      setConversas(lista);
      if (lista[0]) setConversa(lista[0]);
    });
    getUsuario()
      .then((usuario) => setNome(usuario?.nome.trim().split(" ")[0] ?? null))
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      // O app pode ter ficado em segundo plano tempo bastante para o Render dormir de novo
      acordarServidores();
      getLogs().then((logs) => setVolts(voltagem(logs)));
    }, []),
  );

  async function enviar(texto: string) {
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;
    haptic.light();
    const comPergunta: Conversa = {
      ...conversa,
      mensagens: [...conversa.mensagens, { id: `u-${Date.now()}`, papel: "usuario", texto: conteudo }],
    };
    setConversa(comPergunta);
    setInput("");
    setEnviando(true);
    // Com a tela apagada o Android corta a rede do app no meio da resposta
    manterTelaAcesa("coach");
    let resposta: Mensagem;
    try {
      const r = await conversar(comPergunta.mensagens);
      resposta = { id: `ia-${Date.now()}`, papel: "ia", texto: r.resposta, treinoId: r.treino_id ?? undefined };
    } catch (cause) {
      const texto = cause instanceof Error ? cause.message : "Não consegui responder agora. Tente de novo.";
      resposta = { id: `ia-${Date.now()}`, papel: "ia", texto, erro: true };
    } finally {
      liberarTela("coach");
      setEnviando(false);
    }
    const final = { ...comPergunta, mensagens: [...comPergunta.mensagens, resposta] };
    setConversa(final);
    setConversas(await salvarConversa(final));
  }

  function abrir(escolhida: Conversa) {
    setConversa(escolhida);
    setHistoricoAberto(false);
  }

  function iniciarNova() {
    if (enviando) return;
    setConversa(novaConversa());
    setHistoricoAberto(false);
  }

  async function apagar(id: string) {
    const lista = await apagarConversa(id);
    setConversas(lista);
    if (id === conversa.id) setConversa(novaConversa());
  }

  const saudacao =
    `Olá${nome ? `, ${nome}` : ""}! Sou seu Coach IA. Posso montar seu treino, ajustar o plano, ` +
    "tirar dúvidas sobre exercícios, alimentação e recuperação. Como posso ajudar?";
  const podeEnviar = !enviando && !!input.trim();

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* "padding" também no Android: com a tela de ponta a ponta o sistema não encolhe a janela */}
      <KeyboardAvoidingView behavior="padding" style={styles.fill}>
        <View style={styles.header}>
          <BrandMark size={30} />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Coach IA</Text>
            <Label color={brand.cyan}>Treino e saúde</Label>
          </View>
          <VoltagemChip volts={volts} />
          <Pressable accessibilityLabel="Histórico de conversas" onPress={() => setHistoricoAberto(true)} style={styles.icone}>
            <MaterialIcons name="history" size={23} color={brand.text} />
          </Pressable>
          <Pressable accessibilityLabel="Nova conversa" onPress={iniciarNova} style={styles.icone}>
            <MaterialIcons name="add-comment" size={22} color={brand.text} />
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
          {conversa.mensagens.length === 0 && (
            <View style={styles.chips}>
              {SUGESTOES.map((sugestao) => (
                <Pressable key={sugestao} accessibilityRole="button" onPress={() => enviar(sugestao)} style={styles.chip}>
                  <Text style={styles.chipText}>{sugestao}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {conversa.mensagens.map((m) => (
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
            accessibilityState={{ disabled: !podeEnviar }}
            disabled={!podeEnviar}
            onPress={() => enviar(input)}
            style={[styles.send, !podeEnviar && styles.sendOff]}
          >
            <MaterialIcons name="send" color={podeEnviar ? brand.onLime : brand.muted} size={20} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal animationType="slide" transparent visible={historicoAberto} onRequestClose={() => setHistoricoAberto(false)}>
        <Pressable accessibilityLabel="Fechar histórico" style={styles.fundo} onPress={() => setHistoricoAberto(false)} />
        <View style={styles.painel}>
          <View style={styles.painelTopo}>
            <Text style={styles.painelTitulo}>Conversas</Text>
            <Pressable accessibilityRole="button" onPress={iniciarNova} style={styles.novaBotao}>
              <MaterialIcons name="add" size={18} color={brand.onLime} />
              <Text style={styles.novaTexto}>Nova</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.lista}>
            {conversas.length === 0 && <Text style={styles.vazio}>Suas conversas com o Coach aparecem aqui.</Text>}
            {conversas.map((c) => (
              <View key={c.id} style={[styles.item, c.id === conversa.id && styles.itemAtual]}>
                <Pressable accessibilityRole="button" onPress={() => abrir(c)} style={styles.itemTexto}>
                  <Text numberOfLines={1} style={styles.itemTitulo}>{c.titulo}</Text>
                  <Text style={styles.itemData}>
                    {new Date(c.atualizado).toLocaleDateString("pt-BR")} · {c.mensagens.length} mensagens
                  </Text>
                </Pressable>
                <Pressable accessibilityLabel={`Apagar conversa ${c.titulo}`} onPress={() => apagar(c.id)} style={styles.icone}>
                  <MaterialIcons name="delete-outline" size={20} color={brand.muted} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
          <Pressable accessibilityRole="button" onPress={onAbrirTreino} style={styles.abrir}>
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
  header: { alignItems: "center", flexDirection: "row", gap: 6, minHeight: 60 },
  headerCopy: { flex: 1, gap: 3, marginLeft: 6 },
  title: { ...type.title, fontSize: 17 },
  icone: { alignItems: "center", height: 40, justifyContent: "center", width: 38 },
  messages: { gap: 12, paddingBottom: 20, paddingTop: 12 },
  messageRow: { flexDirection: "row" },
  messageRowUser: { justifyContent: "flex-end" },
  bubble: { borderRadius: radius.lg, maxWidth: "88%", paddingHorizontal: 14, paddingVertical: 11 },
  coachBubble: { backgroundColor: brand.surface, borderColor: brand.border, borderBottomLeftRadius: 4, borderWidth: 1 },
  userBubble: { backgroundColor: brand.limeSoft, borderBottomRightRadius: 4, borderColor: brand.lime, borderWidth: 1 },
  erroBubble: { borderColor: brand.danger },
  bubbleText: { color: brand.text, fontSize: 14.5, lineHeight: 21 },
  abrir: { alignItems: "center", alignSelf: "flex-start", backgroundColor: brand.lime, borderRadius: radius.sm, flexDirection: "row", gap: 6, marginTop: 10, paddingHorizontal: 12, paddingVertical: 8 },
  abrirTexto: { color: brand.onLime, fontFamily: font.displayMedium, fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderColor: brand.cyan, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { color: brand.text, fontFamily: font.displayMedium, fontSize: 13 },
  composer: { alignItems: "flex-end", backgroundColor: brand.surface, borderColor: brand.borderStrong, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: 8, marginBottom: 10, padding: 6 },
  composerInput: { color: brand.text, flex: 1, fontSize: 15, maxHeight: 120, minHeight: 44, paddingHorizontal: 10, paddingVertical: 10 },
  send: { alignItems: "center", backgroundColor: brand.lime, borderRadius: radius.sm, height: 44, justifyContent: "center", width: 44 },
  sendOff: { backgroundColor: brand.raised },
  fundo: { backgroundColor: "rgba(0,0,0,0.6)", flex: 1 },
  painel: { backgroundColor: brand.surface, borderColor: brand.borderStrong, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderWidth: 1, maxHeight: "70%", paddingBottom: 24 },
  painelTopo: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", padding: 18 },
  painelTitulo: { ...type.h2 },
  novaBotao: { alignItems: "center", backgroundColor: brand.lime, borderRadius: radius.sm, flexDirection: "row", gap: 4, paddingHorizontal: 12, paddingVertical: 8 },
  novaTexto: { color: brand.onLime, fontFamily: font.displayMedium, fontSize: 13 },
  lista: { gap: 8, paddingHorizontal: 18 },
  vazio: { ...type.caption, paddingVertical: 12 },
  item: { alignItems: "center", backgroundColor: brand.raised, borderColor: brand.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", paddingLeft: 14 },
  itemAtual: { borderColor: brand.lime },
  itemTexto: { flex: 1, gap: 3, paddingVertical: 12 },
  itemTitulo: { ...type.title, fontSize: 14.5 },
  itemData: { ...type.caption, fontSize: 11.5 },
});
