// Centralised env access. Single place to ask "do we have Supabase wired?".
// We *don't* throw if envs are missing — the app must still build & run on
// mock data so the founder can demo without a Supabase project.

export const supabaseEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export const isSupabaseConfigured =
  supabaseEnv.url.length > 0 && supabaseEnv.anonKey.length > 0;
