import path from "node:path";
import type { ReactNode } from "react";
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(process.cwd(), "src/fonts/Inter-Regular.ttf") },
    { src: path.join(process.cwd(), "src/fonts/Inter-Bold.ttf"), fontWeight: 700 },
  ],
});
// Magyar szavak elválasztását kikapcsoljuk, hogy ne törjön furcsán.
Font.registerHyphenationCallback((word) => [word]);

export const colors = { text: "#1c2230", muted: "#5b6275", border: "#dde0e8", accent: "#3346c9", soft: "#f4f5f8" };

export const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 10, color: colors.text, padding: 36, paddingBottom: 48 },
  header: { borderBottomWidth: 2, borderBottomColor: colors.accent, paddingBottom: 8, marginBottom: 14 },
  brand: { fontSize: 9, color: colors.accent, fontWeight: 700 },
  title: { fontSize: 18, fontWeight: 700, marginTop: 2 },
  subtitle: { fontSize: 10, color: colors.muted, marginTop: 2 },
  section: { marginBottom: 14 },
  h2: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: colors.border, paddingVertical: 4 },
  headRow: { flexDirection: "row", backgroundColor: colors.soft, paddingVertical: 4, fontWeight: 700 },
  cell: { paddingHorizontal: 4 },
  muted: { color: colors.muted },
  small: { fontSize: 8.5 },
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, fontSize: 8, color: colors.muted, flexDirection: "row", justifyContent: "space-between" },
  facts: { flexDirection: "row", flexWrap: "wrap" },
  fact: { width: "33%", marginBottom: 6 },
  label: { fontSize: 8, color: colors.muted, textTransform: "uppercase" },
});

export function PdfDoc({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const generated = new Intl.DateTimeFormat("hu-HU", { dateStyle: "long", timeZone: "Europe/Budapest" }).format(new Date());
  return (
    <Document title={title} author="Kutyabajom" language="hu">
      <Page size="A4" style={s.page} wrap>
        <View style={s.header} fixed>
          <Text style={s.brand}>KUTYABAJOM</Text>
          <Text style={s.title}>{title}</Text>
          <Text style={s.subtitle}>{subtitle}</Text>
        </View>
        {children}
        <View style={s.footer} fixed>
          <Text>Készült: {generated}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.h2} minPresenceAhead={40}>
        {title}
      </Text>
      {children}
    </View>
  );
}

// Egyszerű táblázat: oszlopszélességek százalékban.
export function Table({ columns, rows }: { columns: { label: string; width: string }[]; rows: (string | null | undefined)[][] }) {
  return (
    <View>
      <View style={s.headRow} fixed>
        {columns.map((c) => (
          <Text key={c.label} style={[s.cell, { width: c.width }]}>
            {c.label}
          </Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={s.row} wrap={false}>
          {r.map((value, j) => (
            <Text key={j} style={[s.cell, { width: columns[j].width }]}>
              {value || "–"}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <Text style={s.muted}>{children}</Text>;
}

export function pdfResponse(buffer: Buffer, fileName: string) {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export function fileSlug(name: string) {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "-").toLowerCase();
}
