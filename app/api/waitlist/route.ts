import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/waitlist
//
// Audit Sasha G3-Sasha-1 : waitlist localStorage = 0 email capté côté serveur
// = launch day = 0 destinataire. Cette route POST l'email + role en DB
// (Supabase si configuré) sinon dans les logs server (mode démo).
//
// Body : { email: string, role: 'talent' | 'studio' | 'curious' }
//
// Réponses :
//   200 { ok: true } — inscrit
//   200 { ok: true, alreadyIn: true } — déjà sur la liste
//   400 — payload invalide
//   500 — erreur DB
// ─────────────────────────────────────────────────────────────────────────────

export const runtime = "nodejs";

interface WaitlistBody {
  email?: unknown;
  role?: unknown;
  feature?: unknown;
}

export async function POST(req: NextRequest) {
  let body: WaitlistBody;
  try {
    body = (await req.json()) as WaitlistBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = typeof body.role === "string" ? body.role : "curious";
  const feature = typeof body.feature === "string" ? body.feature : null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Email invalide." }, { status: 400 });
  }
  if (!["talent", "studio", "curious"].includes(role)) {
    return NextResponse.json({ ok: false, error: "Role invalide." }, { status: 400 });
  }

  // ─── Mode RÉEL : Supabase insert ────────────────────────────────────
  if (isSupabaseConfigured) {
    try {
      const supabase = await getSupabaseServerClient();
      // supabase-js 2.106 a un bug d'inférence sur cette Insert (`never[]`).
      // Runtime OK. TODO : régénérer les types via `supabase gen types` une
      // fois le projet linké.
      const { error } = await supabase
        .from("waitlist")
        // @ts-expect-error see note above
        .insert({
          email,
          role,
          feature,
          source: req.headers.get("referer") ?? null,
        });
      if (error) {
        // Si table waitlist n'existe pas (migration pas appliquée), fallback log
        if (error.code === "42P01") {
          console.warn(
            "[waitlist] Table 'waitlist' missing — apply migration. Email captured in logs only:",
            { email, role, feature },
          );
          return NextResponse.json({ ok: true, mode: "log-fallback" });
        }
        // Email déjà inscrit (unique constraint violation)
        if (error.code === "23505") {
          return NextResponse.json({ ok: true, alreadyIn: true });
        }
        console.error("[waitlist] DB error:", error);
        return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error("[waitlist] Unexpected:", err);
      return NextResponse.json({ ok: false, error: "Unexpected" }, { status: 500 });
    }
  }

  // ─── Mode DÉMO : log server-side ────────────────────────────────────
  console.log("[waitlist · demo mode]", { email, role, feature, ts: new Date().toISOString() });
  return NextResponse.json({ ok: true, mode: "demo" });
}
