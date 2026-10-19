import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { Label } from "@/components/ui";
import { brand, font, radius, type } from "@/constants/brand";
import { getApiBaseUrl } from "@/lib/_core/api";
import { atualizarNome, excluirConta, trocarSenha } from "@/lib/auth-api";
import { haptic } from "@/lib/haptics";
import { carregarPreferencias, salvarPreferencia, type Preferencias } from "@/lib/preferences";
import { limparProgresso } from "@/lib/progress";
import { encerrarSessao, getUsuario, type Usuario } from "@/lib/session";

type Painel = "senha" | "excluir" | "progresso" | null;
type StatusServidor = { estado: "verificando" | "online" | "offline"; ms?: number };

export default function SettingsScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [prefs, setPrefs] = useState<Preferencias | null>(null);
  const [painel, setPainel] = useState<Painel>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [servidor, setServidor] = useState<StatusServidor>({ estado: "verificando" });

  useEffect(() => {
    getUsuario().then(setUsuario).catch(() => setUsuario(null));
    carregarPreferencias().then(setPrefs);
    verificarServidor().then(setServidor);
  }, []);

  function abrir(proximo: Painel) {
    haptic.light();
    setAviso(null);
    setPainel((atual) => (atual === proximo ? null : proximo));
  }

  async function alternar(chave: keyof Preferencias, valor: boolean) {
    setPrefs(await salvarPreferencia(chave, valor));
    if (chave === "vibracao" && valor) haptic.light();
  }

  async function sair() {
    haptic.light();
    await encerrarSessao();
    router.replace("/login");
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Configurações" subtitle={usuario?.email} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {aviso && (
          <View style={styles.aviso}>
            <MaterialIcons name="check-circle" size={16} color={brand.lime} />
            <Text style={styles.avisoTexto}>{aviso}</Text>
          </View>
        )}

        {/* ── Conta ─────────────────────────────────────────────── */}
        <Secao titulo="Conta">
          {usuario && <EditarNome usuario={usuario} onSalvo={(u) => { setUsuario(u); setAviso("Nome atualizado."); }} />}
          <Linha icone="mail-outline" titulo="E-mail" valor={usuario?.email ?? "—"} />
          <Linha icone="lock-outline" titulo="Trocar senha" onPress={() => abrir("senha")} aberto={painel === "senha"} />
          {painel === "senha" && (
            <TrocarSenha onConcluido={() => { setPainel(null); setAviso("Senha alterada. Use a nova senha no próximo login."); }} />
          )}
          <Linha icone="logout" titulo="Sair da conta" onPress={sair} />
        </Secao>

        {/* ── Durante o treino ──────────────────────────────────── */}
        <Secao titulo="Durante o treino">
          <Alternador
            icone="stay-current-portrait"
            titulo="Manter a tela ligada"
            descricao="A tela não apaga enquanto o treino estiver aberto."
            valor={prefs?.telaLigada ?? true}
            onChange={(v) => alternar("telaLigada", v)}
          />
          <Alternador
            icone="vibration"
            titulo="Vibração"
            descricao="Resposta tátil ao tocar e ao concluir exercícios."
            valor={prefs?.vibracao ?? true}
            onChange={(v) => alternar("vibracao", v)}
          />
        </Secao>

        {/* ── Dados ─────────────────────────────────────────────── */}
        <Secao titulo="Dados">
          <Linha
            icone="restart-alt"
            titulo="Apagar progresso do aparelho"
            descricao="Checklist e cargas anotadas. Seus treinos continuam salvos na conta."
            onPress={() => abrir("progresso")}
            aberto={painel === "progresso"}
          />
          {painel === "progresso" && (
            <Confirmacao
              texto="O checklist e o histórico de cargas deste aparelho serão apagados. Isso não pode ser desfeito."
              botao="Apagar progresso"
              onConfirmar={async () => {
                await limparProgresso();
                setPainel(null);
                setAviso("Progresso do aparelho apagado.");
              }}
            />
          )}
          <Linha icone="delete-forever" titulo="Excluir conta" perigo onPress={() => abrir("excluir")} aberto={painel === "excluir"} />
          {painel === "excluir" && <ExcluirConta onExcluida={() => router.replace("/login")} />}
        </Secao>

        {/* ── Sobre ─────────────────────────────────────────────── */}
        <Secao titulo="Sobre">
          <Linha icone="info-outline" titulo="Versão do app" valor={Constants.expoConfig?.version ?? "—"} />
          <Linha
            icone="dns"
            titulo="Servidor"
            descricao={getApiBaseUrl() || "EXPO_PUBLIC_API_BASE_URL não definida"}
            direita={<StatusBadge status={servidor} />}
            onPress={() => {
              setServidor({ estado: "verificando" });
              verificarServidor().then(setServidor);
            }}
          />
        </Secao>
      </ScrollView>
    </ScreenContainer>
  );
}

async function verificarServidor(): Promise<StatusServidor> {
  const base = getApiBaseUrl();
  if (!base) return { estado: "offline" };
  const inicio = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const resposta = await fetch(`${base}/`, { signal: controller.signal });
    return resposta.ok ? { estado: "online", ms: Date.now() - inicio } : { estado: "offline" };
  } catch {
    return { estado: "offline" };
  } finally {
    clearTimeout(timer);
  }
}

/* ── Blocos da tela ─────────────────────────────────────────────────────── */

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={styles.secao}>
      <Label>{titulo}</Label>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Linha({
  icone,
  titulo,
  descricao,
  valor,
  direita,
  onPress,
  aberto,
  perigo = false,
}: {
  icone: React.ComponentProps<typeof MaterialIcons>["name"];
  titulo: string;
  descricao?: string;
  valor?: string;
  direita?: ReactNode;
  onPress?: () => void;
  aberto?: boolean;
  perigo?: boolean;
}) {
  const cor = perigo ? brand.danger : brand.cyan;
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.linha, pressed && styles.pressed]}
    >
      <MaterialIcons name={icone} size={20} color={cor} />
      <View style={styles.linhaTexto}>
        <Text style={[styles.linhaTitulo, perigo && { color: brand.danger }]}>{titulo}</Text>
        {descricao ? <Text style={styles.linhaDescricao}>{descricao}</Text> : null}
      </View>
      {valor ? <Text numberOfLines={1} style={styles.linhaValor}>{valor}</Text> : null}
      {direita}
      {onPress && !direita ? (
        <MaterialIcons name={aberto ? "expand-less" : "chevron-right"} size={21} color={brand.dim} />
      ) : null}
    </Pressable>
  );
}

function Alternador({
  icone,
  titulo,
  descricao,
  valor,
  onChange,
}: {
  icone: React.ComponentProps<typeof MaterialIcons>["name"];
  titulo: string;
  descricao: string;
  valor: boolean;
  onChange: (valor: boolean) => void;
}) {
  return (
    <View style={styles.linha}>
      <MaterialIcons name={icone} size={20} color={brand.cyan} />
      <View style={styles.linhaTexto}>
        <Text style={styles.linhaTitulo}>{titulo}</Text>
        <Text style={styles.linhaDescricao}>{descricao}</Text>
      </View>
      <Switch
        accessibilityLabel={titulo}
        value={valor}
        onValueChange={onChange}
        thumbColor={valor ? brand.onLime : brand.muted}
        trackColor={{ false: brand.borderStrong, true: brand.lime }}
        // @ts-expect-error: prop só existe no react-native-web (cor da trilha ligada no navegador)
        activeThumbColor={brand.onLime}
      />
    </View>
  );
}

function StatusBadge({ status }: { status: StatusServidor }) {
  if (status.estado === "verificando") return <ActivityIndicator size="small" color={brand.muted} />;
  const online = status.estado === "online";
  return (
    <View style={[styles.badge, { borderColor: online ? brand.lime : brand.danger }]}>
      <View style={[styles.badgePonto, { backgroundColor: online ? brand.lime : brand.danger }]} />
      <Text style={[styles.badgeTexto, { color: online ? brand.lime : brand.danger }]}>
        {online ? `online${status.ms != null ? ` · ${status.ms} ms` : ""}` : "offline"}
      </Text>
    </View>
  );
}

function EditarNome({ usuario, onSalvo }: { usuario: Usuario; onSalvo: (usuario: Usuario) => void }) {
  const [nome, setNome] = useState(usuario.nome);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const alterado = nome.trim() !== usuario.nome && nome.trim().length >= 2;

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      onSalvo(await atualizarNome(nome.trim()));
      haptic.success();
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : "Não foi possível salvar o nome.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.linha}>
      <MaterialIcons name="person-outline" size={20} color={brand.cyan} />
      <View style={styles.linhaTexto}>
        <Text style={styles.linhaDescricao}>Nome</Text>
        <TextInput
          accessibilityLabel="Nome"
          autoCapitalize="words"
          maxLength={80}
          onChangeText={setNome}
          onSubmitEditing={() => alterado && salvar()}
          style={styles.inputInline}
          value={nome}
        />
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      </View>
      {alterado && (
        <Pressable accessibilityRole="button" disabled={salvando} onPress={salvar} style={styles.salvarInline}>
          <Text style={styles.salvarInlineTexto}>{salvando ? "…" : "Salvar"}</Text>
        </Pressable>
      )}
    </View>
  );
}

function TrocarSenha({ onConcluido }: { onConcluido: () => void }) {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    if (nova.length < 8) return setErro("A nova senha precisa de pelo menos 8 caracteres.");
    if (nova !== confirmacao) return setErro("A confirmação não confere com a nova senha.");
    setEnviando(true);
    setErro(null);
    try {
      await trocarSenha(atual, nova);
      haptic.success();
      onConcluido();
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : "Não foi possível trocar a senha.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.painel}>
      <CampoSenha label="Senha atual" valor={atual} onChange={setAtual} autoComplete="current-password" />
      <CampoSenha label="Nova senha" valor={nova} onChange={setNova} autoComplete="new-password" />
      <CampoSenha label="Confirmar nova senha" valor={confirmacao} onChange={setConfirmacao} autoComplete="new-password" />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      <PrimaryButton label={enviando ? "Salvando…" : "Salvar nova senha"} onPress={enviar} disabled={enviando || !atual || !nova} />
    </View>
  );
}

function ExcluirConta({ onExcluida }: { onExcluida: () => void }) {
  const [senha, setSenha] = useState("");
  const [ciente, setCiente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    setEnviando(true);
    setErro(null);
    try {
      await excluirConta(senha);
      onExcluida();
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : "Não foi possível excluir a conta.");
      setEnviando(false);
    }
  }

  return (
    <View style={[styles.painel, styles.painelPerigo]}>
      <Text style={styles.painelTexto}>
        Sua conta, seu perfil e todo o histórico de treinos serão apagados do servidor. Não dá para desfazer.
      </Text>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: ciente }}
        onPress={() => setCiente((c) => !c)}
        style={styles.checkLinha}
      >
        <MaterialIcons name={ciente ? "check-box" : "check-box-outline-blank"} size={20} color={ciente ? brand.danger : brand.dim} />
        <Text style={styles.checkTexto}>Entendo que a exclusão é definitiva</Text>
      </Pressable>
      <CampoSenha label="Confirme com sua senha" valor={senha} onChange={setSenha} autoComplete="current-password" />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={!ciente || !senha || enviando}
        onPress={enviar}
        style={({ pressed }) => [styles.botaoPerigo, (!ciente || !senha || enviando) && styles.desativado, pressed && styles.pressed]}
      >
        <Text style={styles.botaoPerigoTexto}>{enviando ? "Excluindo…" : "Excluir minha conta"}</Text>
      </Pressable>
    </View>
  );
}

function Confirmacao({ texto, botao, onConfirmar }: { texto: string; botao: string; onConfirmar: () => Promise<void> }) {
  const [enviando, setEnviando] = useState(false);
  return (
    <View style={styles.painel}>
      <Text style={styles.painelTexto}>{texto}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={enviando}
        onPress={async () => {
          setEnviando(true);
          await onConfirmar();
          setEnviando(false);
        }}
        style={({ pressed }) => [styles.botaoPerigo, enviando && styles.desativado, pressed && styles.pressed]}
      >
        <Text style={styles.botaoPerigoTexto}>{enviando ? "Apagando…" : botao}</Text>
      </Pressable>
    </View>
  );
}

function CampoSenha({
  label,
  valor,
  onChange,
  autoComplete,
}: {
  label: string;
  valor: string;
  onChange: (texto: string) => void;
  autoComplete: "current-password" | "new-password";
}) {
  return (
    <View style={styles.campo}>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoComplete={autoComplete}
        autoCorrect={false}
        onChangeText={onChange}
        placeholderTextColor={brand.dim}
        secureTextEntry
        style={styles.input}
        value={valor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 24, paddingBottom: 40, paddingTop: 8 },
  secao: { gap: 10 },
  card: { backgroundColor: brand.surface, borderColor: brand.border, borderRadius: radius.lg, borderWidth: 1, overflow: "hidden" },
  linha: { alignItems: "center", borderBottomColor: brand.border, borderBottomWidth: 1, flexDirection: "row", gap: 14, minHeight: 58, paddingHorizontal: 16, paddingVertical: 12 },
  linhaTexto: { flex: 1, gap: 3 },
  linhaTitulo: { color: brand.text, fontFamily: font.displayMedium, fontSize: 14, letterSpacing: 0.2 },
  linhaDescricao: { ...type.caption },
  linhaValor: { color: brand.muted, flexShrink: 1, fontSize: 13, maxWidth: "45%" },
  inputInline: { color: brand.text, fontFamily: font.displayMedium, fontSize: 15, paddingVertical: 2 },
  salvarInline: { backgroundColor: brand.lime, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 8 },
  salvarInlineTexto: { color: brand.onLime, fontFamily: font.display, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  painel: { backgroundColor: brand.raised, borderBottomColor: brand.border, borderBottomWidth: 1, gap: 14, padding: 16 },
  painelPerigo: { borderLeftColor: brand.danger, borderLeftWidth: 2 },
  painelTexto: { color: brand.muted, fontSize: 13, lineHeight: 19 },
  campo: { gap: 8 },
  input: { backgroundColor: brand.surface, borderColor: brand.borderStrong, borderRadius: radius.md, borderWidth: 1, color: brand.text, fontSize: 16, height: 50, paddingHorizontal: 14 },
  checkLinha: { alignItems: "center", flexDirection: "row", gap: 10 },
  checkTexto: { color: brand.text, fontSize: 13 },
  botaoPerigo: { alignItems: "center", borderColor: brand.danger, borderRadius: radius.md, borderWidth: 1, justifyContent: "center", minHeight: 50 },
  botaoPerigoTexto: { color: brand.danger, fontFamily: font.display, fontSize: 13, letterSpacing: 1.2, textTransform: "uppercase" },
  desativado: { opacity: 0.4 },
  erro: { color: brand.danger, fontSize: 13 },
  aviso: { alignItems: "center", backgroundColor: brand.limeSoft, borderColor: brand.lime, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: 8, padding: 12 },
  avisoTexto: { color: brand.text, flex: 1, fontSize: 13 },
  badge: { alignItems: "center", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgePonto: { borderRadius: 4, height: 7, width: 7 },
  badgeTexto: { fontFamily: font.displayMedium, fontSize: 11, letterSpacing: 0.6 },
  pressed: { opacity: 0.7 },
});
