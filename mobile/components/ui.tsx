import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { brand, type } from "@/constants/brand";

/** Micro rótulo em caixa alta. */
export function Label({ children, color }: { children: ReactNode; color?: string }) {
  return <Text style={[type.label, color ? { color } : null]}>{children}</Text>;
}

/**
 * Cabeçalho de seção: rótulo + linha de circuito que termina em um nó ciano.
 * É o elemento de assinatura do app.
 */
export function SectionHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.head}>
      <Label>{title}</Label>
      <View style={styles.rule} />
      {right ?? <View style={styles.node} />}
    </View>
  );
}

/** Barra de progresso fina com nó na ponta, como um traço de circuito. */
export function TraceProgress({ ratio, color = brand.lime }: { ratio: number; color?: string }) {
  const clamped = Math.min(1, Math.max(0, ratio));
  return (
    <View style={styles.trace}>
      <View style={styles.traceTrack} />
      <View style={[styles.traceFill, { backgroundColor: color, width: `${clamped * 100}%` }]} />
      <View style={[styles.traceNode, { borderColor: color, left: `${clamped * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: "center", flexDirection: "row", gap: 10 },
  rule: { backgroundColor: brand.border, flex: 1, height: 1 },
  node: { borderColor: brand.cyan, borderRadius: 4, borderWidth: 1.5, height: 8, width: 8 },
  trace: { height: 10, justifyContent: "center" },
  traceTrack: { backgroundColor: brand.border, height: 2, left: 0, position: "absolute", right: 0 },
  traceFill: { height: 2, left: 0, position: "absolute" },
  traceNode: {
    backgroundColor: brand.background,
    borderRadius: 4,
    borderWidth: 1.5,
    height: 8,
    marginLeft: -4,
    position: "absolute",
    width: 8,
  },
});
