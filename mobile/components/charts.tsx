import { useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from "react-native-svg";

import { brand, font, type } from "@/constants/brand";
import { formatKg, shortDate, type StrengthPoint, type WeekStat } from "@/lib/progress";

function useWidth(initial = 300) {
  const [width, setWidth] = useState(initial);
  return { width, onLayout: (event: LayoutChangeEvent) => setWidth(Math.max(120, event.nativeEvent.layout.width)) };
}

/* ── Frequência semanal ─────────────────────────────────────────────────── */

/**
 * Uma coluna por semana. O contorno marca quantos treinos estavam planejados;
 * o preenchimento lima, quantos dias foram concluídos.
 */
export function FrequencyChart({ weeks, height = 124 }: { weeks: WeekStat[]; height?: number }) {
  const { width, onLayout } = useWidth();
  const labelH = 18;
  const top = 8;
  const plotH = height - labelH - top;
  const maxValue = Math.max(1, ...weeks.map((week) => Math.max(week.planned, week.done)));
  const slot = width / weeks.length;
  const barW = Math.min(20, slot * 0.46);

  return (
    <View onLayout={onLayout}>
      <Svg width={width} height={height}>
        <Line x1={0} x2={width} y1={top + plotH} y2={top + plotH} stroke={brand.border} strokeWidth={1} />
        {weeks.map((week, index) => {
          const x = slot * index + (slot - barW) / 2;
          const plannedH = (week.planned / maxValue) * plotH;
          const doneH = (Math.min(week.done, maxValue) / maxValue) * plotH;
          return (
            <G key={week.start}>
              <Rect
                x={x}
                y={top + plotH - plannedH}
                width={barW}
                height={plannedH}
                rx={3}
                fill="none"
                stroke={week.current ? brand.borderStrong : brand.border}
                strokeWidth={1}
              />
              {doneH > 0 && (
                <Rect
                  x={x}
                  y={top + plotH - doneH}
                  width={barW}
                  height={doneH}
                  rx={3}
                  fill={brand.lime}
                  opacity={week.current ? 1 : 0.7}
                />
              )}
              <SvgText
                x={x + barW / 2}
                y={height - 4}
                fontSize={9.5}
                fontFamily={font.displayMedium}
                fill={week.current ? brand.lime : brand.dim}
                textAnchor="middle"
              >
                {week.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

/* ── Evolução de força ──────────────────────────────────────────────────── */

export function StrengthChart({ points, height = 150 }: { points: StrengthPoint[]; height?: number }) {
  const { width, onLayout } = useWidth();
  if (!points.length) return null;

  const padLeft = 34;
  const padRight = 10;
  const top = 12;
  const labelH = 20;
  const plotW = width - padLeft - padRight;
  const plotH = height - top - labelH;

  const loads = points.map((point) => point.load);
  let min = Math.min(...loads);
  let max = Math.max(...loads);
  if (min === max) {
    min -= 5;
    max += 5;
  } else {
    const pad = (max - min) * 0.15;
    min -= pad;
    max += pad;
  }

  const xFor = (index: number) => padLeft + (points.length === 1 ? plotW / 2 : (plotW * index) / (points.length - 1));
  const yFor = (load: number) => top + plotH - ((load - min) / (max - min)) * plotH;

  const coords = points.map((point, index) => ({ x: xFor(index), y: yFor(point.load), point }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const area = `${coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ")} ${coords[coords.length - 1].x.toFixed(1)},${top + plotH} ${coords[0].x.toFixed(1)},${top + plotH}`;
  const ticks = [max, (max + min) / 2, min];
  const last = coords[coords.length - 1];

  return (
    <View onLayout={onLayout}>
      <Svg width={width} height={height}>
        {ticks.map((tick) => (
          <G key={tick}>
            <Line x1={padLeft} x2={width - padRight} y1={yFor(tick)} y2={yFor(tick)} stroke={brand.border} strokeWidth={1} strokeDasharray="2 4" />
            <SvgText x={padLeft - 8} y={yFor(tick) + 3} fontSize={9.5} fontFamily={font.displayMedium} fill={brand.dim} textAnchor="end">
              {Math.round(tick)}
            </SvgText>
          </G>
        ))}
        {points.length > 1 && <Polygon points={area} fill={brand.lime} opacity={0.08} />}
        {points.length > 1 && (
          <Path d={line} stroke={brand.lime} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        )}
        {coords.slice(0, -1).map((c) => (
          <Circle key={c.point.date} cx={c.x} cy={c.y} r={3.2} fill={brand.background} stroke={brand.lime} strokeWidth={1.6} />
        ))}
        <Circle cx={last.x} cy={last.y} r={4.6} fill={brand.lime} />
        <SvgText x={padLeft} y={height - 4} fontSize={9.5} fontFamily={font.displayMedium} fill={brand.dim} textAnchor="start">
          {shortDate(points[0].date)}
        </SvgText>
        {points.length > 1 && (
          <SvgText x={width - padRight} y={height - 4} fontSize={9.5} fontFamily={font.displayMedium} fill={brand.lime} textAnchor="end">
            {shortDate(points[points.length - 1].date)}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

/** Texto de variação: "+7,5 kg desde 12/10". */
export function strengthDelta(points: StrengthPoint[]): { text: string; positive: boolean } | null {
  if (points.length < 2) return null;
  const diff = points[points.length - 1].load - points[0].load;
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "";
  return { text: `${sign}${formatKg(Math.abs(diff))} desde ${shortDate(points[0].date)}`, positive: diff >= 0 };
}

export function EmptyChart({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { borderColor: brand.border, borderRadius: 12, borderStyle: "dashed", borderWidth: 1, gap: 4, padding: 16 },
  emptyTitle: { ...type.title, fontSize: 14 },
  emptyText: { ...type.caption },
});
