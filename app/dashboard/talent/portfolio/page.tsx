import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Film, Settings2 } from "lucide-react";
import { PortfolioManager } from "@/components/dashboard/PortfolioManager";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { PortfolioItemRow } from "@/lib/supabase/database.types";

export const metadata = { title: "Mon portfolio — TalentRank" };

// ─────────────────────────────────────────────────────────────────────────────
// Page portfolio — migration cream + FR (#38).
//
// Sans Supabase configuré, on affiche une carte d'aide propre au lieu de
// l'ancien écran Aurora dark + anglais. La doc setup est dans SUPABASE_SETUP.md.
// ─────────────────────────────────────────────────────────────────────────────

export default async function PortfolioPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="container-page pt-12 pb-20 max-w-2xl mx-auto">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400 inline-flex items-center gap-1.5">
          <Film className="h-3 w-3 text-amber-700" strokeWidth={2.8} />
          Portfolio
        </p>
        <h1
          className="mt-3 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(1.6rem, 3.2vw, 2.2rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
          }}
        >
          Branche Supabase pour gérer ton portfolio.
        </h1>
        <p className="mt-3 text-[14px] text-mist-300 leading-relaxed">
          La gestion de portfolio (showreels, vidéos demo, images héros) a besoin
          de la base de données. Ajoute les variables d&apos;env Supabase dans{" "}
          <code className="font-mono text-[12px] bg-ink-50 ring-1 ring-inset ring-ink-700/10 rounded px-1.5 py-0.5">
            .env.local
          </code>{" "}
          puis redémarre le serveur.
        </p>

        <div className="mt-6 card-white p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-800 inline-flex items-center gap-1.5">
            <Settings2 className="h-3 w-3" strokeWidth={2.8} />
            Setup 5 minutes
          </p>
          <ol className="mt-3 space-y-2 text-[13px] text-mist-200">
            <li>
              <strong className="text-mist-50">1.</strong> Crée un projet sur{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-amber-800 hover:text-amber-900 underline-offset-2 hover:underline"
              >
                supabase.com
              </a>
            </li>
            <li>
              <strong className="text-mist-50">2.</strong> Copie l&apos;URL +
              les clés dans{" "}
              <code className="font-mono text-[11.5px]">.env.local</code>
            </li>
            <li>
              <strong className="text-mist-50">3.</strong> Lance les migrations
              SQL (voir <code className="font-mono text-[11.5px]">SUPABASE_SETUP.md</code>)
            </li>
          </ol>
        </div>

        <Link
          href="/dashboard/talent"
          className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-bold text-mist-400 hover:text-mist-50 transition"
        >
          ← Retour au dashboard
        </Link>
      </div>
    );
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/dashboard/talent/portfolio");

  const itemsRes = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("talent_id", user.id)
    .order("position", { ascending: true });
  const items = (itemsRes.data ?? []) as PortfolioItemRow[];

  return (
    <div className="container-page pt-12 pb-20">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400 inline-flex items-center gap-1.5">
        <Film className="h-3 w-3 text-amber-700" strokeWidth={2.8} />
        Portfolio
      </p>
      <h1
        className="mt-3 font-display font-black tracking-tight text-mist-50"
        style={{
          fontSize: "clamp(1.6rem, 3.2vw, 2.2rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
        }}
      >
        Gère ton travail.
      </h1>
      <p className="mt-2 max-w-2xl text-[13.5px] text-mist-300">
        Showreels, vidéos demo, images héros. Chaque ajout recompute ton score
        TalentRank automatiquement.
      </p>
      <div className="mt-10">
        <PortfolioManager items={items} />
      </div>

      {/* Hint vers la suite */}
      <div className="mt-12 max-w-md mx-auto text-center">
        <Link
          href={`/talent/${user.id}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-white ring-1 ring-inset ring-ink-700/10 hover:ring-ink-700/25 px-3.5 py-1.5 text-[11.5px] font-bold text-mist-100 transition shadow-card hover:shadow-card-hover"
        >
          Voir mon profil public
          <ArrowRight className="h-3 w-3 text-mist-400" strokeWidth={2.6} />
        </Link>
      </div>
    </div>
  );
}
