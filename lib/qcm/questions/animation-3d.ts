// 3D Animator — QCM question bank
// ----------------------------------------------------------------------------
// Axes (the user's list, kept verbatim):
//   rig · timing · acting · unreal · maya · pipeline · lighting · storytelling
//
// Each question is hand-authored. Adding more questions = adding more entries
// to QUESTIONS; the engine auto-balances difficulty + axis coverage when
// selecting a per-attempt subset (see lib/qcm/registry.ts).

import type { QcmBank, Question, SkillAxis } from "../types";

const AXES: SkillAxis[] = [
  { id: "rig",          label: "Rigging",       frLabel: "Rig" },
  { id: "timing",       label: "Timing",        frLabel: "Timing" },
  { id: "acting",       label: "Acting",        frLabel: "Acting" },
  { id: "unreal",       label: "Unreal Engine", frLabel: "Unreal Engine" },
  { id: "maya",         label: "Maya",          frLabel: "Maya" },
  { id: "pipeline",     label: "Pipeline",      frLabel: "Pipeline" },
  { id: "lighting",     label: "Lighting",      frLabel: "Lumière" },
  { id: "storytelling", label: "Storytelling",  frLabel: "Storytelling" },
];

const QUESTIONS: Question[] = [
  // ── Rig ────────────────────────────────────────────────────────────────────
  {
    id: "anim3d-rig-001",
    professionId: "animation-3d",
    axisId: "rig",
    difficulty: "beginner",
    expectedSeconds: 18,
    prompt: "Quelle est la principale différence entre un FK et un IK sur un bras ?",
    options: [
      { id: "a", text: "FK calcule la position depuis la racine, IK depuis l'effecteur final.", correct: true,
        explanation: "FK propage rotation parent → enfant. IK calcule les rotations pour que la main atteigne une cible." },
      { id: "b", text: "FK est utilisé pour les jambes, IK pour les bras.", correct: false },
      { id: "c", text: "IK ne fonctionne qu'en cinematic, FK en gameplay.", correct: false },
      { id: "d", text: "Aucune différence — c'est un alias.", correct: false },
    ],
    tags: ["fk", "ik", "fondamentaux"],
  },
  {
    id: "anim3d-rig-002",
    professionId: "animation-3d",
    axisId: "rig",
    difficulty: "advanced",
    expectedSeconds: 35,
    prompt:
      "Un personnage a un genou qui « pète » (snap) quand la jambe s'approche de la complète extension. Cause la plus probable ?",
    options: [
      { id: "a", text: "Le pole vector est trop proche du genou.", correct: false },
      { id: "b", text: "Le solveur IK perd sa pliure quand le membre est tendu — il faut un soft IK ou stretch.", correct: true,
        explanation: "Quand le membre approche de la longueur max, le solveur oscille entre deux orientations possibles. Soft IK ou un système stretch résout le snap." },
      { id: "c", text: "Le skin weight du genou est mal painté.", correct: false },
      { id: "d", text: "La hiérarchie du squelette est inversée.", correct: false },
    ],
    tags: ["ik", "soft-ik", "debug"],
  },

  // ── Timing ─────────────────────────────────────────────────────────────────
  {
    id: "anim3d-timing-001",
    professionId: "animation-3d",
    axisId: "timing",
    difficulty: "beginner",
    expectedSeconds: 15,
    prompt: "À 24 fps, combien de frames durent typiquement les anticipation+strike d'un punch dynamique ?",
    options: [
      { id: "a", text: "1-2 frames d'anticipation, 1 frame d'impact.", correct: false },
      { id: "b", text: "6-10 frames d'anticipation, 2-4 frames d'impact.", correct: true,
        explanation: "L'anticipation lente vend l'impact rapide — règle des contrastes timing." },
      { id: "c", text: "24 frames d'anticipation, 12 frames d'impact.", correct: false },
      { id: "d", text: "Toujours la même durée pour les deux phases.", correct: false },
    ],
    tags: ["principes", "contrast"],
  },
  {
    id: "anim3d-timing-002",
    professionId: "animation-3d",
    axisId: "timing",
    difficulty: "intermediate",
    expectedSeconds: 25,
    prompt:
      "Un saut a l'air mou. Tu observes que les frames apex+1 et apex-1 sont identiques. Que fais-tu en priorité ?",
    options: [
      { id: "a", text: "Réduire le nombre total de frames du saut.", correct: false },
      { id: "b", text: "Tenir la pose d'apex sur 2-3 frames pour vendre le pic puis accélérer la descente.", correct: true,
        explanation: "« Slow in / Slow out » à l'apex donne le poids ; sans ça le saut semble flotter." },
      { id: "c", text: "Ajouter des inbetweens linéaires.", correct: false },
      { id: "d", text: "Augmenter le motion blur.", correct: false },
    ],
    tags: ["arcs", "slow-in-out"],
  },
  {
    id: "anim3d-timing-003",
    professionId: "animation-3d",
    axisId: "timing",
    difficulty: "advanced",
    expectedSeconds: 30,
    prompt:
      "Sur une marche cycle de 32 frames à 24 fps, à quelle frame placer typiquement le passing position ?",
    options: [
      { id: "a", text: "Frame 8", correct: true,
        explanation: "Passing à 1/4 de cycle (frame 8 sur 32) — pied opposé en plein swing, weight transfer en cours." },
      { id: "b", text: "Frame 16", correct: false },
      { id: "c", text: "Frame 24", correct: false },
      { id: "d", text: "Frame 32", correct: false },
    ],
    tags: ["walk-cycle", "key-poses"],
  },

  // ── Acting ─────────────────────────────────────────────────────────────────
  {
    id: "anim3d-acting-001",
    professionId: "animation-3d",
    axisId: "acting",
    difficulty: "intermediate",
    expectedSeconds: 25,
    prompt: "Un personnage écoute une mauvaise nouvelle. Quel choix d'acting est le plus fort ?",
    options: [
      { id: "a", text: "Réaction faciale immédiate + bras qui retombent.", correct: false },
      { id: "b", text: "Beat de stillness 8-12 frames puis micro-mouvement de tête.", correct: true,
        explanation: "Les silences vendent l'émotion. La réaction trop rapide tue le sous-texte." },
      { id: "c", text: "Pleurer immédiatement.", correct: false },
      { id: "d", text: "Détourner le regard puis revenir.", correct: false },
    ],
    tags: ["sous-texte", "stillness"],
  },
  {
    id: "anim3d-acting-002",
    professionId: "animation-3d",
    axisId: "acting",
    difficulty: "advanced",
    expectedSeconds: 35,
    prompt: "Dans une scène de dialogue, l'œil dominant du personnage doit :",
    options: [
      { id: "a", text: "Rester fixe sur la caméra.", correct: false },
      { id: "b", text: "Bouger d'abord, le second œil suit avec 1-2 frames de décalage.", correct: true,
        explanation: "L'asymétrie des yeux donne la vie. Yeux qui bougent à l'unisson = look de poupée." },
      { id: "c", text: "Toujours bouger en même temps que la tête.", correct: false },
      { id: "d", text: "Ne jamais bouger pendant le dialogue.", correct: false },
    ],
    tags: ["eyes", "subtle"],
  },

  // ── Unreal ─────────────────────────────────────────────────────────────────
  {
    id: "anim3d-unreal-001",
    professionId: "animation-3d",
    axisId: "unreal",
    difficulty: "intermediate",
    expectedSeconds: 25,
    prompt: "Dans Unreal, quel asset gère la transition fluide entre Idle, Walk et Run ?",
    options: [
      { id: "a", text: "Animation Sequence", correct: false },
      { id: "b", text: "Blend Space", correct: true,
        explanation: "Le Blend Space interpole entre clips selon une (ou deux) variables — typiquement speed/direction." },
      { id: "c", text: "Montage", correct: false },
      { id: "d", text: "Niagara System", correct: false },
    ],
    tags: ["blend-space", "locomotion"],
  },
  {
    id: "anim3d-unreal-002",
    professionId: "animation-3d",
    axisId: "unreal",
    difficulty: "advanced",
    expectedSeconds: 30,
    prompt: "Un Anim Notify déclenché par une montage step ne joue jamais le son. Cause la plus probable ?",
    options: [
      { id: "a", text: "La courbe de blend out coupe le notify avant qu'il ne fire.", correct: true,
        explanation: "Si le blend-out commence avant le frame du notify, l'animation graph saute la fenêtre du notify." },
      { id: "b", text: "Le sound asset n'est pas en wav.", correct: false },
      { id: "c", text: "Le Skeletal Mesh n'a pas de physics asset.", correct: false },
      { id: "d", text: "Le montage n'est pas attaché au character BP.", correct: false },
    ],
    tags: ["anim-notify", "montage", "debug"],
  },

  // ── Maya ───────────────────────────────────────────────────────────────────
  {
    id: "anim3d-maya-001",
    professionId: "animation-3d",
    axisId: "maya",
    difficulty: "beginner",
    expectedSeconds: 12,
    prompt: "Dans Maya, quel raccourci définit une key sur tous les channels animés du sélectionné ?",
    options: [
      { id: "a", text: "S", correct: true,
        explanation: "S = Set Key. Shift+W/E/R pour translate/rotate/scale uniquement." },
      { id: "b", text: "K", correct: false },
      { id: "c", text: "Insert", correct: false },
      { id: "d", text: "Ctrl+K", correct: false },
    ],
    tags: ["shortcuts"],
  },
  {
    id: "anim3d-maya-002",
    professionId: "animation-3d",
    axisId: "maya",
    difficulty: "intermediate",
    expectedSeconds: 25,
    prompt:
      "Un contrôleur Maya ne répond plus aux clés malgré des keyframes visibles dans la Graph Editor. Premier endroit où chercher ?",
    options: [
      { id: "a", text: "Le scale du rig root.", correct: false },
      { id: "b", text: "Les input connections du contrôleur — un constraint peut surcharger.", correct: true,
        explanation: "Un constraint actif court-circuite les keys. Vérifier Hypergraph Input ou bypasser." },
      { id: "c", text: "L'export FBX preset.", correct: false },
      { id: "d", text: "Le viewport renderer.", correct: false },
    ],
    tags: ["debug", "constraints"],
  },

  // ── Pipeline ───────────────────────────────────────────────────────────────
  {
    id: "anim3d-pipeline-001",
    professionId: "animation-3d",
    axisId: "pipeline",
    difficulty: "advanced",
    expectedSeconds: 35,
    prompt: "Dans une pipeline animation → game, le standard d'export pour préserver les courbes natives est :",
    options: [
      { id: "a", text: "OBJ", correct: false },
      { id: "b", text: "Alembic", correct: false },
      { id: "c", text: "FBX en baked keys, 1 key par frame.", correct: true,
        explanation: "Pour game (Unity/Unreal), bake 1 key/frame en FBX garantit la même lecture en runtime." },
      { id: "d", text: "USD avec curves non-bakées.", correct: false },
    ],
    tags: ["fbx", "export"],
  },
  {
    id: "anim3d-pipeline-002",
    professionId: "animation-3d",
    axisId: "pipeline",
    difficulty: "expert",
    expectedSeconds: 45,
    prompt:
      "Sur un long shot avec 200+ assets référencés, Maya freeze à l'ouverture. Stratégie pipeline la plus saine ?",
    options: [
      { id: "a", text: "Tout importer dans un seul fichier.", correct: false },
      { id: "b", text: "Utiliser des proxies / standins (.abc ou .ass) + références sélectives.", correct: true,
        explanation: "Les proxies maintiennent la perf du viewport ; les références complètes sont chargées seulement pour le rendu." },
      { id: "c", text: "Augmenter la RAM Maya via mel.", correct: false },
      { id: "d", text: "Désactiver Time Slider.", correct: false },
    ],
    tags: ["proxies", "scaling"],
  },

  // ── Lighting ───────────────────────────────────────────────────────────────
  {
    id: "anim3d-lighting-001",
    professionId: "animation-3d",
    axisId: "lighting",
    difficulty: "intermediate",
    expectedSeconds: 25,
    prompt: "Quel rôle joue la rim light dans un setup 3-point classique ?",
    options: [
      { id: "a", text: "Éclairer uniformément le sujet.", correct: false },
      { id: "b", text: "Détacher le sujet du fond en accrochant son contour.", correct: true,
        explanation: "Rim/Back light = silhouette + profondeur. Sans elle le sujet se fond dans le décor." },
      { id: "c", text: "Donner la couleur dominante.", correct: false },
      { id: "d", text: "Remplir les ombres.", correct: false },
    ],
    tags: ["3-point", "silhouette"],
  },
  {
    id: "anim3d-lighting-002",
    professionId: "animation-3d",
    axisId: "lighting",
    difficulty: "advanced",
    expectedSeconds: 30,
    prompt:
      "Un personnage en intérieur paraît plat malgré une lumière directionnelle forte. Quel ajustement le plus pertinent ?",
    options: [
      { id: "a", text: "Augmenter l'exposition globale.", correct: false },
      { id: "b", text: "Ajouter une bounce light tiède opposée à la key + un fill froid faible.", correct: true,
        explanation: "L'opposition chaud/froid donne la profondeur. La bounce simule l'environnement, le fill froid les zones d'ombre." },
      { id: "c", text: "Activer le motion blur.", correct: false },
      { id: "d", text: "Désactiver les shadows ray-traced.", correct: false },
    ],
    tags: ["bounce", "color-temperature"],
  },

  // ── Storytelling ───────────────────────────────────────────────────────────
  {
    id: "anim3d-story-001",
    professionId: "animation-3d",
    axisId: "storytelling",
    difficulty: "intermediate",
    expectedSeconds: 25,
    prompt: "Dans un plan de dialogue, où placer typiquement le moment de gaze shift du personnage qui écoute ?",
    options: [
      { id: "a", text: "Au milieu de la phrase de l'autre.", correct: false },
      { id: "b", text: "Juste avant que l'écoutant prenne la parole — ça annonce sa pensée.", correct: true,
        explanation: "Le regard signale l'intention. Avant la prise de parole = le spectateur sait qu'il va parler." },
      { id: "c", text: "À chaque mot.", correct: false },
      { id: "d", text: "Jamais.", correct: false },
    ],
    tags: ["dialogue", "intention"],
  },
];

export const ANIMATION_3D_BANK: QcmBank = {
  professionId: "animation-3d",
  frLabel: "Animateur 3D",
  axes: AXES,
  questions: QUESTIONS,
};
