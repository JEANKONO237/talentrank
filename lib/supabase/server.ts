import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database, ProfileRow } from "./database.types";
import { supabaseEnv } from "./env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Server client tied to the current request's cookies. Use inside Server
// Components, Server Actions, and Route Handlers. Each call creates a fresh
// client (cookies() is request-scoped).
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options as CookieOptions);
          }
        } catch {
          // Server Components can't set cookies; the middleware does it on the next request.
        }
      },
    },
  });
}

export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return (data as ProfileRow | null) ?? null;
}
