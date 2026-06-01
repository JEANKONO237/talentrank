import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseEnv, isSupabaseConfigured } from "./env";

// Run on every request: refresh the auth session cookie (otherwise it expires
// silently and the user gets unexpectedly logged out). If Supabase isn't
// configured, no-op — we keep the app running on mock data.
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response;

  type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };
  const supabase = createServerClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touches the session — refreshes the JWT if needed.
  await supabase.auth.getUser();

  return response;
}
