import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.fill}
      >
        <View style={styles.content}>
          {/* Header & Logo */}
          <View style={styles.brandContainer}>
            <View style={styles.glowDecoration} />
            <BrandMark size={84} withName />
            <Text style={styles.subtitle}>
              PLANO DE HIPERTROFIA PERSONALIZADO POR IA
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>E-MAIL CORPORATIVO OU PESSOAL</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="mail-outline" color={brand.muted} size={20} />
                <TextInput
                  accessibilityLabel="E-mail"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  placeholderTextColor={brand.dim}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>SENHA DE ACESSO</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock-outline" color={brand.muted} size={20} />
                <TextInput
                  accessibilityLabel="Senha"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••••••"
                  placeholderTextColor={brand.dim}
                  secureTextEntry
                  style={styles.input}
                />
              </View>
            </View>

            <Pressable
              onPress={() => haptic.light()}
              style={({ pressed }) => [styles.forgotWrap, pressed && styles.pressed]}
            >
              <Text style={styles.forgotText}>Recuperar acesso</Text>
            </Pressable>

            <PrimaryButton
              label="Acessar Plataforma"
              onPress={handleLogin}
              variant="primary"
              icon={<MaterialIcons name="arrow-forward" color={brand.text} size={18} />}
            />

            <PrimaryButton
              label="Criar Conta Gratuita"
              onPress={handleLogin}
              variant="secondary"
            />
          </View>

          {/* Separator */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>AUTENTICAÇÃO RÁPIDA</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Auth */}
          <View style={styles.socialGrid}>
            <SocialAuthButton
              iconName="g-translate"
              label="Google"
              onPress={handleLogin}
            />
            <SocialAuthButton
              iconName="apple"
              label="Apple ID"
              onPress={handleLogin}
            />
          </View>

          <Text style={styles.footerTerms}>
            Ao continuar, você concorda com os{" "}
            <Text style={styles.termLink}>Termos de Uso</Text> e{" "}
            <Text style={styles.termLink}>Política de Privacidade</Text>.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function SocialAuthButton({
  iconName,
  label,
  onPress,
}: {
  iconName: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => [styles.socialBtn, pressed && styles.pressed]}
    >
      <MaterialIcons name={iconName} size={20} color={brand.text} />
      <Text style={styles.socialText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 32,
    position: "relative",
  },
  glowDecoration: {
    backgroundColor: brand.blueGlow,
    borderRadius: 80,
    height: 120,
    opacity: 0.08,
    position: "absolute",
    top: -20,
    width: 120,
  },
  subtitle: {
    color: brand.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 16,
    textAlign: "center",
  },
  formCard: {
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    padding: 20,
  },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    color: brand.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  inputWrapper: {
    alignItems: "center",
    backgroundColor: brand.background,
    borderColor: brand.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    height: 52,
    paddingHorizontal: 14,
  },
  input: {
    color: brand.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: -4,
  },
  forgotText: {
    color: brand.blueGlow,
    fontSize: 12,
    fontWeight: "800",
  },
  dividerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginVertical: 22,
  },
  dividerLine: {
    backgroundColor: brand.border,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: brand.dim,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  socialGrid: {
    flexDirection: "row",
    gap: 12,
  },
  socialBtn: {
    alignItems: "center",
    backgroundColor: brand.surfaceCard,
    borderColor: brand.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
  },
  socialText: {
    color: brand.text,
    fontSize: 14,
    fontWeight: "800",
  },
  footerTerms: {
    color: brand.dim,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 24,
    textAlign: "center",
  },
  termLink: {
    color: brand.muted,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

