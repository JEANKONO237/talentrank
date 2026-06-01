import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Briefcase, Calendar, Coins, MapPin } from "lucide-react";
import { ProposalActions } from "@/components/messages/ProposalActions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

interface ProposalRow {
  id: string;
  studio_id: string;
  talent_id: string;
  role_title: string;
  message: string | null;
  status: string;
  contract_type: string;
  work_mode: string;
  location: string | null;
  start_date_earliest: string | null;
  start_date_latest: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  expires_at: string | null;
  conversation_id: string | null;
  created_at: string;
}

export const metadata = { title: "Proposition d'entretien — TalentRank" };

const STATUS_FR: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "En attente", color: "#B45309", bg: "bg-amber-100 ring-amber-300/40" },
  accepted: { label: "Acceptée", color: "#047857", bg: "bg-emerald-100 ring-emerald-300/40" },
  declined: { label: "Refusée", color: "#475569", bg: "bg-ink-100 ring-ink-700/15" },
  expired: { label: "Expirée", color: "#475569", bg: "bg-ink-100 ring-ink-700/15" },
  withdrawn: { label: "Retirée", color: "#475569", bg: "bg-ink-100 ring-ink-700/15" },
};

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured) return notFound();

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/messages/proposals/" + id);

  const q = await supabase
    .from("interview_proposals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const proposal = q.data as ProposalRow | null;
  if (!proposal) return notFound();

  const isTalent = proposal.talent_id === user.id;
  const canAct = isTalent && proposal.status === "pending";

  const studioQ = await supabase
    .from("profiles")
    .select("display_name, username, avatar_initials, avatar_gradient")
    .eq("id", proposal.studio_id)
    .maybeSingle();
  const studio = studioQ.data as { display_name: string; username: string } | null;

  const salaryFmt =
    proposal.salary_min && proposal.salary_max
      ? `${(proposal.salary_min / 100).toLocaleString()}–${(proposal.salary_max / 100).toLocaleString()} ${proposal.salary_currency}`
      : null;

  const statusMeta = STATUS_FR[proposal.status] ?? STATUS_FR.pending;

  return (
    <div className="container-page pt-12 pb-20 max-w-3xl">
      <Link
        href="/messages"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-mist-400 hover:text-mist-50 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
        Retour à la boîte
      </Link>

      <div className="mt-6 card-white p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-300/40 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em]">
            Proposition d&apos;entretien
          </span>
          <span
            className={`inline-flex items-center rounded-full ring-1 ring-inset px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] ${statusMeta.bg}`}
            style={{ color: statusMeta.color }}
          >
            {statusMeta.label}
          </span>
        </div>
        <h1 className="mt-4 font-display text-[24px] font-black tracking-tight text-mist-50">
          {proposal.role_title}
        </h1>
        {studio && (
          <p className="mt-1 text-[13.5px] text-mist-300">
            De la part de{" "}
            <span className="text-mist-50 font-bold">{studio.display_name}</span>
          </p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DetailRow icon={Briefcase} label="Contrat">
            {proposal.contract_type} · {proposal.work_mode}
          </DetailRow>
          <DetailRow icon={MapPin} label="Lieu">
            {proposal.location ?? "Remote / non spécifié"}
          </DetailRow>
          <DetailRow icon={Calendar} label="Fenêtre de début">
            {proposal.start_date_earliest && proposal.start_date_latest
              ? `${proposal.start_date_earliest} → ${proposal.start_date_latest}`
              : "Flexible"}
          </DetailRow>
          <DetailRow icon={Coins} label="Salaire">
            {salaryFmt ?? "À discuter"}
          </DetailRow>
        </div>

        {proposal.message && (
          <>
            <hr className="my-6 border-ink-700/10" />
            <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
              Message
            </p>
            <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-mist-100">
              {proposal.message}
            </p>
          </>
        )}

        <hr className="my-6 border-ink-700/10" />

        {canAct ? (
          <ProposalActions proposalId={proposal.id} />
        ) : (
          <div className="text-[13px] text-mist-400">
            {proposal.status === "accepted" && proposal.conversation_id && (
              <Link
                href={`/messages/${proposal.conversation_id}`}
                className="inline-flex items-center gap-1.5 font-bold text-amber-800 hover:text-amber-900 transition"
              >
                Ouvrir la conversation
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.8} />
              </Link>
            )}
            {proposal.status === "declined" && "Tu as refusé cette proposition."}
            {proposal.status === "expired" && "Cette proposition a expiré."}
            {proposal.status === "withdrawn" &&
              "Le studio a retiré cette proposition."}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-ink-50 ring-1 ring-inset ring-ink-700/10 p-3.5">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-mist-400">
        <Icon className="h-3 w-3" strokeWidth={2.2} />
        {label}
      </div>
      <p className="mt-1.5 text-[13.5px] font-bold text-mist-50">{children}</p>
    </div>
  );
}
