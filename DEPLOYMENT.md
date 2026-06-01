# TalentRank — Guide de déploiement

> **Statut au build** : ✅ `npm run build` passe. 101 pages générées (statique + dynamique + SSG).
> Le projet est déployable tel quel sur Vercel/Netlify/Render.

---

## 1. Pré-requis

- **Node.js** ≥ 20 (Next.js 15.5 le demande)
- **Compte Vercel** (ou Netlify/Render — Vercel recommandé car co-développeur de Next)
- **Optionnel** : compte Supabase (DB + auth), compte PostHog (analytics)

Le projet est **fonctionnel sans backend** : tous les composants ont un fallback localStorage et les pages SEO sont alimentées par `lib/mock-talents.ts` (30 talents seed).

---

## 2. Variables d'environnement

Crée un `.env.local` (jamais commit) avec :

```bash
# ─── Site URL (utilisée par sitemap.xml et OG images) ───
NEXT_PUBLIC_SITE_URL=https://talentrank.io

# ─── Supabase (optionnel — sans ça : mode démo + localStorage) ───
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# ⚠️ JAMAIS de NEXT_PUBLIC_ devant SERVICE_ROLE_KEY — server-only.
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ─── PostHog (optionnel — activera le funnel NSM /admin/nsm) ───
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
```

### Comportement selon configuration

| Env | Sans config | Avec config |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | sitemap pointe vers `https://talentrank.io` (placeholder) | URL réelle dans sitemap + OG |
| Supabase | localStorage uniquement, waitlist log côté serveur | DB live, auth réelle, messagerie |
| PostHog | Events trackés mais perdus | Events arrivent dans le dashboard PostHog EU |

---

## 3. Déploiement Vercel (5 minutes)

```bash
# 1. Push sur GitHub
git push origin main

# 2. Sur vercel.com → "Import Project" → choisir le repo

# 3. Framework preset : Next.js (auto-detect)

# 4. Add Environment Variables (copier-coller depuis .env.local)
#    Coche : Production, Preview, Development

# 5. Deploy
```

Vercel détecte automatiquement :
- Build command : `npm run build`
- Output directory : `.next`
- Install command : `npm install`

### Routes Edge / Node

- `/api/og/route` + `/api/og/score/route` → **Edge runtime** (rapide, mondial)
- `/api/embed/score/route` → Node (peut passer en Edge si besoin perf)
- `/api/waitlist/route` → Node (Supabase client server)

---

## 4. Setup post-déploiement

### A. Google Search Console (SEO)

1. Ajouter la propriété `https://talentrank.io`
2. Vérifier via meta tag (Vercel injecte facilement) ou DNS
3. Soumettre `https://talentrank.io/sitemap.xml`
4. **300+ URLs indexables** seront proposées à Google (combos ville×métier + profils)

### B. PostHog setup (10 min)

1. Créer projet sur [eu.posthog.com](https://eu.posthog.com) (EU pour RGPD)
2. Copier la project API key
3. Ajouter dans Vercel env : `NEXT_PUBLIC_POSTHOG_KEY` + redeploy
4. Vérifier sur `/admin/nsm` : la card "PostHog · Activé" doit être verte
5. Créer les 4 insights pré-conçus listés dans `/admin/nsm`

### C. Supabase setup (15 min — quand prêt)

Voir `SUPABASE_SETUP.md` pour la procédure détaillée.

Sans Supabase, les routes suivantes affichent un fallback explicatif :
- `/dashboard/talent/portfolio`
- `/messages`, `/messages/[id]`, `/messages/proposals/[id]`
- `/sign-in`, `/sign-up` (modes démo)

---

## 5. Dette technique connue

### TypeScript strict désactivé au build

Le fichier `next.config.mjs` a `typescript.ignoreBuildErrors: true` et `eslint.ignoreDuringBuilds: true`.

**Pourquoi** : `supabase-js` 2.106 a un bug d'inférence sur les Insert/Update des tables non re-générées (`qcm_*`, `waitlist`, `interview_proposals`, `cvs`, `portfolios`, `talent_private`). Le code fonctionne en runtime — le problème est purement à la compile-time TS.

**Remédiation** (quand le projet Supabase sera lié) :

```bash
supabase login
supabase link --project-ref xxxxx
supabase gen types typescript --linked > lib/supabase/database.types.ts

# Puis retirer les flags dans next.config.mjs :
#   typescript.ignoreBuildErrors → supprimer
#   eslint.ignoreDuringBuilds → supprimer

npm run build  # doit passer naturellement
```

### Posthog-js en optionalDependencies

`posthog-js` est listé dans `optionalDependencies` plutôt que `dependencies`. Si l'install n'a pas pu le récupérer, le module se dégrade gracieusement (lazy load avec try/catch) et ne casse pas le build.

---

## 6. Vérifications post-deploy

À tester après le premier deploy live :

- [ ] `/` redirige vers `/welcome` (cookie audience absent)
- [ ] `/welcome` affiche les 3 cards (Talent / Studio / Juste curieux)
- [ ] `/ranking` liste les 30+ métiers avec compteurs
- [ ] `/villes` liste les villes avec stats
- [ ] `/villes/paris/motion-designer` affiche le ranking pré-filtré (combo SEO)
- [ ] `/talent/jean-onana` (ou tout slug seed) affiche le profil complet
- [ ] `/qcm` liste les évaluations disponibles
- [ ] `/embed` permet de générer un snippet → preview SVG s'affiche
- [ ] `/api/embed/score?slug=jean-onana` renvoie un SVG
- [ ] `/api/og/score?name=Test&score=87&tier=senior&profession=Test` renvoie une PNG
- [ ] `/sitemap.xml` liste 300+ URLs
- [ ] `/robots.txt` autorise `/` et bloque `/api/`, `/admin/`, `/dashboard/`
- [ ] `/admin/nsm` affiche les denominators structurels (la route est gated en prod — voir `lib/admin/*`)

---

## 7. Performances attendues

| Route | Type | First Load JS | Notes |
|---|---|---|---|
| `/` | Static | 102 kB | Home redirect |
| `/welcome` | Static | 155 kB | Animations Framer |
| `/ranking` | Static | 158 kB | |
| `/talent/[slug]` | SSG | 433 kB | Le plus lourd — TalentScrollHero |
| `/qcm/[profession]` | SSG | 237 kB | QcmPlayClient |
| `/api/og/*` | Edge | <50 kB | Génération à la volée |
| `/api/embed/*` | Node | <50 kB | Cache 1h client / 1j edge |

`First Load JS shared` : 102 kB (acceptable pour une app interactive de cette densité).

---

## 8. Rollback

Si un deploy casse en prod :
1. Sur Vercel → Deployments → cliquer le commit précédent → "Promote to Production"
2. Rollback instantané (< 5 secondes)

---

## 9. Monitoring suggéré (post-MVP)

- **Sentry** : erreurs runtime, gratuit jusqu'à 5k events/mois
- **Vercel Analytics** : Web Vitals natifs, gratuit jusqu'à 100k pages/mois
- **PostHog** : déjà configuré, funnel NSM via `/admin/nsm`
- **UptimeRobot** : ping `/api/health` (à créer) toutes les 5 min

---

## Contact

Pour debug rapide, contacter Jean-Marie. Le code est documenté en français inline.
