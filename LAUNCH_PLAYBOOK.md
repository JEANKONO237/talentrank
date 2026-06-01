# TalentRank — Launch Playbook

Notes humaines / non-codables, condensées depuis l'audit cross-fonctionnel
des 17 agents. Ce playbook documente ce qu'il faut FAIRE (pas coder) pour
réussir le launch beta.

---

## 1. Stratégie pre-launch — les 100 premiers users

*(audit Erin · product-strategist — G3-Erin-5)*

### Objectif
Atteindre 100 premiers utilisateurs réels (60 talents + 40 studios) avant
le launch public. C'est le seuil minimum pour que les classements aient du
signal.

### Tactiques concrètes

**Talents (60 cible) — partenariats écoles + bouche-à-oreille**
- [ ] Pitch à MOPA (Arles) — promotion 2026, 2027. Ton réseau direct.
- [ ] Pitch à Ynov Animation / Game Design — promotions sortantes.
- [ ] LinkedIn DM personnalisés à 50 jeunes diplômés Animation 3D / Frontend
  identifiés via leur portfolio public.
- [ ] Post Twitter/X teaser avec carte score mock + lien beta.
- [ ] Discord servers : 3DArtists, Frontend Cafe, French Tech.
- [ ] **Programme parrainage** déjà codé (`/parrainage`) — incite chaque
  early user à amener 3 amis.

**Studios (40 cible) — outreach ciblé**
- [ ] Liste manuelle de 100 studios FR/EU intéressants (Ubisoft, Mathematic,
  Mac Guff, Cube Creative, La Cabane, ILM Paris…).
- [ ] Cold email founder-to-founder avec démo vidéo 90s. Pas de pitch
  générique.
- [ ] Présence au Annecy Festival 2026 si possible (animation), Paris Games
  Week (jeu vidéo), VivaTech (tech).

### KPIs à tracker dès le J1
- DAU (Daily Active Users)
- QCM completion rate (started → completed)
- Studio activation (1 search + 1 shortlist dans la 1ère semaine)
- Referral coefficient (invitations sent / users)
- Time-to-first-shortlist (côté studio)

→ Setup PostHog (`lib/analytics/posthog.ts` déjà prêt, juste mettre la key).

---

## 2. Usability testing — 5 users modérés

*(audit Mira · ux-researcher — G3-Mira-3)*

### Pourquoi
Tu construis avec un biais énorme du créateur. Aucun user humain n'a testé
l'app sauf toi. Les 5 user tests Nielsen révèlent 80% des problèmes
utilisabilité.

### Protocole

**Recrutement (3 talents + 2 studios) :**
- 1 jeune diplômé MOPA / Ynov (animation 3D)
- 1 développeur frontend mi-carrière
- 1 artisan (boulanger, illustrateur indé, etc.)
- 1 founder solo studio créatif (10-30 personnes)
- 1 head of recruitment d'une boîte tech

**Compensation :** 30€ Amazon gift card + accès Pro 6 mois gratuit.

**Session (45 min en visio Loom enregistré) :**

1. (5 min) Introduction sans guider. "Ouvre talentrank.io et explore."
2. (10 min) Observer. Note chaque hesitation. Ne PAS aider.
3. (15 min) Tâches dirigées :
   - Talent : "Crée ton profil et passe ton QCM."
   - Studio : "Trouve 3 animateurs 3D à Paris, ajoute-les à ta file."
4. (10 min) Interview post-tâche : qu'est-ce qui t'a frustré ? À quel moment
   t'as failli abandonner ? Recommanderais-tu à un ami ?
5. (5 min) Demander de noter de 1 à 10 + commentaire libre.

### Quoi observer
- Combien de temps avant le 1er moment "ah ok je comprends" ?
- Où les users se trompent-ils de bouton (rage clicks) ?
- Quelles features attendues sont absentes ?
- Quel langage utilisent-ils ? Match-il celui de l'app ?

### Templates de scripts dispo
- Nielsen Norman Group : https://www.nngroup.com/articles/usability-test-script/

---

## 3. Setup analytics / observability (10 min)

### PostHog (recommandé, EU-hosted)
1. Créer un compte sur https://eu.posthog.com
2. Récupérer la `Project API key`
3. Ajouter dans `.env.local` :
   ```
   NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
   ```
4. Installer le SDK : `pnpm add posthog-js`
5. Le module `lib/analytics/posthog.ts` se charge automatiquement.

### Events to track (initial)
- `welcome_audience_chosen` — { audience: 'talent' | 'studio' | 'visitor' }
- `onboarding_submitted` — { audience, has_profession_or_company }
- `qcm_started` — { profession_id }
- `qcm_completed` — { profession_id, score, time_ms }
- `talent_shortlisted` — { studio_id, talent_slug }
- `feedback_submitted` — { type: 'bug' | 'idea' | 'praise' }
- `referral_link_copied`
- `og_score_shared`

→ Wire `trackEvent()` dans les actions critiques au fil de l'eau.

---

## 4. Press & community outreach

### Médias spécialisés à pitcher
- 80.lv (3D / VFX community)
- Cartoon Brew (animation)
- French Tech (tech ecosystem FR)
- TechCrunch FR (si le pitch est solide)
- Maddyness (startup FR)

### Communautés
- Reddit r/animation, r/frontend, r/Boulangerie
- LinkedIn groupes : "Animation Talents", "Recruteurs Tech"
- Discord 3DArtists, Frontend Cafe
- Slack : Indie Hackers, Producthunt makers

### Product Hunt
- Préparer la launch page (preview video 90s, GIF screencast 3 scenes).
- Activer ton réseau perso le jour J (DM personnels la veille).
- Cibler launch un mardi-mercredi (best window historique PH).

---

## 5. Pricing & monétisation — décisions à figer

### Plan Talent
- **Gratuit à vie** — décision figée. C'est l'asset network effect.
- Pas de paywall sur QCM, ranking, profile, opportunités.

### Plan Studio
- **Découverte** gratuit (5 recherches/mois, 1 shortlist) — funnel d'entrée.
- **Pro** 199€/mois — sweet spot pour studios 5-30 personnes.
- **Custom** sur devis — gros studios 50+.

### Gardes-fous
- Pas de commission sur les hires (promesse forte différenciante).
- Annulation 1 clic, pas de relance email agressive.
- Le promis "0% commission Diamant à vie" du système rewards = **engagement
  contractuel risqué** si tu changes d'avis plus tard. À documenter dans
  les CGV studio.

---

## 6. Légal / RGPD — checklist avant launch

- [ ] Page CGU (Conditions Générales d'Utilisation) — actuellement
  référencée dans l'onboarding mais inexistante. Stub `/cgu` à créer.
- [ ] Page Politique de confidentialité — RGPD-compliant.
- [ ] DPA pour Supabase (hébergement EU validé).
- [ ] Cookie banner si analytics chargés (PostHog est anonyme par défaut
  donc OK sans consentement explicite si person_profiles='identified_only').
- [ ] Bouton "Supprimer mon compte" + RGPD data export dans Settings.

---

## 7. Sécurité — checklist anti-cheat avant launch

*(récap des décisions techniques déjà prises)*

- [x] QCM verrouillé 1 mois entre passages (cooldown server-side)
- [x] Lockout multi-clé (user + fingerprint + IP)
- [x] Auto-lockout 90j à 2+ flags high-severity
- [x] qcm_answer_keys table admin-only (RLS)
- [x] Score validé server-side via RPC
- [ ] **HIBP password check** — encore à brancher (voir SUPABASE_SETUP.md TODO)
- [ ] IP hash middleware Next.js (audit Rio anti-cheat-specialist)
- [ ] Rate-limit applicatif sur start/commit RPC
- [ ] Détection bots headless (Playwright/Puppeteer signatures)

---

## 8. Mes notes perso (Jean-Marie)

À remplir au fur et à mesure :

```
2026-XX-XX : ...
```
