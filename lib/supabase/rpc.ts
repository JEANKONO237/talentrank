// Helpers that bypass supabase-js's TS inference for writes & RPCs.
// Runtime behavior is identical; we rely on Zod (in server actions) +
// Postgres constraints + RLS for the real safety layer.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;

export function rpc(client: unknown, fn: string, args?: Record<string, unknown>) {
  return (client as Loose).rpc(fn, args);
}

export function db(client: unknown): Loose {
  return client as Loose;
}
