import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AdminFlagsClient } from "@/components/admin/AdminFlagsClient";

// ─────────────────────────────────────────────────────────────────────────────
// /admin/flags — file de modération des flags anti-cheat.
//
// Server Component : gates is_admin + fetch des données. Délègue l'UI
// interactive au client AdminFlagsClient.
//
// Données fetchées :
//   - flags pending + reviewed (last 30 days) avec attempt + talent join
//   - lockouts actifs (expires_at > now)
//   - compteurs résumé par severity / status
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

interface FlagWithContext {
  id: string;
  attempt_id: string;
  talent_id: string;
  code: string;
  severity: "low" | "medium" | "high";
  detail: string;
  review_status: "pending" | "reviewed" | "confirmed" | "dismissed";
  created_at: string;
  reviewed_at: string | null;
  review_note: string | null;
  // Joined
  talent_username: string | null;
  talent_display_name: string | null;
  attempt_profession_id: string | null;
  attempt_final_score: number | null;
  attempt_status: string | null;
}

interface LockoutRow {
  id: string;
  talent_id: string | null;
  fingerprint_hash: string | null;
  ip_hash: string | null;
  profession_id: string | null;
  expires_at: string;
  reason: string;
  created_at: string;
  created_by: string | null;
}

export default async function AdminFlagsPage() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();

  // ── Fetch flags (last 30 days) + join talent + attempt ─────────────
  // Note : utilise la PostgREST join syntax `profiles!inner(...)`. Si les
  // FKs ne sont pas auto-détectées par PostgREST, il faut spécifier
  // l'aliasing explicite (voir SQL relations).
  const { data: rawFlags, error: flagsError } = await supabase
    .from("qcm_flags")
    .select(`
      id, attempt_id, talent_id, code, severity, detail,
      review_status, created_at, reviewed_at, review_note,
      profiles:talent_id ( username, display_name ),
      qcm_attempts:attempt_id ( profession_id, final_score, status )
    `)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(200);

  if (flagsError) {
    console.error("Failed to load qcm_flags:", flagsError);
  }

  // Flatten en shape stable pour le client
  const flags: FlagWithContext[] = (rawFlags ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      attempt_id: string;
      talent_id: string;
      code: string;
      severity: "low" | "medium" | "high";
      detail: string;
      review_status: FlagWithContext["review_status"];
      created_at: string;
      reviewed_at: string | null;
      review_note: string | null;
      profiles: { username: string | null; display_name: string | null } | null;
      qcm_attempts: { profession_id: string | null; final_score: number | null; status: string | null } | null;
    };
    return {
      id: r.id,
      attempt_id: r.attempt_id,
      talent_id: r.talent_id,
      code: r.code,
      severity: r.severity,
      detail: r.detail,
      review_status: r.review_status,
      created_at: r.created_at,
      reviewed_at: r.reviewed_at,
      review_note: r.review_note,
      talent_username: r.profiles?.username ?? null,
      talent_display_name: r.profiles?.display_name ?? null,
      attempt_profession_id: r.qcm_attempts?.profession_id ?? null,
      attempt_final_score: r.qcm_attempts?.final_score ?? null,
      attempt_status: r.qcm_attempts?.status ?? null,
    };
  });

  // ── Fetch lockouts actifs ─────────────────────────────────────────
  const { data: lockoutsRaw } = await supabase
    .from("qcm_lockouts")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true })
    .limit(50);

  const lockouts: LockoutRow[] = (lockoutsRaw ?? []) as LockoutRow[];

  // ── Compteurs résumé ──────────────────────────────────────────────
  const summary = {
    total: flags.length,
    pending: flags.filter((f) => f.review_status === "pending").length,
    high: flags.filter((f) => f.severity === "high" && f.review_status === "pending").length,
    confirmed: flags.filter((f) => f.review_status === "confirmed").length,
    dismissed: flags.filter((f) => f.review_status === "dismissed").length,
    activeLockouts: lockouts.length,
  };

  return (
    <main className="container-page pt-12 pb-20">
      <header className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400">
          Admin · Modération
        </p>
        <h1
          className="mt-2 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(2rem, 4vw, 2.8rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.02em",
          }}
        >
          File de revue anti-cheat
        </h1>
        <p className="mt-3 text-[14px] text-mist-300 max-w-2xl leading-relaxed">
          Tous les flags QCM des 30 derniers jours. Chaque flag peut être
          confirmé (= triche), dismiss (= faux positif), ou marqué reviewed
          sans action. Les lockouts auto-posés à 2× high sont visibles en bas.
        </p>
      </header>

      <Suspense fallback={<p className="text-mist-400">Chargement…</p>}>
        <AdminFlagsClient flags={flags} lockouts={lockouts} summary={summary} />
      </Suspense>
    </main>
  );
}
