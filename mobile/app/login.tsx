import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { BrandMark, Wordmark } from "@/components/brand-mark";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { Label } from "@/components/ui";
import { brand, font, radius, type } from "@/constants/brand";
import { criarConta, entrar } from "@/lib/auth-api";
import { haptic } from "@/lib/haptics";
import { getToken } from "@/lib/session";

type Modo = "entrar" | "cadastrar";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);
  const [modo, setModo] = useState<Modo>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Já tem sessão salva: vai direto para o app
  useEffect(() => {
    getToken()
      .then((token) => (token ? router.replace("/") : setVerificando(false)))
      .catch(() => setVerificando(false));
  }, [router]);

  function trocarModo() {
    setModo((atual) => (atual === "entrar" ? "cadastrar" : "entrar"));
    setErro(null);
  }

  function validar(): string | null {
    if (modo === "cadastrar" && nome.trim().length < 2) return "Informe seu nome.";
    if (!EMAIL.test(email.trim())) return "Informe um e-mail válido.";
    if (!senha) return "Informe sua senha.";
    if (modo === "cadastrar" && senha.length < 8) return "A senha precisa de pelo menos 8 caracteres.";
    return null;
  }

  async function enviar() {
    const problema = validar();
    if (problema) {
      setErro(problema);
      haptic.medium();
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      if (modo === "entrar") await entrar(email.trim(), senha);
      else await criarConta(nome.trim(), email.trim(), senha);
      haptic.success();
      router.replace("/");
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : "Não foi possível entrar. Tente novamente.");
      haptic.medium();
    } finally {
      setEnviando(false);
    }
  }

  if (verificando) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator color={brand.lime} />
        </View>
      </ScreenContainer>
    );
  }

  const cadastro = modo === "cadastrar";

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.brandArea}>
            <BrandMark size={84} />
            <Wordmark size={30} />
            <Label>{cadastro ? "Crie sua conta" : "Treino montado por IA"}</Label>
          </View>

          <View style={styles.form}>
            {cadastro && (
              <Field label="Nome" placeholder="Como quer ser chamado" value={nome} onChangeText={setNome} autoCapitalize="words" />
            )}
            <Field
              label="E-mail"
              placeholder="seu@email.com"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoComplete="email"
            />
            <Field
              label="Senha"
              placeholder={cadastro ? "Mínimo de 8 caracteres" : "••••••••"}
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
              autoComplete={cadastro ? "new-password" : "current-password"}
              onSubmitEditing={enviar}
            />

            {erro && (
              <View accessibilityLiveRegion="polite" style={styles.erro}>
                <MaterialIcons name="error-outline" size={16} color={brand.danger} />
                <Text style={styles.erroTexto}>{erro}</Text>
              </View>
            )}

            <PrimaryButton label={enviando ? "Aguarde…" : cadastro ? "Criar conta" : "Entrar"} onPress={enviar} disabled={enviando} />
            <PrimaryButton
              label={cadastro ? "Já tenho conta" : "Criar conta"}
              variant="secondary"
              onPress={trocarModo}
              disabled={enviando}
            />
          </View>

          <View style={styles.orLine}>
            <View style={styles.line} />
            <Label>em breve</Label>
            <View style={styles.line} />
          </View>

          {/* Google, Apple e recuperação de senha dependem de credenciais dos provedores e de envio de e-mail */}
          <View style={styles.socials}>
            <SocialButton label="Continuar com Google" />
            <SocialButton label="Continuar com Apple" />
          </View>

          <Text style={styles.terms}>
            Ao entrar, você concorda com os <Text style={styles.termsLink}>Termos de Uso</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  autoComplete,
  onSubmitEditing,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (texto: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "words";
  autoComplete?: "email" | "current-password" | "new-password";
  onSubmitEditing?: () => void;
}) {
  return (
    <View style={styles.field}>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={false}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={brand.dim}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function SocialButton({ label }: { label: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: true }} disabled style={[styles.socialButton, styles.socialDisabled]}>
      <Text style={styles.socialText}>{label}</Text>
      <Text style={styles.soon}>em breve</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  content: { flexGrow: 1, gap: 28, justifyContent: "center", paddingVertical: 24 },
  brandArea: { alignItems: "center", gap: 14, marginBottom: 8 },
  form: { gap: 16 },
  field: { gap: 8 },
  input: { backgroundColor: brand.surface, borderColor: brand.borderStrong, borderRadius: radius.md, borderWidth: 1, color: brand.text, fontSize: 16, height: 54, paddingHorizontal: 16 },
  erro: { alignItems: "center", flexDirection: "row", gap: 8 },
  erroTexto: { color: brand.danger, flex: 1, fontSize: 13 },
  orLine: { alignItems: "center", flexDirection: "row", gap: 14 },
  line: { backgroundColor: brand.border, flex: 1, height: 1 },
  socials: { gap: 10 },
  socialButton: { alignItems: "center", borderColor: brand.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", height: 52, justifyContent: "space-between", paddingHorizontal: 18 },
  socialDisabled: { opacity: 0.5 },
  socialText: { color: brand.text, fontFamily: font.displayMedium, fontSize: 14, letterSpacing: 0.3 },
  soon: { ...type.caption, textTransform: "uppercase" },
  terms: { ...type.caption, textAlign: "center" },
  termsLink: { color: brand.text },
});
