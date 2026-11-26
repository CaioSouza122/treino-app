import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";

import { brand, font, radius, type } from "@/constants/brand";
import { nivelVoltagem } from "@/lib/progress";

/** Chip compacto do topo do Coach: raio aceso quando há sequência. */
export function VoltagemChip({ volts }: { volts: number }) {
  const ligado = volts > 0;
  return (
    <View accessibilityLabel={`Voltagem: ${volts} dias em sequência`} style={[styles.chip, ligado && styles.chipOn]}>
      <MaterialIcons name="bolt" size={16} color={ligado ? brand.lime : brand.dim} />
      <Text style={[styles.chipText, ligado && styles.chipTextOn]}>{volts}V</Text>
    </View>
  );
}

/** Cartão da Voltagem: barra de carga em 7 segmentos (uma semana) e o próximo nível. */
export function VoltagemCard({ volts }: { volts: number }) {
  const nivel = nivelVoltagem(volts);
  const acesos = volts === 0 ? 0 : ((volts - 1) % 7) + 1;
  return (
    <View style={styles.card}>
      <View style={styles.topo}>
        <View style={[styles.icone, volts > 0 && styles.iconeOn]}>
          <MaterialIcons name="bolt" size={30} color={volts > 0 ? brand.onLime : brand.dim} />
        </View>
        <View style={styles.textos}>
          <Text style={styles.rotulo}>Voltagem</Text>
          <Text style={styles.valor}>
            {volts}V <Text style={styles.nivel}>· {nivel.nome}</Text>
          </Text>
        </View>
      </View>
      <View style={styles.bateria}>
        {Array.from({ length: 7 }, (_, i) => (
          <View key={i} style={[styles.celula, i < acesos && styles.celulaOn]} />
        ))}
      </View>
      <Text style={styles.dica}>
        {volts === 0
          ? "Marque um exercício hoje para ligar a sua carga."
          : nivel.faltam
            ? `Faltam ${nivel.faltam} ${nivel.faltam === 1 ? "dia" : "dias"} de treino para ${nivel.proximo}. Um dia de descanso não apaga a carga; dois seguidos, sim.`
            : "Nível máximo. Mantenha a usina ligada!"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { alignItems: "center", borderColor: brand.border, borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 2, paddingHorizontal: 8, paddingVertical: 4 },
  chipOn: { backgroundColor: brand.limeSoft, borderColor: brand.lime },
  chipText: { color: brand.dim, fontFamily: font.display, fontSize: 13 },
  chipTextOn: { color: brand.lime },
  card: { backgroundColor: brand.surface, borderColor: brand.borderStrong, borderRadius: radius.lg, borderWidth: 1, gap: 14, padding: 18 },
  topo: { alignItems: "center", flexDirection: "row", gap: 14 },
  icone: { alignItems: "center", backgroundColor: brand.raised, borderRadius: radius.md, height: 52, justifyContent: "center", width: 52 },
  iconeOn: { backgroundColor: brand.lime },
  textos: { flex: 1, gap: 2 },
  rotulo: { ...type.label },
  valor: { color: brand.text, fontFamily: font.display, fontSize: 26 },
  nivel: { color: brand.lime, fontFamily: font.displayMedium, fontSize: 15 },
  bateria: { flexDirection: "row", gap: 6 },
  celula: { backgroundColor: brand.raised, borderRadius: 4, flex: 1, height: 10 },
  celulaOn: { backgroundColor: brand.lime },
  dica: { ...type.caption },
});
