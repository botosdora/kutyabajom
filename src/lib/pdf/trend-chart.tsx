import { Circle, Line, Path, Svg, Text as SvgText, Text, View } from "@react-pdf/renderer";
import { addDays, daysBetween, formatShortDate } from "@/lib/format";
import { colors, s } from "./base";

// A Kimutatás diagramjának PDF-változata: ugyanaz a négy skála, ugyanazok a
// színek és sorrend (a validált paletta világos témás értékei).
const SERIES = [
  { key: "mood", label: "Kedv", color: "#2a78d6" },
  { key: "pain", label: "Fájdalom", color: "#eb6834" },
  { key: "appetite", label: "Étvágy", color: "#1baf7a" },
  { key: "activity", label: "Mozgás", color: "#eda100" },
] as const;

type Log = { day: string } & Record<(typeof SERIES)[number]["key"], number | null>;

const W = 523;
const H = 190;
const LEFT = 22;
const RIGHT = 8;
const TOP = 8;
const BOTTOM = 20;

export function PdfTrendChart({ title, logs, from, to }: { title: string; logs: Log[]; from: string; to: string }) {
  const span = daysBetween(from, to);
  const plotW = W - LEFT - RIGHT;
  const plotH = H - TOP - BOTTOM;
  // Egynapos időszaknál a pontok középre kerülnek.
  const x = (day: string) => LEFT + (span ? daysBetween(from, day) / span : 0.5) * plotW;
  const y = (v: number) => TOP + (1 - v / 10) * plotH;
  const sorted = [...logs].sort((a, b) => a.day.localeCompare(b.day));
  const showDots = sorted.length <= 31;

  // Legfeljebb 6 dátumfelirat egyenletesen elosztva.
  const tickCount = Math.min(6, span + 1);
  const ticks = span
    ? Array.from({ length: tickCount }, (_, i) => addDays(from, Math.round((i / (tickCount - 1)) * span)))
    : [from];

  // Egy skála vonala; ahol az érték nincs kitöltve, ott megszakad.
  const path = (key: (typeof SERIES)[number]["key"]) => {
    let d = "";
    let prevDay: string | null = null;
    for (const l of sorted) {
      const v = l[key];
      if (v === null) {
        prevDay = null;
        continue;
      }
      const cmd = prevDay ? "L" : "M";
      d += `${cmd}${x(l.day).toFixed(1)},${y(v).toFixed(1)} `;
      prevDay = l.day;
    }
    return d.trim();
  };

  // A cím a diagrammal együtt kerül új oldalra, ha nem fér ki.
  return (
    <View wrap={false} style={s.section}>
      <Text style={s.h2}>{title}</Text>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {[0, 2.5, 5, 7.5, 10].map((v) => (
          <Line key={v} x1={LEFT} x2={W - RIGHT} y1={y(v)} y2={y(v)} stroke={colors.border} strokeWidth={v === 0 ? 0.9 : 0.5} />
        ))}
        {[0, 5, 10].map((v) => (
          <SvgText key={v} x={LEFT - 6} y={y(v) + 2.5} textAnchor="end" style={{ fontSize: 7, fontFamily: "Inter" }} fill={colors.muted}>
            {String(v)}
          </SvgText>
        ))}
        {ticks.map((day, i) => (
          <SvgText
            key={day}
            x={x(day)}
            y={H - 6}
            textAnchor={ticks.length === 1 ? "middle" : i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
            style={{ fontSize: 7, fontFamily: "Inter" }}
            fill={colors.muted}
          >
            {formatShortDate(day)}
          </SvgText>
        ))}
        {SERIES.map((sr) => {
          const d = path(sr.key);
          return d ? (
            <Path key={sr.key} d={d} stroke={sr.color} strokeWidth={1.6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          ) : null;
        })}
        {showDots &&
          SERIES.flatMap((sr) =>
            sorted
              .filter((l) => l[sr.key] !== null)
              .map((l) => (
                <Circle key={`${sr.key}-${l.day}`} cx={x(l.day)} cy={y(l[sr.key]!)} r={2.2} fill={sr.color} stroke="#ffffff" strokeWidth={0.8} />
              )),
          )}
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 6 }}>
        {SERIES.map((sr) => (
          <View key={sr.key} style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 8 }}>
            <View style={{ width: 10, height: 2.5, borderRadius: 1, backgroundColor: sr.color, marginRight: 4 }} />
            <Text style={{ fontSize: 8.5, color: colors.text }}>{sr.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
