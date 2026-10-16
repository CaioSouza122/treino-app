import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    haptic.light();
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-6">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.fill}>
        <ScrollView style={styles.fill} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <BrandMark size={56} />
            <Text style={styles.title}>Entre na sua conta</Text>
            <Text style={styles.subtitle}>Seu plano de treino personalizado, sempre com você.</Text>
          </View>

          <View style={styles.form}>
            <Input
              icon="mail-outline"
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="voce@email.com"
              keyboardType="email-address"
            />
            <Input
              icon="lock-outline"
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Sua senha"
              secureTextEntry
            />
            <Pressable onPress={() => haptic.light()} style={({ pressed }) => [styles.forgot, pressed && styles.pressed]}>
              <Text style={styles.link}>Esqueci minha senha</Text>
            </Pressable>
            <PrimaryButton label="Entrar" onPress={handleLogin} />
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.social}>
            <PrimaryButton
              label="Continuar com Google"
              variant="secondary"
              onPress={handleLogin}
              icon={<MaterialIcons name="g-translate" size={18} color={brand.text} />}
            />
            <PrimaryButton
              label="Continuar com Apple"
              variant="secondary"
              onPress={handleLogin}
              icon={<MaterialIcons name="apple" size={20} color={brand.text} />}
            />
          </View>

          <View style={styles.signup}>
            <Text style={styles.signupText}>Não tem conta?</Text>
            <Pressable onPress={handleLogin} style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.link}>Criar conta</Text>
            </Pressable>
          </View>

          <Text style={styles.terms}>
            Ao continuar, você concorda com os <Text style={styles.termLink}>Termos de Uso</Text> e a{" "}
            <Text style={styles.termLink}>Política de Privacidade</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Input({
  icon,
  label,
  ...props
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <MaterialIcons name={icon} color={brand.dim} size={20} />
        <TextInput
          accessibilityLabel={label}
          autoCapitalize="none"
          placeholderTextColor={brand.dim}
          style={styles.input}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 0 },
  content: { flexGrow: 1, justifyContent: "center", paddingVertical: 32 },
  brand: { alignItems: "center", marginBottom: 36 },
  title: { color: brand.text, fontSize: 26, fontWeight: "700", letterSpacing: -0.5, marginTop: 24 },
  subtitle: { color: brand.muted, fontSize: 15, lineHeight: 21, marginTop: 8, textAlign: "center" },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { color: brand.muted, fontSize: 13 },
  inputWrap: {
    alignItems: "center",
    backgroundColor: brand.surface,
    borderColor: brand.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
  },
  input: { color: brand.text, flex: 1, fontSize: 15, height: "100%", minWidth: 0 },
  forgot: { alignSelf: "flex-end", marginTop: -4 },
  link: { color: brand.accentText, fontSize: 14, fontWeight: "500" },
  dividerRow: { alignItems: "center", flexDirection: "row", gap: 12, marginVertical: 24 },
  dividerLine: { backgroundColor: brand.border, flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { color: brand.dim, fontSize: 13 },
  social: { gap: 10 },
  signup: { flexDirection: "row", gap: 6, justifyContent: "center", marginTop: 28 },
  signupText: { color: brand.muted, fontSize: 14 },
  terms: { color: brand.dim, fontSize: 12, lineHeight: 18, marginTop: 20, textAlign: "center" },
  termLink: { color: brand.muted },
  pressed: { opacity: 0.6 },
});
