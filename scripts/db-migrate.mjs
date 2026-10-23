// Lefuttatja a supabase/migrations mappában lévő, még nem alkalmazott SQL fájlokat
// a Supabase Management API-n keresztül. Használat: npm run db:migrate
// Szükséges környezeti változók: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;
if (!token || !ref) {
  console.error("Hiányzik a SUPABASE_ACCESS_TOKEN vagy a SUPABASE_PROJECT_REF.");
  process.exit(1);
}

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${body}`);
  return JSON.parse(body);
}

await query(`
  create schema if not exists meta;
  create table if not exists meta.migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  );
`);

const applied = new Set((await query("select name from meta.migrations")).map((r) => r.name));
const dir = path.join(process.cwd(), "supabase", "migrations");
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  if (applied.has(file)) continue;
  const sql = await readFile(path.join(dir, file), "utf8");
  process.stdout.write(`${file} … `);
  await query(`begin;\n${sql}\ninsert into meta.migrations (name) values ('${file}');\ncommit;`);
  console.log("kész");
}
console.log("Az adatbázis naprakész.");
