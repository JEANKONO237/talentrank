# TalentRank — Supabase Setup (5 minutes)

Tu n'as pas encore de projet Supabase live. Voici les étapes pour brancher
l'app sur une vraie base. Tant que tu ne le fais pas, tout reste en
localStorage (mode démo) — l'app fonctionne, mais aucun email n'est capturé,
aucun signup persisté, aucun ranking calculé.

## 1. Créer le projet Supabase (2 min)

1. Va sur https://supabase.com → **Sign in** (GitHub OK)
2. **New project** :
   - Name : `talentrank-dev` (ou ce que tu veux)
   - DB password : génère un mot de passe fort, garde-le précieusement
   - Region : `Europe (Paris)` ou la plus proche
   - Plan : **Free** suffit pour le dev
3. Attends ~2 min que le projet provisionne.

## 2. Récupérer les clés (30 s)

Dans le dashboard du projet → **Settings → API** :

- `Project URL` → c'est ton `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → c'est ton `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → c'est ton `SUPABASE_SERVICE_ROLE_KEY` (**JAMAIS** côté client)

## 3. Créer `.env.local` à la racine du projet

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

⚠️ `.env.local` est dans `.gitignore` — ne le commit jamais.

## 4. Appliquer les migrations (2 min)

Deux options :

### Option A — Via le Supabase Studio (UI simple)

1. Dashboard projet → **SQL Editor** → **New query**
2. Ouvre les 23 fichiers de `supabase/migrations/` dans l'ordre (0001 → 0023)
3. Copie-colle leur contenu dans l'éditeur, **Run** à chaque fois
4. Si une erreur arrive, arrête et envoie-moi le message

### Option B — Via la CLI Supabase (plus rapide)

```bash
npm install -g supabase
supabase login
supabase link --project-ref <ton-project-ref>  # le ref est dans l'URL
supabase db push
```

## 5. Configurer l'auth (1 min)

Dashboard projet → **Authentication → URL Configuration** :

- **Site URL** : `http://localhost:3000`
- **Redirect URLs** : `http://localhost:3000/**`

→ Configure → **Save**

## 6. (Optionnel) Seeder les questions QCM

Une fois `.env.local` rempli + migrations appliquées :

```bash
npx tsx scripts/seed-qcm-answer-keys.ts
```

Ça pousse les bonnes réponses des 3 banks (animation-3d, frontend-engineer,
baker) vers `qcm_answer_keys` côté DB.

## 7. Restart le dev server

```bash
# Stop le serveur actuel (Ctrl+C dans le terminal qui fait `npm run dev`)
npm run dev
```

Au reload, `isSupabaseConfigured` devient `true` et tous les flows passent
en mode réel. L'onboarding crée des vrais users, le profil persiste en DB,
le `/chasse` montre les vrais talents.

## TODO Sécurité — à brancher quand auth est live

**HIBP password check** (audit Anya G2-Anya-5) : vérifier qu'un mot de passe
n'est pas dans les leaked databases via l'API HaveIBeenPwned. Requires un
endpoint server-side (CORS bloque le call direct depuis le browser).

Implementation suggérée :
1. Route `app/api/check-password/route.ts` qui appelle
   `https://api.pwnedpasswords.com/range/{prefix-5-chars-sha1}`
2. Compare le suffix dans la réponse → si match, refuse le password
3. Wire dans `completeOnboarding` (server action) avant `auth.signUp`

Sans ça : la password strength visuelle (computeStrength) est notre seul
filet de sécurité — acceptable v1, à muscler pour le launch.

## Troubleshooting

**"Invalid API key"** → tu as copié `service_role_key` au lieu de `anon`. Vérifier.

**"Row level security policy violation"** → certaines RLS exigent un user authentifié. Connecte-toi avant de tester un endpoint protégé.

**"relation does not exist"** → une migration n'est pas passée. Re-vérifier dans Studio → Table Editor que les tables (`profiles`, `talents`, `qcm_attempts`, etc.) sont créées.
