"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

// Singleton browser client. The cookie auth integration lets us share auth
// state between client and server components.
let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (_client) return _client;
  _client = createBrowserClient<Database>(supabaseEnv.url, supabaseEnv.anonKey);
  return _client;
}
