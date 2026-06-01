import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Inbox, MessageSquare, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Boîte de réception — TalentRank" };

// ─────────────────────────────────────────────────────────────────────────────
// Messages inbox — migration cream + FR (#38).
//
// Liste des propositions d'entretien en attente + conversations existantes.
// Bloqué sur Supabase pour la fonctionnalité réelle (#76). Sans config, on
// affiche un fallback explicatif.
// ─────────────────────────────────────────────────────────────────────────────

interface ConvRow {
  id: string;
  studio_id: string;
  talent_id: string;
  subject: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_for_talent: number;
  unread_for_studio: number;
}

interface ProposalRow {
  id: string;
  studio_id: string;
  talent_id: string;
  role_title: string;
  status: string;
  contract_type: string;
  work_mode: string;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  created_at: string;
  conversation_id: string | null;
}

export default async function MessagesPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="container-page pt-12 pb-20 max-w-2xl mx-auto text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400 inline-flex items-center gap-1.5">
          <Inbox className="h-3 w-3 text-amber-700" strokeWidth={2.8} />
          Boîte de réception
        </p>
        <h1
          className="mt-3 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(1.6rem, 3.2vw, 2.2rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
          }}
        >
          La messagerie a besoin de Supabase.
        </h1>
        <p className="mt-3 text-[14px] text-mist-300 leading-relaxed">
          Configure tes credentials Supabase dans{" "}
          <code className="font-mono text-[12px] bg-ink-50 ring-1 ring-inset ring-ink-700/10 rounded px-1.5 py-0.5">
            .env.local
          </code>{" "}
          pour activer les propositions d&apos;entretien et les conversations.
        </p>
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
  if (!user) redirect("/sign-in?next=/messages");

  const profileRes = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profileRes.data as { role: string } | null)?.role;

  const proposalsQ = await supabase
    .from("interview_proposals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  const proposals = (proposalsQ.data ?? []) as ProposalRow[];

  const conversationsQ = await supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(50);
  const conversations = (conversationsQ.data ?? []) as ConvRow[];

  const pendingForMe = proposals.filter(
    (p) => role === "talent" && p.talent_id === user.id && p.status === "pending",
  );

  return (
    <div className="container-page pt-12 pb-20">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400 inline-flex items-center gap-1.5">
        <Inbox className="h-3 w-3 text-amber-700" strokeWidth={2.8} />
        Boîte de réception
      </p>
      <h1
        className="mt-3 font-display font-black tracking-tight text-mist-50"
        style={{
          fontSize: "clamp(1.6rem, 3.2vw, 2.2rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
        }}
      >
        {role === "studio"
          ? "Tes conversations et propositions envoyées."
          : "Tes propositions d'entretien et conversations."}
      </h1>

      {/* Pending interview proposals — talents uniquement */}
      {pendingForMe.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-amber-700" strokeWidth={2.8} />
            <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-800">
              {pendingForMe.length} nouvelle{pendingForMe.length === 1 ? "" : "s"} proposition
              {pendingForMe.length === 1 ? "" : "s"}
            </h2>
            <span className="h-px flex-1 bg-amber-200/60" />
          </div>
          <div className="space-y-3">
            {pendingForMe.map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        </section>
      )}

      {/* Conversations */}
      <section className="mt-12">
        <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400 mb-4">
          Conversations
        </h2>
        {conversations.length === 0 ? (
          <div className="card-white p-10 text-center">
            <p className="font-display text-[16px] font-bold text-mist-50">
              Aucune conversation pour l&apos;instant.
            </p>
            <p className="mt-1 text-[13px] text-mist-400">
              Accepte une proposition d&apos;entretien pour déverrouiller un fil privé
              avec un studio.
            </p>
          </div>
        ) : (
          <ul className="card-white divide-y divide-ink-700/10 overflow-hidden">
            {conversations.map((c) => {
              const unread =
                role === "talent" ? c.unread_for_talent : c.unread_for_studio;
              return (
                <li key={c.id}>
                  <Link
                    href={`/messages/${c.id}`}
                    className="flex items-center gap-4 px-4 py-4 transition hover:bg-ink-50"
                  >
                    <Avatar
                      initials="ST"
                      gradient="bg-gradient-to-br from-cyan-400 via-cyan-600 to-indigo-900"
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-display text-[13.5px] font-bold text-mist-50">
                          {c.subject ?? "Conversation"}
                        </p>
                        {unread > 0 && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ring-1 ring-inset ring-amber-300/40">
                            {unread} nouv.
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[12.5px] text-mist-400">
                        {c.last_message_preview ?? "Pas encore de message"}
                      </p>
                    </div>
                    <MessageSquare className="h-4 w-4 text-mist-400" strokeWidth={2.4} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: ProposalRow }) {
  const salary =
    proposal.salary_min && proposal.salary_max
      ? `${(proposal.salary_min / 100).toLocaleString()}–${(proposal.salary_max / 100).toLocaleString()} ${proposal.salary_currency}`
      : null;

  return (
    <Link
      href={`/messages/proposals/${proposal.id}`}
      className="card-white block p-5 transition hover:-translate-y-0.5"
      style={{
        boxShadow:
          "0 6px 18px -8px rgba(180,83,9,0.20), inset 0 1px 0 rgba(255,255,255,0.5), 0 0 0 1.5px rgba(245,158,11,0.25)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber-800">
            Proposition d&apos;entretien · {proposal.contract_type}
          </p>
          <h3 className="mt-1 font-display text-[16px] font-black tracking-tight text-mist-50">
            {proposal.role_title}
          </h3>
          <p className="mt-1 text-[12.5px] text-mist-300">
            {proposal.location ?? "Remote"} · {proposal.work_mode}
            {salary && <span> · {salary}</span>}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] shrink-0">
          Voir
          <ArrowRight className="h-3 w-3" strokeWidth={2.8} />
        </span>
      </div>
    </Link>
  );
}
