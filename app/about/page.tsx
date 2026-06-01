import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, Target, Trophy, Users } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LeagueMascot } from "@/components/ui/LeagueMascot";

export const metadata = {
  title: "À propos — TalentRank",
  description:
    "Pourquoi TalentRank existe. La vision : un classement crédible par métier, par ville. Le bounty hunter du recrutement.",
  openGraph: {
    title: "TalentRank — On a marre des CV. Pas du talent.",
    description: "Le bounty hunter du recrutement. La vision derrière TalentRank.",
    images: [
      {
        url: "/api/og?title=On%20a%20marre%20des%20CV.&subtitle=Pas%20du%20talent.",
        width: 1200,
        height: 630,
        alt: "TalentRank Manifesto",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "On a marre des CV. Pas du talent.",
    description: "Le bounty hunter du recrutement.",
    images: ["/api/og?title=On%20a%20marre%20des%20CV.&subtitle=Pas%20du%20talent."],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// /about — Manifesto + founder story.
//
// Audit Sasha G3-Sasha-2 : trust signal majeur manquant. Les early adopters
// veulent savoir qui est derrière, pourquoi le produit existe. Cette page
// répond à 3 questions : pourquoi, qui, où on va.
//
// Tonale : honnête, premier degré, ambition assumée. Pas de bullshit
// corporate. Le founder parle au "tu".
// ─────────────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="container-page pt-12 pb-20">
      <Link
        href="/talent"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-mist-400 hover:text-mist-50 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
        Accueil
      </Link>

      {/* Hero */}
      <header className="mt-10 max-w-3xl mx-auto text-center">
        <Logo size={48} withWordmark className="justify-center" />
        <h1
          className="mt-8 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(2.4rem, 5.5vw, 4rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
          }}
        >
          On a marre des CV.{" "}
          <span className="relative inline-block">
            Pas du talent.
            <span
              aria-hidden
              className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5 h-[6px] rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,200,0,0.3) 0%, rgba(255,200,0,0.65) 50%, rgba(255,200,0,0.3) 100%)",
              }}
            />
          </span>
        </h1>
        <p className="mt-7 text-[16px] sm:text-[17px] text-mist-300 leading-relaxed">
          TalentRank, c&apos;est une plateforme où chaque métier a son propre
          classement. Pas d&apos;amalgame entre boulangers et développeurs.
          Pas de filtre LinkedIn qui passe à côté. Pas de candidatures à lire.
          <br />
          <span className="font-bold text-mist-100">
            Le bounty hunter du recrutement.
          </span>
        </p>
      </header>

      {/* 3 piliers */}
      <section className="mt-20 max-w-5xl mx-auto">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400">
          Trois convictions
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          <Pillar
            icon={<Target className="h-5 w-5" strokeWidth={2.2} />}
            accent="#22D3EE"
            title="Le classement par métier."
            body="Un dev React n'est pas un motion designer. Pas de cohorte mixte. Chaque métier a son podium, ses QCM, ses critères."
          />
          <Pillar
            icon={<Trophy className="h-5 w-5" strokeWidth={2.2} />}
            accent="#F59E0B"
            title="Le QCM officiel."
            body="Une seule évaluation, verrouillée 1 mois entre deux passages. Anti-cheat sérieux. Le score qui compte."
          />
          <Pillar
            icon={<Users className="h-5 w-5" strokeWidth={2.2} />}
            accent="#A78BFA"
            title="La chasse, pas la candidature."
            body="Les studios chassent. Les talents apparaissent. Pas de candidature à lire, pas de spam de CV. Un clic, un entretien."
          />
        </div>
      </section>

      {/* Founder story */}
      <section className="mt-24 max-w-3xl mx-auto">
        <div
          className="relative overflow-hidden rounded-[28px] p-9 sm:p-12"
          style={{
            background: "linear-gradient(135deg, #FFF8E1 0%, #FFE8B0 100%)",
            boxShadow:
              "0 24px 60px -16px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.55)",
          }}
        >
          {/* Halo */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-50 blur-3xl"
            style={{ background: "#F59E0B" }}
          />

          {/* Lion mascot */}
          <div className="relative flex justify-center mb-6">
            <div
              className="grid place-items-center rounded-full"
              style={{
                width: 96,
                height: 96,
                background:
                  "radial-gradient(circle at 30% 25%, #FFE082, #F59E0B 60%, #B45309 100%)",
                boxShadow:
                  "0 16px 32px -8px rgba(245,158,11,0.55), inset 0 3px 0 rgba(255,255,255,0.55), inset 0 -14px 22px -8px rgba(0,0,0,0.35)",
              }}
            >
              <LeagueMascot tier="senior" size={68} />
            </div>
          </div>

          <p className="relative text-center text-[10.5px] font-bold uppercase tracking-[0.22em] text-amber-800">
            Le mot du fondateur
          </p>
          <h2 className="relative mt-3 text-center font-display text-[22px] sm:text-[26px] font-black text-mist-50 leading-tight tracking-tight">
            Pourquoi je construis ça.
          </h2>

          <div className="relative mt-6 space-y-4 text-[14.5px] text-mist-100 leading-relaxed">
            <p>
              Salut, moi c&apos;est <strong>Jean-Marie Onana Kono</strong>. Je
              suis 3D Generalist et animateur. Formé à MOPA et Ynov.
              Camerounais. J&apos;ai vécu l&apos;envers du recrutement
              créatif des deux côtés : avec des heures perdues à lire des CV
              qui mentent, à chercher des studios qui ghostent.
            </p>
            <p>
              <strong>Le problème n&apos;est pas le talent.</strong> Il y a
              des centaines de gens excellents dans chaque métier — mais ils
              sont invisibles. Et les studios qui les cherchent passent à
              côté parce que le système actuel est conçu pour faire scroller,
              pas pour trouver.
            </p>
            <p>
              TalentRank, c&apos;est ma réponse : un classement strict par
              métier, basé sur un score réel (QCM officiel + signaux de
              profil), avec un anti-cheat sérieux et une promesse simple
              côté studio : <em>«&nbsp;pas de candidature à lire, juste les
              meilleurs en haut&nbsp;»</em>.
            </p>
            <p>
              C&apos;est en beta. C&apos;est imparfait. Je le construis avec
              un budget zéro, du code et beaucoup d&apos;agents IA. Mais
              chaque détail compte. Chaque feedback est lu.
            </p>
            <p className="font-bold text-mist-50">
              Si tu lis ça, tu fais partie des premiers. Merci.
            </p>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="mt-14 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400">
          Tu es qui ?
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/talent" className="btn-prestige group">
            Je suis talent
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              strokeWidth={2.6}
            />
          </Link>
          <Link href="/studio" className="btn-night group">
            Je recrute
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              strokeWidth={2.6}
            />
          </Link>
        </div>
        <p className="mt-6 text-[11.5px] text-mist-400">
          <Sparkles className="inline-block h-3 w-3 -mt-0.5 mr-1 text-amber-600" strokeWidth={2.6} />
          Aucune création de compte requise pour explorer.
        </p>
      </section>
    </div>
  );
}

function Pillar({
  icon,
  accent,
  title,
  body,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  body: string;
}) {
  return (
    <article className="card-white p-6">
      <span
        className="inline-grid h-11 w-11 place-items-center rounded-2xl"
        style={{ background: `${accent}1A`, color: accent }}
      >
        {icon}
      </span>
      <h3 className="mt-4 font-display text-[17px] font-black tracking-tight text-mist-50 leading-tight">
        {title}
      </h3>
      <p className="mt-2 text-[13px] text-mist-300 leading-relaxed">{body}</p>
    </article>
  );
}
