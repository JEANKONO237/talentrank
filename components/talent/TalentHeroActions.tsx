"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Bookmark, MessageCircle, MessageSquarePlus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProposeInterviewModal } from "@/components/recruiter/ProposeInterviewModal";
import { MessageComposerModal } from "@/components/talent/MessageComposerModal";
import { ShareScoreModal } from "@/components/share/ShareScoreCard";
import { listMessagesForTalent, subscribeMessages } from "@/lib/messages";
import { cn } from "@/lib/utils";

interface Props {
  talent: {
    id: string;
    slug: string;
    name: string;
    roleLabel: string;
    initials: string;
    gradient: string;
    flag?: string;
    /** ISO country code — used by the message composer's avatar. */
    countryCode?: string;
    /** Score + percentile + métier — requis pour partager le profil
     *  via une OG image brandée. Si absent, le bouton Partager se cache. */
    score?: number;
    percentile?: number;
    professionId?: string;
    professionLabelFr?: string;
    city?: string;
  };
}

export function TalentHeroActions({ talent }: Props) {
  const [saved, setSaved] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const canShare =
    talent.score != null &&
    talent.percentile != null &&
    talent.professionId != null &&
    talent.professionLabelFr != null;

  // Subscribe to message store so the badge updates after sending.
  useEffect(() => {
    return subscribeMessages(() => {
      setSentCount(listMessagesForTalent(talent.id).length);
    });
  }, [talent.id]);

  return (
    <>
      <div className="mt-7 flex flex-wrap items-center gap-2">
        {/* Primary: formal interview proposal (3-step structured flow) */}
        <Button variant="primary" size="md" onClick={() => setProposeOpen(true)}>
          <MessageSquarePlus className="h-4 w-4" strokeWidth={2.4} />
          Proposer un entretien
        </Button>

        {/* New: free-form direct message (lightweight, no structure) */}
        <Button variant="glass" size="md" onClick={() => setMessageOpen(true)}>
          <MessageCircle className="h-4 w-4" strokeWidth={2.4} />
          Envoyer un message
          {sentCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-cyan-400/25 ring-1 ring-inset ring-cyan-400/40 px-1.5 font-display text-[10.5px] font-black tabular-nums leading-none min-w-[18px] h-[16px] text-cyan-200">
              {sentCount}
            </span>
          )}
        </Button>

        <Button
          variant={saved ? "amber" : "glass"}
          size="md"
          onClick={() => setSaved((v) => !v)}
        >
          <Bookmark className={cn("h-4 w-4", saved && "fill-ink-950")} strokeWidth={2.4} />
          {saved ? "Ajouté à la shortlist" : "Ajouter à la shortlist"}
        </Button>

        {canShare && (
          <Button variant="ghost" size="md" onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4" /> Partager
          </Button>
        )}
      </div>

      {proposeOpen && (
        <ProposeInterviewModal talent={talent} onClose={() => setProposeOpen(false)} />
      )}
      {messageOpen && (
        <MessageComposerModal talent={talent} onClose={() => setMessageOpen(false)} />
      )}
      <AnimatePresence>
        {shareOpen && canShare && (
          <ShareScoreModal
            onClose={() => setShareOpen(false)}
            name={talent.name}
            score={talent.score!}
            percentile={talent.percentile!}
            professionId={talent.professionId!}
            professionLabel={talent.professionLabelFr!}
            city={talent.city}
            slug={talent.slug}
          />
        )}
      </AnimatePresence>
    </>
  );
}
