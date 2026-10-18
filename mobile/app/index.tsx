import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { BrandMark, Wordmark } from "@/components/brand-mark";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { Label } from "@/components/ui";
import { brand, font, radius, type } from "@/constants/brand";

export default function LoginScreen() {
  const router = useRouter();
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.brandArea}>
            <BrandMark size={84} />
            <Wordmark size={30} />
            <Label>Treino montado por IA</Label>
          </View>

          <View style={styles.form}>
            <Field label="E-mail" placeholder="seu@email.com" keyboardType="email-address" />
            <Field label="Senha" placeholder="••••••••" secureTextEntry />
            <Pressable style={styles.forgot}>
              <Text style={styles.link}>Esqueci a senha</Text>
            </Pressable>
            <PrimaryButton label="Entrar" onPress={() => router.replace("/(tabs)")} />
            <PrimaryButton label="Criar conta" variant="secondary" onPress={() => router.replace("/(tabs)")} />
          </View>

          <View style={styles.orLine}>
            <View style={styles.line} />
            <Label>ou</Label>
            <View style={styles.line} />
          </View>

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
  secureTextEntry = false,
  keyboardType = "default",
}: {
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
}) {
  return (
    <View style={styles.field}>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={brand.dim}
        secureTextEntry={secureTextEntry}
        style={styles.input}
      />
    </View>
  );
}

function SocialButton({ label }: { label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {}}
      style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
    >
      <Text style={styles.socialText}>{label}</Text>
      <MaterialIcons name="arrow-forward" size={16} color={brand.dim} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flexGrow: 1, gap: 28, justifyContent: "center", paddingVertical: 24 },
  brandArea: { alignItems: "center", gap: 14, marginBottom: 8 },
  form: { gap: 16 },
  field: { gap: 8 },
  input: { backgroundColor: brand.surface, borderColor: brand.borderStrong, borderRadius: radius.md, borderWidth: 1, color: brand.text, fontSize: 16, height: 54, paddingHorizontal: 16 },
  forgot: { alignSelf: "flex-start", marginTop: -4 },
  link: { color: brand.cyan, fontSize: 13, fontWeight: "600" },
  orLine: { alignItems: "center", flexDirection: "row", gap: 14 },
  line: { backgroundColor: brand.border, flex: 1, height: 1 },
  socials: { gap: 10 },
  socialButton: { alignItems: "center", borderColor: brand.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", height: 52, justifyContent: "space-between", paddingHorizontal: 18 },
  socialText: { color: brand.text, fontFamily: font.displayMedium, fontSize: 14, letterSpacing: 0.3 },
  terms: { ...type.caption, textAlign: "center" },
  termsLink: { color: brand.text },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
