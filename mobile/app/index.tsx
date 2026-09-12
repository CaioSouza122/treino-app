import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { BrandMark } from "@/components/brand-mark";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { brand } from "@/constants/brand";

export default function LoginScreen() {
  const router = useRouter();
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.fill}>
        <View style={styles.content}>
          <View style={styles.brandArea}>
            <BrandMark size={76} withName />
            <Text style={styles.slogan}>Seu treino, montado por IA</Text>
          </View>
          <View style={styles.form}>
            <Field label="E-mail" placeholder="seu@email.com" icon="mail-outline" />
            <Field label="Senha" placeholder="••••••••" icon="lock-outline" secureTextEntry />
            <Pressable style={styles.forgot}><Text style={styles.link}>Esqueci a senha</Text></Pressable>
            <PrimaryButton label="Entrar" onPress={() => router.replace("/(tabs)")} />
            <PrimaryButton label="Criar conta" variant="secondary" onPress={() => router.replace("/(tabs)")} style={styles.secondaryButton} />
          </View>
          <View style={styles.orLine}><View style={styles.line} /><Text style={styles.or}>ou</Text><View style={styles.line} /></View>
          <View style={styles.socials}>
            <SocialButton icon="G" label="Continuar com Google" />
            <SocialButton icon="" label="Continuar com Apple" />
          </View>
          <Text style={styles.terms}>Ao entrar, você concorda com os <Text style={styles.link}>Termos de Uso</Text>.</Text>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Field({ label, placeholder, icon, secureTextEntry = false }: { label: string; placeholder: string; icon: keyof typeof MaterialIcons.glyphMap; secureTextEntry?: boolean }) {
  return <View><Text style={styles.fieldLabel}>{label}</Text><View style={styles.inputWrap}><MaterialIcons color={brand.muted} name={icon} size={21} /><TextInput accessibilityLabel={label} placeholder={placeholder} placeholderTextColor={brand.dim} secureTextEntry={secureTextEntry} style={styles.input} /></View></View>;
}

function SocialButton({ icon, label }: { icon: string; label: string }) {
  return <Pressable onPress={() => {}} style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}><Text style={styles.socialIcon}>{icon}</Text><Text style={styles.socialText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 }, content: { flex: 1, justifyContent: "center", paddingVertical: 18 }, brandArea: { alignItems: "center", marginBottom: 42 }, slogan: { color: brand.muted, fontSize: 15, marginTop: 14 }, form: { gap: 16 }, fieldLabel: { color: brand.text, fontSize: 15, fontWeight: "700", marginBottom: 8 }, inputWrap: { alignItems: "center", backgroundColor: brand.surface, borderColor: brand.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", height: 56, paddingHorizontal: 16 }, input: { color: brand.text, flex: 1, fontSize: 16, marginLeft: 11 }, forgot: { alignSelf: "flex-start", marginTop: -6 }, link: { color: brand.blueLight, fontWeight: "700" }, secondaryButton: { marginTop: -4 }, orLine: { alignItems: "center", flexDirection: "row", gap: 14, marginVertical: 24 }, line: { backgroundColor: brand.border, flex: 1, height: 1 }, or: { color: brand.muted, fontSize: 14 }, socials: { gap: 12 }, socialButton: { alignItems: "center", backgroundColor: brand.surface, borderColor: brand.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", height: 54, justifyContent: "center" }, socialIcon: { color: brand.blueLight, fontSize: 22, fontWeight: "900", left: 20, position: "absolute" }, socialText: { color: brand.text, fontSize: 15, fontWeight: "700" }, terms: { color: brand.muted, fontSize: 12, marginTop: 30, textAlign: "center" }, pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
