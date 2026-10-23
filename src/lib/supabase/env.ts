// A Supabase elérési adatai. Csak a szerveren használjuk őket.
// A cím végéről levágjuk az esetleg bemásolt "/rest/v1" részt és a perjelet.
export const supabaseUrl = (process.env.SUPABASE_URL ?? "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
export const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
