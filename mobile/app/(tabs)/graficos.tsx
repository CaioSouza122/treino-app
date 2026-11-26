import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyChart, FrequencyChart, StrengthChart, strengthDelta } from "@/components/charts";
import { ScreenContainer } from "@/components/screen-container";
import { Label } from "@/components/ui";
import { brand, font, radius, type } from "@/constants/brand";
import {
  adherence,
  diasTreinados,
  formatKg,
  getLogs,
  strengthSeries,
  trackedExercises,
  weeklyFrequency,
  type ProgressLog,
} from "@/lib/progress";
import { getWorkoutHistory } from "@/lib/workouts-api";

export default function GraficosScreen() {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  // Meta semanal = dias do plano mais recente; sem plano, 3
  const [planejado, setPlanejado] = useState(3);
  const [exercicio, setExercicio] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getLogs().then(setLogs);
      getWorkoutHistory()
        .then((historico) => historico[0] && setPlanejado(historico[0].days.length))
        .catch(() => {});
    }, []),
  );

  const semanas = useMemo(() => weeklyFrequency(logs, planejado), [logs, planejado]);
  const esta = semanas[semanas.length - 1];
  const rastreados = useMemo(() => trackedExercises(logs), [logs]);
  const escolhido = rastreados.find((item) => item.key === exercicio) ?? rastreados[0];
  const pontos = useMemo(() => (escolhido ? strengthSeries(logs, escolhido.key) : []), [logs, escolhido]);
  const variacao = strengthDelta(pontos);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Label color={brand.cyan}>Desempenho</Label>
          <Text style={styles.h1}>Gráficos</Text>
        </View>

        <View style={styles.numeros}>
          <Numero valor={`${esta?.done ?? 0}/${planejado}`} rotulo="Esta semana" />
          <Numero valor={`${adherence(semanas)}%`} rotulo="Constância (8 sem.)" destaque />
          <Numero valor={String(diasTreinados(logs))} rotulo="Dias treinados" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Frequência semanal</Text>
          <Text style={styles.cardSub}>Treinos concluídos por semana. O contorno é a meta do seu plano.</Text>
          <FrequencyChart weeks={semanas} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Evolução de carga</Text>
          {escolhido ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {rastreados.slice(0, 8).map((item) => (
                  <Pressable
                    key={item.key}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: item.key === escolhido.key }}
                    onPress={() => setExercicio(item.key)}
                    style={[styles.chip, item.key === escolhido.key && styles.chipAtivo]}
                  >
                    <Text style={[styles.chipTexto, item.key === escolhido.key && styles.chipTextoAtivo]}>{item.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.carga}>
                <Text style={styles.cargaValor}>{formatKg(pontos[pontos.length - 1].load)}</Text>
                {variacao && (
                  <Text style={[styles.cargaVariacao, { color: variacao.positive ? brand.lime : brand.danger }]}>{variacao.text}</Text>
                )}
              </View>
              <StrengthChart points={pontos} />
            </>
          ) : (
            <EmptyChart
              title="Sem cargas ainda"
              text="Ao marcar um exercício no treino, anote o peso usado. A evolução de cada exercício aparece aqui."
            />
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Numero({ valor, rotulo, destaque = false }: { valor: string; rotulo: string; destaque?: boolean }) {
  return (
    <View style={styles.numero}>
      <Text style={[styles.numeroValor, destaque && { color: brand.lime }]}>{valor}</Text>
      <Text style={styles.numeroRotulo}>{rotulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18, paddingBottom: 32, paddingTop: 12 },
  header: { gap: 8 },
  h1: { ...type.h1, fontSize: 34, lineHeight: 39 },
  numeros: { flexDirection: "row", gap: 8 },
  numero: { backgroundColor: brand.surface, borderColor: brand.border, borderRadius: radius.md, borderWidth: 1, flex: 1, gap: 4, padding: 12 },
  numeroValor: { color: brand.text, fontFamily: font.display, fontSize: 22 },
  numeroRotulo: { ...type.label, fontSize: 9 },
  card: { backgroundColor: brand.surface, borderColor: brand.border, borderRadius: radius.lg, borderWidth: 1, gap: 12, padding: 16 },
  cardTitulo: { ...type.title, fontSize: 17 },
  cardSub: { ...type.caption, marginTop: -6 },
  chips: { gap: 8 },
  chip: { borderColor: brand.borderStrong, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  chipAtivo: { backgroundColor: brand.limeSoft, borderColor: brand.lime },
  chipTexto: { color: brand.text, fontFamily: font.displayMedium, fontSize: 12.5 },
  chipTextoAtivo: { color: brand.lime },
  carga: { alignItems: "baseline", flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cargaValor: { color: brand.text, fontFamily: font.display, fontSize: 28 },
  cargaVariacao: { fontFamily: font.displayMedium, fontSize: 13 },
});
