"use client";

import { trackEvent } from "./posthog";

// ─────────────────────────────────────────────────────────────────────────────
// Events catalogue — schéma centralisé, typé, sans magic strings dans le code.
//
// Convention naming : snake_case, [domain]_[action_passé]. Pas de PII dans
// les props (jamais d'email, jamais de nom complet d'un autre talent — on
// passe les IDs).
//
// Le NSM TalentRank (Eli) : « Talents avec score officiel ≥ 50 partagés ≥ 1x. »
// Ce module trace les 3 piliers qui composent ce NSM :
//   1. qcm_completed (score acquired)
//   2. profile_published (profile usable)
//   3. score_shared (virality activated)
//
// Plus des signaux secondaires pour les funnels d'entrée et virals.
// ─────────────────────────────────────────────────────────────────────────────

/** Union de tous les events trackés. Compile-time safety. */
export type TrackedEvent =
  // ─── Discovery / entry ──────────────────────────────────────────────
  | {
      name: "welcome_audience_chosen";
      props: { audience: "talent" | "studio" | "browse" };
    }
  | {
      name: "landing_cta_clicked";
      props: { cta: string; audience?: "talent" | "studio" };
    }
  // ─── QCM funnel (cœur du produit) ───────────────────────────────────
  | {
      name: "qcm_started";
      props: { profession_id: string };
    }
  | {
      name: "qcm_completed";
      props: {
        profession_id: string;
        score: number;
        tier: string;
        is_new_best: boolean;
      };
    }
  // ─── Profile ────────────────────────────────────────────────────────
  | {
      name: "profile_published";
      props: { completion_pct: number };
    }
  | {
      name: "profile_section_edited";
      props: { section: string };
    }
  // ─── Virality (NSM) ─────────────────────────────────────────────────
  | {
      name: "score_shared";
      props: {
        channel: "twitter" | "linkedin" | "copy_link";
        score: number;
        profession_id: string;
      };
    }
  | {
      name: "embed_copied";
      props: {
        variant: "wide" | "square";
        theme: "light" | "dark";
        snippet_type: "html" | "markdown" | "url" | "raw";
      };
    }
  | {
      name: "referral_link_copied";
      props: { source: "parrainage_page" | "share_modal" };
    }
  | {
      name: "referral_invite_sent";
      props: { channel: "twitter" | "whatsapp" | "email" };
    }
  // ─── Ranking interactions ───────────────────────────────────────────
  | {
      name: "profession_pinned";
      props: { profession_id: string; audience: "talent" | "studio" };
    }
  | {
      name: "ranking_city_filter_applied";
      props: { profession_id: string; city: string };
    }
  // ─── Studio actions ─────────────────────────────────────────────────
  | {
      name: "talent_shortlisted";
      props: { talent_slug: string };
    }
  | {
      name: "talent_followed";
      props: { talent_slug: string };
    }
  | {
      name: "interview_proposal_sent";
      props: { talent_slug: string; role_title: string };
    }
  // ─── Marketing surfaces ─────────────────────────────────────────────
  | {
      name: "waitlist_signup";
      props: { feature_id: string };
    }
  | {
      name: "feedback_submitted";
      props: { sentiment: "love" | "meh" | "hate" };
    }
  | {
      name: "pricing_plan_clicked";
      props: { plan_id: string };
    }
  // ─── QCM Builder (studio) ───────────────────────────────────────────
  | {
      name: "custom_qcm_created";
      props: Record<string, never>;
    }
  | {
      name: "custom_qcm_published";
      props: { question_count: number; profession_id?: string };
    };

/**
 * Wrapper typé sur trackEvent. Refuse à la compile-time tout event qui n'est
 * pas dans le catalogue ci-dessus.
 */
export function track<E extends TrackedEvent>(
  name: E["name"],
  props: E["props"],
): void {
  trackEvent(name, props as Record<string, unknown>);
}
