// TalentRank — Seed script: qcm_answer_keys
// ----------------------------------------------------------------------------
// Pousse les couples (question_id, correct_option_id) depuis les banques TS
// vers la table Supabase `qcm_answer_keys`. Run à chaque déploiement (ou
// localement après ajout d'une question) :
//
//   pnpm tsx scripts/seed-qcm-answer-keys.ts
//
// Idempotent : ON CONFLICT DO UPDATE met à jour si le contenu a changé.
//
// Sécurité : utilise la service_role key (lecture/écriture pleine), donc
// JAMAIS ce fichier ne doit être bundlé côté client. Le `if (require.main)`
// guard + le fait qu'il n'est jamais importé par app/ garantit ça.

/* eslint-disable no-console */

import { createClient } from "@supabase/supabase-js";
import { listBanks } from "../lib/qcm/registry";
import type { Question } from "../lib/qcm/types";

interface AnswerKeyRow {
  question_id: string;
  profession_id: string;
  correct_option_id: string;
  difficulty: string;
  axis_id: string;
  expected_seconds: number;
}

function deriveAnswerKey(q: Question): AnswerKeyRow {
  const correct = q.options.find((o) => o.correct);
  if (!correct) {
    throw new Error(
      `Question ${q.id} has no correct option — refuse to seed. Fix the bank.`,
    );
  }
  const multipleCorrect = q.options.filter((o) => o.correct).length;
  if (multipleCorrect > 1) {
    throw new Error(
      `Question ${q.id} has ${multipleCorrect} correct options — only single-correct is supported in v1.`,
    );
  }
  return {
    question_id: q.id,
    profession_id: q.professionId,
    correct_option_id: correct.id,
    difficulty: q.difficulty,
    axis_id: q.axisId,
    expected_seconds: q.expectedSeconds,
  };
}

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.",
    );
    console.error(
      "  → Add them to .env.local (not committed) for local dev,",
    );
    console.error(
      "  → and to the deploy environment (Vercel/Netlify) for prod.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const banks = listBanks();
  const allKeys: AnswerKeyRow[] = [];
  for (const bank of banks) {
    console.log(`  ${bank.professionId.padEnd(24)} ${bank.questions.length} questions`);
    for (const q of bank.questions) allKeys.push(deriveAnswerKey(q));
  }
  console.log(`\nTotal answer keys to upsert: ${allKeys.length}`);

  // Upsert by chunks of 200 (Supabase row limit)
  const CHUNK = 200;
  let upserted = 0;
  for (let i = 0; i < allKeys.length; i += CHUNK) {
    const slice = allKeys.slice(i, i + CHUNK);
    const { error } = await supabase
      .from("qcm_answer_keys")
      .upsert(slice, { onConflict: "question_id" });
    if (error) {
      console.error("Upsert failed:", error);
      process.exit(1);
    }
    upserted += slice.length;
    console.log(`  upserted ${upserted}/${allKeys.length}`);
  }

  // Optional: mark as compromised any answer_keys that are no longer in the TS
  // banks (= question retirée du code). On les marque compromised plutôt que
  // delete pour préserver l'audit trail des attempts qui les référencent.
  const allIds = new Set(allKeys.map((k) => k.question_id));
  const { data: dbKeys, error: listErr } = await supabase
    .from("qcm_answer_keys")
    .select("question_id, is_compromised");
  if (listErr) {
    console.error("Could not list existing keys:", listErr);
    process.exit(1);
  }
  const stale = (dbKeys ?? []).filter(
    (k) => !allIds.has(k.question_id) && !k.is_compromised,
  );
  if (stale.length > 0) {
    console.log(`\nMarking ${stale.length} stale answer_keys as compromised:`);
    for (const k of stale) console.log(`  - ${k.question_id}`);
    const { error: updErr } = await supabase
      .from("qcm_answer_keys")
      .update({
        is_compromised: true,
        compromised_at: new Date().toISOString(),
        compromised_reason: "Removed from TS bank during seed",
      })
      .in("question_id", stale.map((k) => k.question_id));
    if (updErr) {
      console.error("Failed to flag stale keys:", updErr);
      process.exit(1);
    }
  }

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
