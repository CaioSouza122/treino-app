import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { Label } from "@/components/ui";
import { VoltagemCard } from "@/components/voltagem";
import { brand, font, radius, type } from "@/constants/brand";
import { diasTreinados, getLogs, voltagem, type ProgressLog } from "@/lib/progress";
import { getUsuario, type Usuario } from "@/lib/session";
import { getWorkoutHistory } from "@/lib/workouts-api";

export default function PerfilScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [planos, setPlanos] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      getUsuario().then(setUsuario).catch(() => {});
      getLogs().then(setLogs);
      getWorkoutHistory()
        .then((historico) => setPlanos(historico.length))
        .catch(() => {});
    }, []),
  );

  const iniciais =
    usuario?.nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join("") || "?";

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{iniciais}</Text>
          </View>
          <View style={styles.identidade}>
            <Text style={styles.nome}>{usuario?.nome ?? "—"}</Text>
            <Text style={styles.email}>{usuario?.email ?? ""}</Text>
          </View>
        </View>

        <VoltagemCard volts={voltagem(logs)} />

        <View>
          <Label>Seus números</Label>
          <View style={styles.numeros}>
            <Numero valor={planos == null ? "—" : String(planos)} rotulo="Planos salvos" />
            <Numero valor={String(diasTreinados(logs))} rotulo="Dias treinados" />
            <Numero valor={String(logs.length)} rotulo="Exercícios feitos" />
          </View>
        </View>

        <PrimaryButton
          label="Configurações"
          variant="secondary"
          onPress={() => router.push("/settings")}
          icon={<MaterialIcons name="settings" size={18} color={brand.text} />}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

function Numero({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <View style={styles.numero}>
      <Text style={styles.numeroValor}>{valor}</Text>
      <Text style={styles.numeroRotulo}>{rotulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 20, paddingBottom: 32, paddingTop: 20 },
  topo: { alignItems: "center", flexDirection: "row", gap: 16 },
  avatar: { alignItems: "center", backgroundColor: brand.cyanSoft, borderColor: brand.cyan, borderRadius: 999, borderWidth: 1.5, height: 64, justifyContent: "center", width: 64 },
  avatarTexto: { color: brand.cyan, fontFamily: font.display, fontSize: 24 },
  identidade: { flex: 1, gap: 2 },
  nome: { ...type.h2 },
  email: { ...type.caption },
  numeros: { flexDirection: "row", gap: 8, marginTop: 10 },
  numero: { backgroundColor: brand.surface, borderColor: brand.border, borderRadius: radius.md, borderWidth: 1, flex: 1, gap: 4, padding: 12 },
  numeroValor: { color: brand.text, fontFamily: font.display, fontSize: 22 },
  numeroRotulo: { ...type.label, fontSize: 9 },
});
