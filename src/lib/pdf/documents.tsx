import "server-only";
import { renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { formatAge, formatDate, formatWeight, todayIso } from "@/lib/format";
import { eventKindLabel } from "@/lib/health";
import { average, observationLabel, OBSERVATIONS, rateScale, SCALES, STOOL_OPTIONS, stoolLabel } from "@/lib/journal";
import { categoryLabel, currentDosage, describeSchedule, isCurrent, MED_CATEGORIES, type MedicationWithPeriods } from "@/lib/medications";
import type { Tables } from "@/lib/database.types";
import { formatLabValue, formatRange, labStatus } from "@/lib/labs";
import { colors, Empty, PdfDoc, s, Section, Table } from "./base";
import { getDoseSummaries, type DoseSummary } from "@/lib/day-items";
import { PdfTrendChart } from "./trend-chart";

type Pet = Tables<"pets">;

function MedicationTables({ meds, today }: { meds: MedicationWithPeriods[]; today: string }) {
  if (meds.length === 0) return <Empty>Nincs rögzített gyógyszer.</Empty>;
  return (
    <>
      {MED_CATEGORIES.map((cat) => {
        const list = meds.filter((m) => m.category === cat.value);
        if (list.length === 0) return null;
        return (
          <Section key={cat.value} title={cat.label}>
            <Table
              columns={[
                { label: "Név", width: "28%" },
                { label: "Adag", width: "17%" },
                { label: "Ütemezés", width: "35%" },
                { label: "Megjegyzés", width: "20%" },
              ]}
              rows={list.map((m) => [m.name, currentDosage(m, m.medication_periods, today), describeSchedule(m, m.medication_periods, today), m.notes])}
            />
          </Section>
        );
      })}
    </>
  );
}

export async function medicationsPdf(pet: Pet) {
  const supabase = await createClient();
  const today = todayIso();
  const { data } = await supabase.from("medications").select("*, medication_periods(*)").eq("pet_id", pet.id).order("name");
  const meds = (data ?? []).filter((m) => isCurrent(m, m.medication_periods, today));
  return renderToBuffer(
    <PdfDoc title="Gyógyszerek és kiegészítők" subtitle={`${pet.name} · jelenleg szedett szerek`}>
      <MedicationTables meds={meds} today={today} />
    </PdfDoc>,
  );
}

export async function healthPdf(pet: Pet) {
  const supabase = await createClient();
  const [weights, allergies, conditions, meds, vaccinations, events, vets, labs] = await Promise.all([
    supabase.from("weights").select("*").eq("pet_id", pet.id).order("measured_on", { ascending: false }).limit(12),
    supabase.from("allergies").select("*").eq("pet_id", pet.id).order("name"),
    supabase.from("conditions").select("*").eq("pet_id", pet.id).order("active", { ascending: false }).order("name"),
    supabase.from("medications").select("*, medication_periods(*)").eq("pet_id", pet.id).order("name"),
    supabase.from("vaccinations").select("*, vets(name)").eq("pet_id", pet.id).order("vaccinated_on", { ascending: false }),
    supabase.from("medical_events").select("*, vets(name)").eq("pet_id", pet.id).order("event_date", { ascending: false }),
    supabase.from("vets").select("*").eq("pet_id", pet.id).order("name"),
    supabase.from("lab_results").select("*").eq("pet_id", pet.id).order("measured_on", { ascending: false }),
  ]);
  // Paraméterenként a legutóbbi laborérték.
  const firstLab = new Map<string, Tables<"lab_results">>();
  for (const r of labs.data ?? []) if (!firstLab.has(r.parameter)) firstLab.set(r.parameter, r);
  const latest = weights.data?.[0];
  const today = todayIso();
  const currentMeds = (meds.data ?? []).filter((m) => isCurrent(m, m.medication_periods, today));
  const facts = [
    ["Fajta", pet.breed],
    ["Születés", pet.birth_date ? `${formatDate(pet.birth_date)} (${formatAge(pet.birth_date) ?? ""})` : null],
    ["Nem", pet.sex === "kan" ? "Kan" : pet.sex === "szuka" ? "Szuka" : null],
    ["Chipszám", pet.chip_number],
    ["Súly", latest ? `${formatWeight(Number(latest.weight_kg))} (${formatDate(latest.measured_on)})` : null],
  ];

  return renderToBuffer(
    <PdfDoc title="Egészségügyi összesítő" subtitle={`${pet.name} · állatorvosi konzultációhoz`}>
      <Section title="Adatok">
        <View style={s.facts}>
          {facts.map(([label, value]) => (
            <View key={label} style={s.fact}>
              <Text style={s.label}>{label}</Text>
              <Text>{value || "–"}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Allergiák">
        {allergies.data?.length ? (
          allergies.data.map((a) => (
            <Text key={a.id}>
              • {a.name}
              {a.notes ? ` – ${a.notes}` : ""}
            </Text>
          ))
        ) : (
          <Empty>Nincs ismert allergia.</Empty>
        )}
      </Section>

      <Section title="Betegségek">
        {conditions.data?.length ? (
          conditions.data.map((c) => (
            <Text key={c.id}>
              • {c.name}
              {c.active ? "" : " (elmúlt)"}
              {c.diagnosed_on ? `, diagnózis: ${formatDate(c.diagnosed_on)}` : ""}
              {c.notes ? ` – ${c.notes}` : ""}
            </Text>
          ))
        ) : (
          <Empty>Nincs ismert betegség.</Empty>
        )}
      </Section>

      <Section title="Jelenlegi gyógyszerek és kiegészítők">
        {currentMeds.length ? (
          <Table
            columns={[
              { label: "Név", width: "30%" },
              { label: "Kategória", width: "16%" },
              { label: "Adag", width: "18%" },
              { label: "Ütemezés", width: "36%" },
            ]}
            rows={currentMeds.map((m) => [m.name, categoryLabel(m.category), currentDosage(m, m.medication_periods, today), describeSchedule(m, m.medication_periods, today)])}
          />
        ) : (
          <Empty>Nincs.</Empty>
        )}
      </Section>

      <Section title="Oltások">
        {vaccinations.data?.length ? (
          <Table
            columns={[
              { label: "Dátum", width: "20%" },
              { label: "Oltás", width: "25%" },
              { label: "Készítmény", width: "25%" },
              { label: "Érvényes", width: "15%" },
              { label: "Orvos", width: "15%" },
            ]}
            rows={vaccinations.data.map((v) => [
              formatDate(v.vaccinated_on),
              v.vaccine,
              v.product_name,
              v.valid_until ? formatDate(v.valid_until) : null,
              v.vets?.name,
            ])}
          />
        ) : (
          <Empty>Nincs rögzített oltás.</Empty>
        )}
      </Section>

      <Section title="Orvosi beavatkozások">
        {events.data?.length ? (
          <Table
            columns={[
              { label: "Dátum", width: "17%" },
              { label: "Esemény", width: "25%" },
              { label: "Típus", width: "12%" },
              { label: "Részletek", width: "46%" },
            ]}
            rows={events.data.map((e) => [
              formatDate(e.event_date),
              e.title + (e.vets?.name ? `\n${e.vets.name}` : ""),
              eventKindLabel(e.kind),
              e.description,
            ])}
          />
        ) : (
          <Empty>Nincs rögzített esemény.</Empty>
        )}
      </Section>

      {firstLab.size > 0 && (
        <Section title="Laborértékek (legutóbbi)">
          <Table
            columns={[
              { label: "Paraméter", width: "30%" },
              { label: "Érték", width: "22%" },
              { label: "Referencia", width: "26%" },
              { label: "Dátum", width: "22%" },
            ]}
            rows={[...firstLab.values()]
              .sort((a, b) => a.parameter.localeCompare(b.parameter, "hu"))
              .map((r) => {
                const st = labStatus(Number(r.value), r.ref_low, r.ref_high);
                return [
                  r.parameter,
                  formatLabValue(Number(r.value), r.unit) + (st === "low" ? " ↓" : st === "high" ? " ↑" : ""),
                  formatRange(r.ref_low, r.ref_high, r.unit),
                  formatDate(r.measured_on),
                ];
              })}
          />
        </Section>
      )}

      {!!weights.data?.length && (
        <Section title="Súlymérések">
          <Text>
            {weights.data
              .map((w) => `${formatDate(w.measured_on)}: ${formatWeight(Number(w.weight_kg))}${w.body_condition ? ` (BCS ${w.body_condition}/9)` : ""}`)
              .join("   ·   ")}
          </Text>
        </Section>
      )}

      {!!vets.data?.length && (
        <Section title="Orvosok">
          {vets.data.map((v) => (
            <Text key={v.id}>
              • {v.name}
              {[v.clinic, v.phone, v.email].filter(Boolean).length ? ` – ${[v.clinic, v.phone, v.email].filter(Boolean).join(", ")}` : ""}
            </Text>
          ))}
        </Section>
      )}
    </PdfDoc>,
  );
}

const DOSE_STATUS_PDF: Record<string, string> = { given: "beadva", missed: "kimaradt", refused: "elutasította" };

function JournalDay({ log, day, doses }: { log: Tables<"daily_logs"> | null; day: string; doses: DoseSummary | undefined }) {
  const scales = log ? SCALES.filter((sc) => log[sc.key] !== null) : [];
  const tags = log ? [stoolLabel(log.stool) && `Széklet: ${stoolLabel(log.stool)}`, ...log.observations.map(observationLabel)].filter(Boolean) : [];
  return (
    <View style={j.day} wrap={false}>
      <View style={j.dayHead}>
        <Text style={j.date}>{formatDate(day)}</Text>
        {doses && doses.total > 0 && (
          <Text style={[j.small, doses.given === doses.total ? j.ok : s.muted]}>
            {doses.given} / {doses.total} adag beadva
          </Text>
        )}
      </View>
      {scales.length > 0 && (
        <View style={j.chips}>
          {scales.map((sc) => {
            const value = log![sc.key]!;
            return (
              <Text key={sc.key} style={j.chip}>
                {sc.short}: <Text style={j.bold}>{value}</Text> ({rateScale(sc.kind, value).word.toLowerCase()})
              </Text>
            );
          })}
        </View>
      )}
      {log && (log.pain_duration || log.water_ml != null) && (
        <Text style={[j.small, s.muted]}>
          {[log.pain_duration && `Fájdalom időtartama: ${log.pain_duration}`, log.water_ml != null && `Víz: ${log.water_ml} ml`].filter(Boolean).join(" · ")}
        </Text>
      )}
      {tags.length > 0 && <Text style={j.line}>{tags.join(" · ")}</Text>}
      {doses && doses.doses.length > 0 && (
        <View style={j.doses}>
          {doses.doses.map((d, i) => (
            <View key={i} style={j.doseRow}>
              <Text style={j.doseTime}>{d.time}</Text>
              <Text style={j.doseName}>
                {d.name}
                {d.dosage ? ` · ${d.dosage}` : ""}
              </Text>
              <Text style={[j.doseStatus, d.status === "given" ? j.ok : d.status ? j.bad : s.muted]}>
                {d.status ? DOSE_STATUS_PDF[d.status] : "nincs rögzítve"}
                {d.status === "given" && d.givenAt && d.givenAt !== d.time ? ` (${d.givenAt})` : ""}
              </Text>
            </View>
          ))}
        </View>
      )}
      {log?.notes && <Text style={j.notes}>{log.notes}</Text>}
      {!log && <Text style={[j.small, s.muted]}>Erre a napra nincs naplóbejegyzés.</Text>}
    </View>
  );
}

const j = StyleSheet.create({
  day: { borderWidth: 0.75, borderColor: colors.border, borderRadius: 6, padding: 8, marginBottom: 7 },
  dayHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 },
  date: { fontSize: 11, fontWeight: 700 },
  chips: { flexDirection: "row", flexWrap: "wrap", marginBottom: 3 },
  chip: { fontSize: 9, backgroundColor: colors.soft, borderRadius: 4, paddingVertical: 2, paddingHorizontal: 5, marginRight: 4, marginBottom: 3 },
  bold: { fontWeight: 700 },
  small: { fontSize: 8.5 },
  line: { fontSize: 9, marginBottom: 3 },
  doses: { borderTopWidth: 0.5, borderTopColor: colors.border, paddingTop: 3, marginTop: 2 },
  doseRow: { flexDirection: "row", paddingVertical: 1.5 },
  doseTime: { width: 36, fontSize: 9, color: colors.muted },
  doseName: { flex: 1, fontSize: 9 },
  doseStatus: { width: 110, fontSize: 9, textAlign: "right" },
  ok: { color: "#2e7a43" },
  bad: { color: "#b42318" },
  notes: { fontSize: 9, backgroundColor: colors.soft, borderRadius: 4, padding: 5, marginTop: 4 },
});

export async function journalPdf(pet: Pet, from: string, to: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("pet_id", pet.id)
    .gte("day", from)
    .lte("day", to)
    .order("day");
  const logs = data ?? [];
  const doseSummaries = await getDoseSummaries(pet.id, from, to);
  const count = (pred: (l: Tables<"daily_logs">) => boolean) => logs.filter(pred).length;

  // Minden nap, amelyre van naplóbejegyzés vagy legalább egy rögzített adag.
  const logByDay = new Map(logs.map((l) => [l.day, l]));
  const days = [
    ...new Set([...logByDay.keys(), ...[...doseSummaries].filter(([, d]) => d.doses.some((x) => x.status)).map(([day]) => day)]),
  ].sort();

  return renderToBuffer(
    <PdfDoc title="Napló kimutatás" subtitle={`${pet.name} · ${formatDate(from)} – ${formatDate(to)} · ${logs.length} bejegyzés`}>
      {days.length === 0 ? (
        <Empty>Ebben az időszakban nincs naplóbejegyzés.</Empty>
      ) : (
        <>
          {logs.length > 0 && (
            <>
              <Section title="Átlagok (0–10)">
                <View style={s.facts}>
                  {SCALES.map((sc) => (
                    <View key={sc.key} style={s.fact}>
                      <Text style={s.label}>{sc.label}</Text>
                      <Text>{average(logs.map((l) => l[sc.key]))?.toLocaleString("hu-HU") ?? "–"}</Text>
                    </View>
                  ))}
                </View>
              </Section>
              <Section title="Széklet és megfigyelések (napok száma)">
                <Text>
                  {[
                    ...STOOL_OPTIONS.map((o) => [o.label, count((l) => l.stool === o.value)] as const),
                    ...OBSERVATIONS.map((o) => [o.label, count((l) => l.observations.includes(o.value))] as const),
                  ]
                    .filter(([, n]) => n > 0)
                    .map(([label, n]) => `${label}: ${n}`)
                    .join("   ·   ") || "Nincs adat."}
                </Text>
              </Section>
            </>
          )}
          <Section title="Napi bejegyzések">
            {days.map((day) => (
              <JournalDay key={day} day={day} log={logByDay.get(day) ?? null} doses={doseSummaries.get(day)} />
            ))}
          </Section>
          {logs.length > 0 && (
            <PdfTrendChart title="Diagram (0–10)" logs={logs} from={from} to={to} />
          )}
        </>
      )}
    </PdfDoc>,
  );
}

export function defaultJournalRange(tol?: string | null, ig?: string | null) {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  const to = ig && re.test(ig) ? ig : todayIso();
  const from = tol && re.test(tol) ? tol : new Date(Date.parse(`${to}T12:00:00Z`) - 29 * 86400000).toISOString().slice(0, 10);
  return { from, to };
}
