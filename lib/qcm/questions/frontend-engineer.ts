// Frontend Engineer — QCM question bank
// ----------------------------------------------------------------------------
// Axes (user-listed):
//   logic · architecture · debugging · security · algorithms · clean-code

import type { QcmBank, Question, SkillAxis } from "../types";

const AXES: SkillAxis[] = [
  { id: "logic",        label: "Logic",        frLabel: "Logique" },
  { id: "architecture", label: "Architecture", frLabel: "Architecture" },
  { id: "debugging",    label: "Debugging",    frLabel: "Debugging" },
  { id: "security",     label: "Security",     frLabel: "Sécurité" },
  { id: "algorithms",   label: "Algorithms",   frLabel: "Algorithmie" },
  { id: "clean-code",   label: "Clean code",   frLabel: "Clean code" },
];

const QUESTIONS: Question[] = [
  // ── Logic ──────────────────────────────────────────────────────────────────
  {
    id: "front-logic-001",
    professionId: "frontend-engineer",
    axisId: "logic",
    difficulty: "beginner",
    expectedSeconds: 20,
    prompt: "En JavaScript, que retourne `[] + []` ?",
    options: [
      { id: "a", text: "0", correct: false },
      { id: "b", text: "\"\" (chaîne vide)", correct: true,
        explanation: "Coercion implicite : chaque [] devient \"\" puis concatène." },
      { id: "c", text: "[]", correct: false },
      { id: "d", text: "undefined", correct: false },
    ],
    tags: ["coercion"],
  },
  {
    id: "front-logic-002",
    professionId: "frontend-engineer",
    axisId: "logic",
    difficulty: "intermediate",
    expectedSeconds: 25,
    prompt: "Quel est le résultat de `Promise.all([Promise.resolve(1), Promise.reject('x'), Promise.resolve(3)])` ?",
    options: [
      { id: "a", text: "[1, 'x', 3]", correct: false },
      { id: "b", text: "[1, 3]", correct: false },
      { id: "c", text: "Une promesse rejected avec 'x'.", correct: true,
        explanation: "Promise.all fail-fast : la première reject rejette tout. Pour ignorer les rejets, utiliser allSettled." },
      { id: "d", text: "Une promesse fulfilled avec [1, undefined, 3].", correct: false },
    ],
    tags: ["promises"],
  },

  // ── Architecture ───────────────────────────────────────────────────────────
  {
    id: "front-arch-001",
    professionId: "frontend-engineer",
    axisId: "architecture",
    difficulty: "intermediate",
    expectedSeconds: 30,
    prompt:
      "Dans une SPA React, où vit idéalement l'état dérivé d'un fetch (loading/error/data) ?",
    options: [
      { id: "a", text: "Dans un useState local couplé à useEffect.", correct: false },
      { id: "b", text: "Dans une lib dédiée (React Query, SWR, RTK Query) qui dé-duplique et cache.", correct: true,
        explanation: "Le pattern useState+useEffect est correct techniquement mais réinvente cache/dedup/retry à chaque feature. Une lib data-fetching élimine ces classes de bugs." },
      { id: "c", text: "Dans le store global Redux.", correct: false },
      { id: "d", text: "Dans le localStorage.", correct: false },
    ],
    tags: ["data-fetching", "react"],
  },
  {
    id: "front-arch-002",
    professionId: "frontend-engineer",
    axisId: "architecture",
    difficulty: "advanced",
    expectedSeconds: 40,
    prompt:
      "Le bundle JS d'une route admin dépasse 1.2 Mo gzippé alors que la home tient en 80 ko. Action la plus impactante ?",
    options: [
      { id: "a", text: "Activer minification supplémentaire.", correct: false },
      { id: "b", text: "Splitter la route admin via dynamic import + lazy() — elle ne sera chargée que pour les admins.", correct: true,
        explanation: "Code splitting par route est la première arme. Les utilisateurs publics ne paient pas le poids admin." },
      { id: "c", text: "Réécrire en JS vanilla.", correct: false },
      { id: "d", text: "Ajouter du gzip côté CDN.", correct: false },
    ],
    tags: ["bundle-size", "code-splitting"],
  },
  {
    id: "front-arch-003",
    professionId: "frontend-engineer",
    axisId: "architecture",
    difficulty: "expert",
    expectedSeconds: 50,
    prompt:
      "Tu dois designer un design system consommé par 6 produits. Quelle stratégie de versioning + distribution ?",
    options: [
      { id: "a", text: "Package npm unique en SemVer strict, design tokens en CSS vars, breaking changes via codemods.", correct: true,
        explanation: "SemVer + tokens externalisés + codemods = scale propre. Les autres options créent du drift entre produits." },
      { id: "b", text: "Copier-coller les composants dans chaque repo.", correct: false },
      { id: "c", text: "Une CDN versionnée avec script tags.", correct: false },
      { id: "d", text: "Un monorepo avec composants en local imports only.", correct: false },
    ],
    tags: ["design-system", "semver"],
  },

  // ── Debugging ──────────────────────────────────────────────────────────────
  {
    id: "front-debug-001",
    professionId: "frontend-engineer",
    axisId: "debugging",
    difficulty: "intermediate",
    expectedSeconds: 30,
    prompt:
      "Une page se freeze ~2s au chargement. Le réseau est OK. Quel outil DevTools ouvres-tu en premier ?",
    options: [
      { id: "a", text: "Network panel.", correct: false },
      { id: "b", text: "Performance panel pour profiler les long tasks JS.", correct: true,
        explanation: "Le freeze + réseau OK signe une long task JS bloquante. Performance panel montre la main thread frame par frame." },
      { id: "c", text: "Console.", correct: false },
      { id: "d", text: "Application > Storage.", correct: false },
    ],
    tags: ["devtools", "performance"],
  },
  {
    id: "front-debug-002",
    professionId: "frontend-engineer",
    axisId: "debugging",
    difficulty: "advanced",
    expectedSeconds: 40,
    prompt:
      "Un useEffect ré-exécute en boucle alors que ses dépendances semblent stables. Cause la plus fréquente ?",
    options: [
      { id: "a", text: "Strict Mode est activé.", correct: false },
      { id: "b", text: "Une dépendance est un objet/array littéral recréé à chaque render.", correct: true,
        explanation: "Référence-equality : `useEffect(..., [{x:1}])` change à chaque render. Memoise avec useMemo ou sors la valeur." },
      { id: "c", text: "React 19 a un bug.", correct: false },
      { id: "d", text: "Le composant est dans un Suspense boundary.", correct: false },
    ],
    tags: ["react", "hooks"],
  },

  // ── Security ───────────────────────────────────────────────────────────────
  {
    id: "front-sec-001",
    professionId: "frontend-engineer",
    axisId: "security",
    difficulty: "advanced",
    expectedSeconds: 35,
    prompt:
      "Pour protéger un cookie d'authentification contre vol via XSS, le drapeau crucial est :",
    options: [
      { id: "a", text: "Secure", correct: false },
      { id: "b", text: "HttpOnly — empêche JavaScript de lire le cookie.", correct: true,
        explanation: "HttpOnly = invisible à document.cookie. Secure protège du sniffing réseau. SameSite réduit le CSRF." },
      { id: "c", text: "SameSite=Strict", correct: false },
      { id: "d", text: "Max-Age courte.", correct: false },
    ],
    tags: ["xss", "cookies"],
  },
  {
    id: "front-sec-002",
    professionId: "frontend-engineer",
    axisId: "security",
    difficulty: "expert",
    expectedSeconds: 50,
    prompt: "Tu reçois du HTML user-généré à afficher. Stratégie la plus saine ?",
    options: [
      { id: "a", text: "Concaténer directement avec innerHTML.", correct: false },
      { id: "b", text: "DOMPurify côté client + politique CSP stricte (no inline scripts).", correct: true,
        explanation: "Sanitization de la sortie + CSP en defense-in-depth. Ne JAMAIS faire confiance à du HTML user-supplied même 'pre-sanitized' côté serveur." },
      { id: "c", text: "Escape juste les < et >.", correct: false },
      { id: "d", text: "Stocker en base64 puis décoder à l'affichage.", correct: false },
    ],
    tags: ["xss", "csp", "sanitization"],
  },

  // ── Algorithms ─────────────────────────────────────────────────────────────
  {
    id: "front-algo-001",
    professionId: "frontend-engineer",
    axisId: "algorithms",
    difficulty: "intermediate",
    expectedSeconds: 30,
    prompt: "Complexité moyenne d'un lookup dans une Map JS pour une clé string ?",
    options: [
      { id: "a", text: "O(n)", correct: false },
      { id: "b", text: "O(log n)", correct: false },
      { id: "c", text: "O(1) amorti (hash table).", correct: true,
        explanation: "Map utilise un hash en interne. O(1) amorti — worst case O(n) en cas de collisions massives." },
      { id: "d", text: "O(n log n)", correct: false },
    ],
    tags: ["complexity"],
  },
  {
    id: "front-algo-002",
    professionId: "frontend-engineer",
    axisId: "algorithms",
    difficulty: "advanced",
    expectedSeconds: 45,
    prompt:
      "Tu dois implémenter un autocomplete sur 50 000 strings côté client avec ~200ms de budget. Structure optimale ?",
    options: [
      { id: "a", text: "Array.filter avec includes() à chaque keystroke.", correct: false },
      { id: "b", text: "Trie / radix tree pré-construit + recherche par préfixe.", correct: true,
        explanation: "Un trie pré-built donne du O(L) où L = longueur du préfixe. Filter linéaire est O(N×L), insuffisant à 50k." },
      { id: "c", text: "Régex compilée à chaque frappe.", correct: false },
      { id: "d", text: "Récursion sur un tableau trié.", correct: false },
    ],
    tags: ["trie", "autocomplete"],
  },

  // ── Clean code ─────────────────────────────────────────────────────────────
  {
    id: "front-clean-001",
    professionId: "frontend-engineer",
    axisId: "clean-code",
    difficulty: "intermediate",
    expectedSeconds: 30,
    prompt:
      "Tu vois `if (user.role === 'admin' || user.role === 'superadmin' || user.role === 'owner')` répété dans 12 fichiers. Refactor le plus propre ?",
    options: [
      { id: "a", text: "Ajouter un commentaire.", correct: false },
      { id: "b", text: "Extraire `canEditEverything(user)` dans un module permissions.", correct: true,
        explanation: "Nommer le concept métier (\"qui peut tout éditer\") élimine la duplication ET ajoute du sens. Aussi changement central." },
      { id: "c", text: "Mettre la liste de rôles en constante globale.", correct: false },
      { id: "d", text: "Utiliser un switch.", correct: false },
    ],
    tags: ["refactor", "permissions"],
  },
];

export const FRONTEND_ENGINEER_BANK: QcmBank = {
  professionId: "frontend-engineer",
  frLabel: "Développeur Frontend",
  axes: AXES,
  questions: QUESTIONS,
};
