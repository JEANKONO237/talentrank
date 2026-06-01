"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, Check, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { acceptProposal, declineProposal, holdProposal } from "@/lib/server-actions/proposals";

interface Props {
  proposalId: string;
}

export function ProposalActions({ proposalId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const onAccept = () => {
    setError(null);
    startTransition(async () => {
      const res = await acceptProposal(proposalId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.data?.conversation_id) {
        router.push(`/messages/${res.data.conversation_id}`);
      } else {
        router.push("/messages");
      }
    });
  };

  const onHold = () => {
    setError(null);
    startTransition(async () => {
      const res = await holdProposal(proposalId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const onDecline = () => {
    setError(null);
    startTransition(async () => {
      const res = await declineProposal(proposalId, declineReason || undefined);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onAccept} disabled={isPending} size="md" variant="primary">
          <Check className="h-4 w-4" strokeWidth={2.4} />
          Accept interview
        </Button>
        <Button onClick={onHold} disabled={isPending} size="md" variant="glass">
          <Clock className="h-4 w-4" strokeWidth={2.4} />
          Hold for later
        </Button>
        <Button onClick={() => setShowDecline((v) => !v)} disabled={isPending} size="md" variant="ghost">
          <X className="h-4 w-4" strokeWidth={2.4} />
          Decline
        </Button>
      </div>

      {showDecline && (
        <div className="mt-4 rounded-xl border border-ink-700/40 bg-ink-850 p-3">
          <p className="text-[12px] text-mist-300">Optional reason (visible only to the studio):</p>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.currentTarget.value)}
            rows={3}
            maxLength={500}
            className="mt-2 w-full rounded-lg bg-ink-900/60 border border-ink-700/40 p-2.5 text-[13px] text-mist-50 outline-none focus:border-rose-400/40"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowDecline(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={onDecline} disabled={isPending}>
              Confirm decline
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-200">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
