"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Eye, EyeOff, Inbox, InboxIcon } from "lucide-react";
import { useAudience } from "@/lib/audience/client";
import { useTalentActions } from "@/lib/talent-actions/storage";
import { playShortlist, playUnshortlist, playWiggle } from "@/lib/audio/sounds";
import { triggerHaptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// TalentStudioActionsBar — 2 boutons d'action sur le profil d'un talent.
//
//   1. Ajouter à ma file        (queue / shortlist recrutement)
//   2. Suivre                   (veille — recevoir des updates)
//
// Visible UNIQUEMENT pour l'audience studio. Renvoie null sinon.
//
// État réactif via useTalentActions(). Le toggle change visuel + label :
//   - "Ajouter à ma file"  →  "✓ Dans la file"   (variant ambre filled)
//   - "Suivre"             →  "👁 Suivi"          (variant cyan filled)
//
// Animation spring au toggle + petit toast textuel discret en dessous
// ("Ajouté · Voir ta file") pour confirmer l'action.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  talentSlug: string;
  talentName: string;
}

export function TalentStudioActionsBar({ talentSlug, talentName }: Props) {
  const { audience } = useAudience();
  const { isQueued, isFollowed, toggleQueue, toggleFollow } = useTalentActions();

  // Pas affiché pour les talents (ils ne shortlistent pas eux-mêmes)
  if (audience !== "studio") return null;

  const queued = isQueued(talentSlug);
  const followed = isFollowed(talentSlug);

  return (
    <div className="mt-5 space-y-2">
      <div className="flex flex-wrap gap-2">
        {/* Queue button — primary action (+ boing audio feedback) */}
        <motion.button
          type="button"
          onClick={() => {
            const nowQueued = toggleQueue(talentSlug);
            triggerHaptic("medium");
            if (nowQueued) playShortlist();
            else playUnshortlist();
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 420, damping: 20 }}
          aria-pressed={queued}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-full px-5 text-[12.5px] font-bold uppercase tracking-[0.06em] transition-all",
            queued
              ? "text-amber-900"
              : "text-white",
          )}
          style={
            queued
              ? {
                  background: "linear-gradient(180deg, #FFEAA0, #FFC800)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 0 0 rgba(201,154,0,0.7), 0 8px 20px -6px rgba(255,200,0,0.4)",
                }
              : {
                  background: "linear-gradient(180deg, #2C3E55, #1A2535)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 0 rgba(10,20,30,0.4), 0 8px 20px -6px rgba(10,20,30,0.45)",
                }
          }
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={queued ? "queued" : "queue"}
              initial={{ scale: 0.6, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="inline-flex"
            >
              {queued ? (
                <Check className="h-4 w-4" strokeWidth={3} />
              ) : (
                <Inbox className="h-4 w-4" strokeWidth={2.6} />
              )}
            </motion.span>
          </AnimatePresence>
          {queued ? "Dans ma file" : "Ajouter à ma file"}
        </motion.button>

        {/* Follow button — secondary, ghost (+ pop discret) */}
        <motion.button
          type="button"
          onClick={() => {
            toggleFollow(talentSlug);
            triggerHaptic("light");
            playWiggle();
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 420, damping: 20 }}
          aria-pressed={followed}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-full px-5 text-[12.5px] font-bold uppercase tracking-[0.06em] transition-all",
            followed
              ? "bg-cyan-100 text-cyan-800 ring-1 ring-inset ring-cyan-400/40 hover:bg-cyan-200"
              : "bg-white text-mist-100 ring-1 ring-inset ring-ink-700/10 hover:bg-ink-850",
          )}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={followed ? "followed" : "follow"}
              initial={{ scale: 0.6, rotate: 15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="inline-flex"
            >
              {followed ? (
                <Eye className="h-4 w-4" strokeWidth={2.6} />
              ) : (
                <EyeOff className="h-4 w-4" strokeWidth={2.6} />
              )}
            </motion.span>
          </AnimatePresence>
          {followed ? "Suivi" : "Suivre"}
        </motion.button>
      </div>

      {/* Confirmation discrète sous les boutons */}
      <AnimatePresence>
        {(queued || followed) && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-[11.5px] text-mist-400"
          >
            {queued && followed && (
              <>
                <InboxIcon className="inline-block h-3 w-3 -mt-0.5 mr-1 text-amber-700" strokeWidth={2.6} />
                {talentName} est dans ta file et tu reçois ses updates.
              </>
            )}
            {queued && !followed && (
              <>
                <InboxIcon className="inline-block h-3 w-3 -mt-0.5 mr-1 text-amber-700" strokeWidth={2.6} />
                Ajouté à ta file — retrouve {talentName} dans{" "}
                <a href="/candidats" className="font-bold text-mist-100 hover:text-mist-50 underline decoration-amber-300 decoration-2 underline-offset-2">
                  Mes candidats
                </a>
                .
              </>
            )}
            {!queued && followed && (
              <>
                <Eye className="inline-block h-3 w-3 -mt-0.5 mr-1 text-cyan-700" strokeWidth={2.6} />
                Tu suis {talentName} — alertes sur changements de score / dispo.
              </>
            )}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
