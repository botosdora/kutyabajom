// Legenerálja az adatbázis TypeScript típusait: npm run db:types
import { writeFile } from "node:fs/promises";

const { SUPABASE_ACCESS_TOKEN: token, SUPABASE_PROJECT_REF: ref } = process.env;
const res = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/types/typescript?included_schemas=public`,
  { headers: { Authorization: `Bearer ${token}` } },
);
if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
await writeFile("src/lib/database.types.ts", (await res.json()).types);
console.log("src/lib/database.types.ts frissítve.");
