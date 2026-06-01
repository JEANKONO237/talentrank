# AGENTS.md

> Studio virtuel permanent — une équipe d'agents IA spécialisés réutilisable sur tous mes projets.

Ce dossier `.claude/agents/` contient 16 agents Claude Code natifs, regroupés par département.
Chaque agent est un fichier `.md` avec un **system prompt spécialisé** + des **principes** + un **format de sortie attendu**.

**Réutilisation entre projets** : copie le dossier `.claude/agents/` dans n'importe quel autre projet (KON'art, jeux web, portfolio, etc.) et les mêmes spécialistes sont disponibles.

---

## Comment invoquer un agent

**Dans une conversation avec Claude Code :**
- *« Utilise l'agent **brand-designer** pour critiquer le logo de KON'art »*
- *« Utilise l'agent **ranking-engineer** pour designer le système de score »*
- *« Demande au **ux-researcher** comment tester ce flow avec 5 utilisateurs »*

**Via le mécanisme Task / Agent tool** :
Claude détecte automatiquement les agents listés ici et peut les invoquer en sous-tâche pour des missions ciblées.

**Combiner plusieurs agents** :
- *« D'abord **product-strategist** pour décider quoi prioriser, puis **frontend-architect** pour planifier l'implémentation »*
- *« **art-director** pour auditer la cohérence visuelle, puis **brand-designer** pour les fixes »*

---

## L'équipe — 16 spécialistes, 6 départements

### 🎨 Design & DA

| Agent | Rôle | Quand l'appeler |
|---|---|---|
| **ui-ux-designer** | UI/UX senior style Duolingo / Linear | "cette page sent le SaaS", layout, hiérarchie, user flow |
| **brand-designer** | Identité de marque, logo, palette, typo | logo, choix de couleurs, system de fonts |
| **motion-designer** | Animations, transitions, micro-interactions | "ça manque de vie", easing, durées, Framer Motion |
| **mascot-designer** | Mascottes, personnages, families | designer un mascot, unifier un cast, choisir le style |
| **art-director** | Cohérence visuelle globale | audit cross-pages, settle disputes design, voice unifié |

### 💻 Frontend

| Agent | Rôle | Quand l'appeler |
|---|---|---|
| **frontend-architect** | Architecture React/Next.js, refactors, perfs | "ce code se dégrade", structure, RSC vs client |
| **accessibility-specialist** | a11y, WCAG, keyboard nav, contrastes | audit a11y, ARIA, focus states, screen readers |

### 🛠️ Backend & IA

| Agent | Rôle | Quand l'appeler |
|---|---|---|
| **backend-architect** | Postgres, Supabase, RLS, API design | data model, sécurité, queries lentes |
| **ranking-engineer** | Systèmes de score / classement / ligue | design d'algo, Elo/Glicko/percentile, anti-gaming |
| **anti-cheat-specialist** | Détection fraude, signaux comportementaux | flags, penalties, review queue |
| **realtime-data-engineer** | Live data, websockets, Supabase Realtime | live leaderboards, presence, activity feed |

### 🎮 Game Design / Engagement

| Agent | Rôle | Quand l'appeler |
|---|---|---|
| **gamification-designer** | Ligues, streaks, badges, progression | designer un loop d'engagement ÉTHIQUE |
| **reward-system-designer** | XP curves, économies, quests | tuner les rewards, éviter l'inflation |

### 📣 Marketing & Brand

| Agent | Rôle | Quand l'appeler |
|---|---|---|
| **copywriter** | Headlines, CTAs, microcopy, FR + EN | écrire / réécrire toute la copy du produit |
| **launch-strategist** | Plans de lancement PH/HN/X/LinkedIn | sequencer un launch, écrire le post hero |
| **viral-content-specialist** | TikTok / Reels / Threads / LinkedIn | hooks viraux, scripts, calendrier contenu |

### 🎯 Product Strategy

| Agent | Rôle | Quand l'appeler |
|---|---|---|
| **product-strategist** | Roadmap, prio, kill-decisions | "doit-on construire X ?", audit du backlog |
| **ux-researcher** | Interviews users, usability tests | designer la recherche, synthétiser les insights |

---

## Workflow recommandé par phase de projet

### Phase 1 — Idée / Validation
```
1. product-strategist  → est-ce que le problème vaut la peine ?
2. ux-researcher       → comment je le valide avec 5 vraies personnes ?
3. brand-designer      → quelle identité émotionnelle ?
4. copywriter          → quel est le pitch en 1 phrase ?
```

### Phase 2 — Design & MVP
```
1. ui-ux-designer        → wireframes, hiérarchie
2. mascot-designer       → la personnalité visuelle
3. brand-designer        → palette + type system
4. frontend-architect    → architecture stack
5. backend-architect     → data model + RLS
```

### Phase 3 — Polish & Launch
```
1. art-director              → audit cohérence cross-pages
2. motion-designer           → micro-interactions
3. accessibility-specialist  → audit a11y final
4. launch-strategist         → plan T-60 jours
5. copywriter                → toute la copy launch + marketing
6. viral-content-specialist  → calendrier social pré-launch
```

### Phase 4 — Engagement / Retention
```
1. gamification-designer     → quels loops, sans dark patterns
2. reward-system-designer    → tuner les XP curves
3. ranking-engineer          → leaderboards crédibles
4. anti-cheat-specialist     → si tu as du compétitif, sécuriser
5. realtime-data-engineer    → si tu as besoin de vivant
```

---

## Exemples d'invocation

**Pour TalentRank :**
> *« Utilise l'agent **ranking-engineer** pour auditer notre formule de score TalentRank — on a 6 dimensions pondérées + un anti-cheat penalty. Est-ce que c'est gameable ? »*

**Pour KON'art (portfolio créatif) :**
> *« Utilise l'agent **brand-designer** pour proposer une palette + type system pour KON'art, un portfolio 3D Generalist. Direction warm + cinematic. »*

**Pour un jeu web :**
> *« Utilise l'agent **gamification-designer** pour designer le système de progression de mon jeu — j'ai des niveaux, je veux ajouter des ligues et des cosmétiques. Donne-moi le loop. »*

**Pour une app mobile :**
> *« Utilise l'agent **ui-ux-designer** pour critiquer cet écran d'onboarding — voici la capture. »*
> *« Puis utilise l'agent **motion-designer** pour proposer 3 micro-interactions qui le rendraient vivant. »*

**Pour préparer un launch :**
> *« Utilise l'agent **launch-strategist** pour me planifier les 60 jours avant le lancement Product Hunt de TalentRank. »*

**Combo audit complet d'un projet :**
> *« Pour la home de TalentRank, fais successivement :*
> *1. Audit **ui-ux-designer***
> *2. Audit **art-director** (cohérence avec le reste du site)*
> *3. Audit **copywriter** (toute la copy)*
> *4. Synthétise les 5 actions prioritaires »*

---

## Conventions des agents

Chaque agent suit le même format :
- **Frontmatter YAML** : `name`, `description` (quand l'utiliser), `model` (sonnet par défaut)
- **Persona** : qui ils sont, leur expérience, leur worldview
- **Principes** : ce qu'ils défendent (3-7 points)
- **Outils mentaux** : frameworks, patterns, vocabulaire technique
- **Format de sortie** : comment ils structurent leurs critiques
- **Common sins** : ce qu'ils dénoncent automatiquement
- **Tone** : leur voix (toujours directe, opiniatre, allergique au vague)

---

## Ajouter un nouvel agent

```bash
# 1. Créer le fichier
.claude/agents/<nom-de-l-agent>.md

# 2. Frontmatter minimum
---
name: nom-de-l-agent
description: Une phrase qui décrit quand l'appeler.
model: sonnet
---

# 3. Le system prompt (en suivant la structure ci-dessus)
```

Garde la même structure que les agents existants pour rester cohérent.

---

## Réutilisation entre projets

```bash
# Copier le dossier d'agents dans un autre projet
cp -r /chemin/talentrank/.claude/agents/ /chemin/autre-projet/.claude/

# Ou créer un symlink (toujours synchronisé)
ln -s /chemin/talentrank/.claude/agents/ /chemin/autre-projet/.claude/agents
```

Pour un usage VRAIMENT global (toutes tes machines), tu peux placer les agents dans `~/.claude/agents/` — Claude Code les trouvera dans tous les projets.

---

## Anti-patterns à éviter

- **N'invoque pas 5 agents pour un truc trivial.** "Quelle couleur pour ce bouton ?" → réponse directe, pas besoin de mobiliser le brand-designer.
- **Ne combine pas des agents qui n'ont rien à voir.** Le copywriter ne va pas t'aider à designer un RLS Postgres.
- **Ne mets pas trop de contexte dans l'invocation.** Donne le problème clair, laisse l'agent appliquer son expertise.
- **Évite les agents génériques.** Si un agent peut répondre à tout, il ne sert à rien. Chaque agent a un domaine précis.

---

**Au lieu de cloner un repo GitHub d'agents génériques, ce système est :**
- ✅ Tailored à ton workflow (typo, ranking, gamification, brand FR/EN)
- ✅ Réutilisable sur tous tes projets
- ✅ Documenté, prêt à étendre
- ✅ Honnête sur ce que les agents peuvent faire (ils consultent / critiquent / proposent — ils ne déploient pas en autonomie)

C'est ton studio virtuel permanent. À toi de l'utiliser.
