import { createClient } from "@supabase/supabase-js";
export function supabaseConfig() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || !key)
    throw new Error(
      "Connect the Boys & Girlz Supabase project in .env before starting the app.",
    );
  if(!key.startsWith('sb_publishable_')) {let role='';try{role=JSON.parse(Buffer.from(key.split('.')[1]||'','base64url').toString()).role;}catch{/* Invalid keys fail closed below. */}if(role!=='anon')throw new Error('SUPABASE_ANON_KEY must be a public publishable/anon key.');}
  return { url, key };
}
export function publicSupabase() {
  const { url, key } = supabaseConfig();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export function storageSupabase() {
  const { url } = supabaseConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Supabase Storage server key is not configured.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
